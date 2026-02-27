import db from '../models/index.js';
import { reportIncident } from './userController.js';

const { UserReport, Personnel, Event, Sequelize } = db;

const ALLOWED_MEDIA_TYPES = new Set(['photo', 'video', 'unknown']);
const ALLOWED_STATUS = new Set(['new', 'assigned', 'in_progress', 'resolved', 'rejected']);

function ensureAdmin(req, res) {
  if (!req.user || req.user.role !== 'admin') {
    res.status(403).json({ error: 'Only admins can manage user reports' });
    return false;
  }
  return true;
}

function normalizePagination(pageParam, limitParam) {
  const page = Math.max(Number(pageParam) || 1, 1);
  const limit = Math.min(Math.max(Number(limitParam) || 10, 1), 100);
  const offset = (page - 1) * limit;
  return { page, limit, offset };
}

function normalizeMediaType(mediaType) {
  if (!mediaType) return 'unknown';
  const value = String(mediaType).toLowerCase();
  return ALLOWED_MEDIA_TYPES.has(value) ? value : 'unknown';
}

function pointFromLatLng(lat, lng) {
  if (lat === undefined || lng === undefined || lat === null || lng === null || lat === '' || lng === '') {
    return null;
  }

  const parsedLat = Number(lat);
  const parsedLng = Number(lng);
  if (Number.isNaN(parsedLat) || Number.isNaN(parsedLng)) {
    const err = new Error('lat and lng must be valid numbers');
    err.statusCode = 400;
    throw err;
  }

  if (parsedLat < -90 || parsedLat > 90) {
    const err = new Error('lat must be between -90 and 90');
    err.statusCode = 400;
    throw err;
  }

  if (parsedLng < -180 || parsedLng > 180) {
    const err = new Error('lng must be between -180 and 180');
    err.statusCode = 400;
    throw err;
  }

  return {
    type: 'Point',
    coordinates: [parsedLng, parsedLat]
  };
}

function extractLatLng(location) {
  const coordinates = location?.coordinates;
  if (!Array.isArray(coordinates) || coordinates.length < 2) {
    return { lat: null, lng: null };
  }

  return {
    lng: Number(coordinates[0]),
    lat: Number(coordinates[1])
  };
}

function mapReportOutput(report, eventTitleMap = new Map()) {
  const { lat, lng } = extractLatLng(report.location);

  return {
    id: report.id,
    event_id: report.event_id,
    event_title: eventTitleMap.get(report.event_id) || null,
    global_user_id: report.global_user_id,
    incident_type: report.incident_type,
    description: report.description,
    location_name: report.location_name,
    lat,
    lng,
    media_url: report.media_url,
    media_type: report.media_type,
    status: report.status,
    assigned_responder_id: report.assigned_responder_id,
    assigned_responder_name: report.assignedResponder?.name || null,
    assigned_at: report.assigned_at,
    createdAt: report.createdAt,
    updatedAt: report.updatedAt
  };
}

async function validateEventBelongsToBusiness(eventId, businessCode) {
  const event = await Event.findOne({
    where: {
      id: eventId,
      business_code: businessCode,
      is_active: true
    }
  });

  if (!event) {
    const err = new Error('Selected event is invalid for this business');
    err.statusCode = 400;
    throw err;
  }

  return event;
}

export async function listUserReports(req, res, next) {
  try {
    if (!ensureAdmin(req, res)) return;

    const schema = req.tenantSchema;
    const businessCode = req.businessCode;
    const { page, limit, offset } = normalizePagination(req.query.page, req.query.limit);
    const search = String(req.query.search || '').trim();
    const status = String(req.query.status || '').trim().toLowerCase();

    const tenantUserReport = UserReport.schema(schema);
    const tenantPersonnel = Personnel.schema(schema);

    const where = {
      ...(status && ALLOWED_STATUS.has(status) ? { status } : {}),
      ...(search
        ? {
            [Sequelize.Op.or]: [
              { incident_type: { [Sequelize.Op.iLike]: `%${search}%` } },
              { description: { [Sequelize.Op.iLike]: `%${search}%` } },
              { location_name: { [Sequelize.Op.iLike]: `%${search}%` } }
            ]
          }
        : {})
    };

    const { rows, count } = await tenantUserReport.findAndCountAll({
      where,
      include: [
        {
          model: tenantPersonnel,
          as: 'assignedResponder',
          attributes: ['id', 'name'],
          required: false
        }
      ],
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });

    const eventIds = [...new Set(rows.map((item) => item.event_id).filter(Boolean))];
    const events = await Event.findAll({
      where: {
        id: { [Sequelize.Op.in]: eventIds.length ? eventIds : [0] },
        business_code: businessCode
      },
      attributes: ['id', 'title']
    });
    const eventTitleMap = new Map(events.map((event) => [event.id, event.title]));

    return res.json({
      data: rows.map((report) => mapReportOutput(report, eventTitleMap)),
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.max(Math.ceil(count / limit), 1)
      }
    });
  } catch (err) {
    return next(err);
  }
}

export async function assignUserReport(req, res, next) {
  try {
    if (!ensureAdmin(req, res)) return;

    const schema = req.tenantSchema;
    const { id } = req.params;
    const { responder_id: responderId } = req.body || {};

    if (!responderId) {
      return res.status(400).json({ error: 'responder_id is required' });
    }

    const tenantUserReport = UserReport.schema(schema);
    const tenantPersonnel = Personnel.schema(schema);

    const [report, responder] = await Promise.all([
      tenantUserReport.findByPk(id),
      tenantPersonnel.findOne({ where: { id: responderId, role: 'responder' } })
    ]);

    if (!report) return res.status(404).json({ error: 'User report not found' });
    if (!responder) return res.status(404).json({ error: 'Responder not found' });

    report.assigned_responder_id = responder.id;
    report.assigned_at = new Date();
    report.status = 'assigned';
    await report.save();

    return res.json({
      message: 'Responder assigned to report',
      data: {
        id: report.id,
        assigned_responder_id: report.assigned_responder_id,
        assigned_responder_name: responder.name,
        status: report.status,
        assigned_at: report.assigned_at
      }
    });
  } catch (err) {
    return next(err);
  }
}

export async function createUserReport(req, res, next) {
  return reportIncident(req, res, next);
}
