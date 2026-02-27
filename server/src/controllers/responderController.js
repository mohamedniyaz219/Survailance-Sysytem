import db from '../models/index.js';

const { Incident, Personnel, Camera, Sequelize } = db;

const ALLOWED_INCIDENT_STATUS = new Set(['new', 'assigned', 'resolved', 'false_alarm']);
const ALLOWED_RESPONDER_UPDATE_STATUS = new Set(['assigned', 'resolved']);

function extractPoint(geometry) {
  const coords = geometry?.coordinates;
  if (!Array.isArray(coords) || coords.length < 2) {
    return { lat: null, lng: null };
  }
  return { lng: Number(coords[0]), lat: Number(coords[1]) };
}

function mapAlertOutput(incident) {
  const point = extractPoint(incident.location);
  return {
    id: incident.id,
    type: incident.type,
    description: incident.description,
    source: incident.source,
    confidence: incident.confidence,
    status: incident.status,
    verification_status: incident.verification_status || 'pending',
    media_url: incident.media_url,
    camera_id: incident.camera_id,
    camera_name: incident.camera?.name || null,
    camera_location_name: incident.camera?.location_name || null,
    assigned_responder_id: incident.assigned_responder_id,
    assigned_responder_name: incident.responder?.name || null,
    lat: point.lat,
    lng: point.lng,
    createdAt: incident.createdAt,
    updatedAt: incident.updatedAt
  };
}

function normalizePagination(pageParam, limitParam) {
  const page = Math.max(Number(pageParam) || 1, 1);
  const limit = Math.min(Math.max(Number(limitParam) || 10, 1), 100);
  const offset = (page - 1) * limit;
  return { page, limit, offset };
}

// Responder (official app) actions.
export async function getMyAlerts(req, res, next) {
  try {
    const schema = req.tenantSchema;
    const { page, limit, offset } = normalizePagination(req.query.page, req.query.limit);
    const status = String(req.query.status || '').trim().toLowerCase();
    const search = String(req.query.search || '').trim();

    const tenantIncident = Incident.schema(schema);
    const tenantPersonnel = Personnel.schema(schema);
    const tenantCamera = Camera.schema(schema);

    const where = {
      assigned_responder_id: req.user?.id,
      ...(status && ALLOWED_INCIDENT_STATUS.has(status) ? { status } : {}),
      ...(search
        ? {
            [Sequelize.Op.or]: [
              { type: { [Sequelize.Op.iLike]: `%${search}%` } },
              { detected_class: { [Sequelize.Op.iLike]: `%${search}%` } },
              { description: { [Sequelize.Op.iLike]: `%${search}%` } }
            ]
          }
        : {})
    };

    const { rows, count } = await tenantIncident.findAndCountAll({
      where,
      include: [
        { model: tenantPersonnel, as: 'responder', attributes: ['id', 'name', 'badge_id'], required: false },
        { model: tenantCamera, as: 'camera', attributes: ['id', 'name', 'location_name'], required: false }
      ],
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });

    return res.json({
      data: rows.map(mapAlertOutput),
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

export async function updateStatus(req, res, next) {
  try {
    const { id } = req.params;
    const targetStatus = String(req.body?.status || '').trim().toLowerCase();

    if (!ALLOWED_RESPONDER_UPDATE_STATUS.has(targetStatus)) {
      return res.status(400).json({ error: 'Responder can set status to assigned or resolved only' });
    }

    const schema = req.tenantSchema;
    const tenantIncident = Incident.schema(schema);

    const incident = await tenantIncident.findOne({
      where: {
        id,
        assigned_responder_id: req.user?.id
      }
    });

    if (!incident) {
      return res.status(404).json({ error: 'Alert not found for this responder' });
    }

    incident.status = targetStatus;
    await incident.save();

    if (req.io) {
      req.io.to(schema).emit('INCIDENT_UPDATED', {
        incidentId: incident.id,
        status: incident.status,
        assigned_responder_id: incident.assigned_responder_id
      });
    }

    return res.json({
      message: 'Alert status updated',
      data: {
        id: incident.id,
        status: incident.status,
        updatedAt: incident.updatedAt
      }
    });
  } catch (err) {
    return next(err);
  }
}

export async function getNavigation(req, res, next) {
  try {
    const { id } = req.params;
    const schema = req.tenantSchema;
    const tenantIncident = Incident.schema(schema);

    const incident = await tenantIncident.findOne({
      where: {
        id,
        assigned_responder_id: req.user?.id
      }
    });

    if (!incident) {
      return res.status(404).json({ error: 'Alert not found for this responder' });
    }

    const destination = extractPoint(incident.location);
    if (destination.lat === null || destination.lng === null) {
      return res.status(422).json({ error: 'Alert has no destination coordinates' });
    }

    const googleDirectionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${destination.lat},${destination.lng}`;
    const appleMapsUrl = `http://maps.apple.com/?daddr=${destination.lat},${destination.lng}`;

    return res.json({
      data: {
        id: incident.id,
        destination,
        googleDirectionsUrl,
        appleMapsUrl
      }
    });
  } catch (err) {
    return next(err);
  }
}
