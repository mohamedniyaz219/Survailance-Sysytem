import fs from 'fs';
import path from 'path';
import db from '../models/index.js';

const { UserReport, Event, Tenant, Sequelize } = db;

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

function normalizeMediaType(mimeType = '') {
  const value = String(mimeType).toLowerCase();
  if (value.startsWith('image/')) return 'photo';
  if (value.startsWith('video/')) return 'video';
  return 'unknown';
}

function ensureUploadDir() {
  const uploadDir = path.resolve(process.cwd(), 'uploads', 'user-reports');
  fs.mkdirSync(uploadDir, { recursive: true });
  return uploadDir;
}

function mapReportOutput(report) {
  const coordinates = report.location?.coordinates;
  return {
    id: report.id,
    event_id: report.event_id,
    global_user_id: report.global_user_id,
    incident_type: report.incident_type,
    description: report.description,
    location_name: report.location_name,
    media_url: report.media_url,
    media_type: report.media_type,
    status: report.status,
    lat: Array.isArray(coordinates) ? Number(coordinates[1]) : null,
    lng: Array.isArray(coordinates) ? Number(coordinates[0]) : null,
    createdAt: report.createdAt,
  };
}

async function resolveTenantSchemaForEvent(eventId) {
  const event = await Event.findOne({
    where: {
      id: eventId,
      is_active: true,
      status: {
        [Sequelize.Op.in]: ['planned', 'active']
      }
    }
  });

  if (!event) {
    const err = new Error('Selected event is invalid');
    err.statusCode = 400;
    throw err;
  }

  const tenant = await Tenant.findOne({
    where: {
      business_code: event.business_code,
      is_active: true
    }
  });

  if (!tenant) {
    const err = new Error('No active tenant found for selected event');
    err.statusCode = 400;
    throw err;
  }

  return { event, tenantSchema: tenant.schema_name };
}

export async function listPublicEvents(req, res, next) {
  try {
    const events = await Event.findAll({
      where: {
        is_active: true,
        status: {
          [Sequelize.Op.in]: ['planned', 'active']
        }
      },
      order: [['start_at', 'ASC']]
    });

    return res.json({ data: events });
  } catch (err) {
    return next(err);
  }
}

export async function uploadUserMedia(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'media file is required' });
    }

    const uploadDir = ensureUploadDir();
    const extension = path.extname(req.file.originalname || '') || '.bin';
    const fileName = `${Date.now()}_${Math.round(Math.random() * 1e9)}${extension}`;
    const absolutePath = path.join(uploadDir, fileName);

    fs.writeFileSync(absolutePath, req.file.buffer);

    return res.status(201).json({
      message: 'Media uploaded',
      data: {
        media_url: `/uploads/user-reports/${fileName}`,
        media_type: normalizeMediaType(req.file.mimetype)
      }
    });
  } catch (err) {
    return next(err);
  }
}

// Public user (crowdsourcing) actions.
export async function reportIncident(req, res, next) {
  try {
    const {
      event_id: eventId,
      incident_type: incidentType,
      description,
      location_name: locationName,
      lat,
      lng,
      media_url: mediaUrl,
      media_type: mediaType,
    } = req.body || {};

    if (!eventId || !incidentType) {
      return res.status(400).json({ error: 'event_id and incident_type are required' });
    }

    const { event, tenantSchema } = await resolveTenantSchemaForEvent(eventId);

    const tenantUserReport = UserReport.schema(tenantSchema);
    const report = await tenantUserReport.create({
      event_id: Number(eventId),
      global_user_id: req.user?.id || null,
      incident_type: String(incidentType).trim(),
      description: description || null,
      location_name: locationName || null,
      location: pointFromLatLng(lat, lng),
      media_url: mediaUrl || null,
      media_type: mediaType || 'unknown',
      status: 'new',
    });

    return res.status(201).json({
      message: 'Incident reported',
      data: mapReportOutput(report),
    });
  } catch (err) {
    if (err?.statusCode) {
      return res.status(err.statusCode).json({ error: err.message });
    }
    return next(err);
  }
}
