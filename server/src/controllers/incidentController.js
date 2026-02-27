import db from '../models/index.js';

const { Incident, Personnel, Camera, IncidentHistory, Sequelize } = db;

const ALLOWED_STATUS = new Set(['new', 'assigned', 'resolved', 'false_alarm']);
const ALLOWED_VERIFICATION_STATUS = new Set(['pending', 'verified', 'rejected']);

function ensureAdmin(req, res) {
  if (!req.user || req.user.role !== 'admin') {
    res.status(403).json({ error: 'Only admins can manage incidents' });
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

function extractPoint(geometry) {
  const coords = geometry?.coordinates;
  if (!Array.isArray(coords) || coords.length < 2) {
    return { lat: null, lng: null };
  }
  return { lng: Number(coords[0]), lat: Number(coords[1]) };
}

function mapIncidentOutput(incident) {
  const point = extractPoint(incident.location);
  return {
    id: incident.id,
    type: incident.type,
    detected_class: incident.detected_class,
    source: incident.source,
    confidence: incident.confidence,
    confidence_score: incident.confidence_score ?? incident.confidence ?? null,
    description: incident.description,
    media_url: incident.media_url,
    status: incident.status,
    verification_status: incident.verification_status || 'pending',
    verification_flag: incident.verification_status && incident.verification_status !== 'pending',
    verified_by: incident.verified_by || null,
    verified_by_name: incident.verifier?.name || null,
    camera_id: incident.camera_id,
    camera_name: incident.camera?.name || null,
    camera_location_name: incident.camera?.location_name || null,
    assigned_responder_id: incident.assigned_responder_id,
    assigned_responder_name: incident.responder?.name || null,
    assigned_responder_badge: incident.responder?.badge_id || null,
    lat: point.lat,
    lng: point.lng,
    reported_by: incident.reported_by,
    createdAt: incident.createdAt,
    updatedAt: incident.updatedAt
  };
}

function isMissingDetectedClassColumnError(err) {
  const message = String(err?.original?.message || err?.message || '').toLowerCase();
  return err?.original?.code === '42703' && message.includes('detected_class');
}

function isMissingVerificationColumnsError(err) {
  const message = String(err?.original?.message || err?.message || '').toLowerCase();
  if (err?.original?.code !== '42703') return false;
  return (
    message.includes('confidence_score') ||
    message.includes('verification_status') ||
    message.includes('verified_by')
  );
}

export async function getAllIncidents(req, res, next) {
  try {
    if (!ensureAdmin(req, res)) return;

    const schema = req.tenantSchema;
    const { page, limit, offset } = normalizePagination(req.query.page, req.query.limit);
    const status = String(req.query.status || '').trim();
    const verificationStatus = String(req.query.verification_status || '').trim();
    const type = String(req.query.type || '').trim();
    const search = String(req.query.search || '').trim();

    const tenantIncident = Incident.schema(schema);
    const tenantPersonnel = Personnel.schema(schema);
    const tenantCamera = Camera.schema(schema);

    const where = {
      ...(status && ALLOWED_STATUS.has(status) ? { status } : {}),
      ...(verificationStatus && ALLOWED_VERIFICATION_STATUS.has(verificationStatus)
        ? { verification_status: verificationStatus }
        : {}),
      ...(type
        ? {
            [Sequelize.Op.or]: [
              { type: { [Sequelize.Op.iLike]: `%${type}%` } },
              { detected_class: { [Sequelize.Op.iLike]: `%${type}%` } }
            ]
          }
        : {}),
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

    let rows;
    let count;

    try {
      ({ rows, count } = await tenantIncident.findAndCountAll({
        where,
        include: [
          { model: tenantPersonnel, as: 'responder', attributes: ['id', 'name', 'badge_id'], required: false },
          { model: tenantPersonnel, as: 'verifier', attributes: ['id', 'name', 'badge_id'], required: false },
          { model: tenantCamera, as: 'camera', attributes: ['id', 'name', 'location_name'], required: false }
        ],
        order: [['createdAt', 'DESC']],
        limit,
        offset
      }));
    } catch (err) {
      if (!isMissingDetectedClassColumnError(err) && !isMissingVerificationColumnsError(err)) {
        throw err;
      }

      const fallbackWhere = {
        ...(status && ALLOWED_STATUS.has(status) ? { status } : {}),
        ...(type
          ? {
              type: { [Sequelize.Op.iLike]: `%${type}%` }
            }
          : {}),
        ...(search
          ? {
              [Sequelize.Op.or]: [
                { type: { [Sequelize.Op.iLike]: `%${search}%` } },
                { description: { [Sequelize.Op.iLike]: `%${search}%` } }
              ]
            }
          : {})
      };

      ({ rows, count } = await tenantIncident.findAndCountAll({
        attributes: {
          exclude: ['detected_class']
        },
        where: fallbackWhere,
        include: [
          { model: tenantPersonnel, as: 'responder', attributes: ['id', 'name', 'badge_id'], required: false },
          { model: tenantPersonnel, as: 'verifier', attributes: ['id', 'name', 'badge_id'], required: false },
          { model: tenantCamera, as: 'camera', attributes: ['id', 'name', 'location_name'], required: false }
        ],
        order: [['createdAt', 'DESC']],
        limit,
        offset
      }));
    }

    return res.json({
      data: rows.map(mapIncidentOutput),
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

export async function getIncidentDetails(req, res, next) {
  try {
    if (!ensureAdmin(req, res)) return;

    const { id } = req.params;
    const schema = req.tenantSchema;

    const tenantIncident = Incident.schema(schema);
    const tenantPersonnel = Personnel.schema(schema);
    const tenantCamera = Camera.schema(schema);
    const tenantIncidentHistory = IncidentHistory.schema(schema);

    let incident;

    try {
      incident = await tenantIncident.findByPk(id, {
        include: [
          { model: tenantPersonnel, as: 'responder', attributes: ['id', 'name', 'badge_id'], required: false },
          { model: tenantPersonnel, as: 'verifier', attributes: ['id', 'name', 'badge_id'], required: false },
          { model: tenantCamera, as: 'camera', attributes: ['id', 'name', 'location_name'], required: false }
        ]
      });
    } catch (err) {
      if (!isMissingDetectedClassColumnError(err)) {
        throw err;
      }

      incident = await tenantIncident.findByPk(id, {
        attributes: {
          exclude: ['detected_class']
        },
        include: [
          { model: tenantPersonnel, as: 'responder', attributes: ['id', 'name', 'badge_id'], required: false },
          { model: tenantPersonnel, as: 'verifier', attributes: ['id', 'name', 'badge_id'], required: false },
          { model: tenantCamera, as: 'camera', attributes: ['id', 'name', 'location_name'], required: false }
        ]
      });
    }

    if (!incident) return res.status(404).json({ error: 'Incident not found' });

    const history = await tenantIncidentHistory.findAll({
      where: { incident_id: id },
      order: [['timestamp', 'DESC']]
    });

    return res.json({
      data: {
        ...mapIncidentOutput(incident),
        history
      }
    });
  } catch (err) {
    return next(err);
  }
}

export async function assignResponder(req, res, next) {
  try {
    if (!ensureAdmin(req, res)) return;

    const { id } = req.params;
    const { responder_id: responderId, comment } = req.body || {};
    const schema = req.tenantSchema;

    const tenantIncident = Incident.schema(schema);
    const tenantPersonnel = Personnel.schema(schema);
    const tenantIncidentHistory = IncidentHistory.schema(schema);

    const incident = await tenantIncident.findByPk(id);

    if (!incident) return res.status(404).json({ error: 'Incident not found' });

    const previousResponderId = incident.assigned_responder_id;
    const previousStatus = incident.status;

    const shouldUnassign = responderId === null || responderId === undefined || responderId === '';
    let responder = null;

    if (!shouldUnassign) {
      responder = await tenantPersonnel.findOne({
        where: {
          id: responderId,
          role: 'responder',
          is_active: true
        }
      });

      if (!responder) return res.status(404).json({ error: 'Responder not found' });
    }

    incident.assigned_responder_id = shouldUnassign ? null : responder.id;
    incident.status = shouldUnassign ? 'new' : 'assigned';
    await incident.save();

    await tenantIncidentHistory.create({
      incident_id: incident.id,
      action_by: req.user?.id || null,
      action: shouldUnassign
        ? 'unassigned_responder'
        : previousResponderId
          ? 'reassigned_responder'
          : 'assigned_responder',
      prev_status: previousStatus,
      new_status: incident.status,
      comment: comment || null,
      timestamp: new Date()
    });

    if (req.io) {
      req.io.to(schema).emit('INCIDENT_UPDATED', {
        incidentId: incident.id,
        assigned_responder_id: incident.assigned_responder_id,
        status: incident.status
      });
    }

    return res.json({
      message: shouldUnassign ? 'Responder unassigned' : 'Responder assigned',
      data: {
        id: incident.id,
        assigned_responder_id: incident.assigned_responder_id,
        assigned_responder_name: responder?.name || null,
        status: incident.status
      }
    });
  } catch (err) {
    return next(err);
  }
}

export async function verifyIncident(req, res, next) {
  try {
    if (!ensureAdmin(req, res)) return;

    const { id } = req.params;
    const {
      verification_status: verificationStatus,
      false_positive_tag: falsePositiveTag,
      comment
    } = req.body || {};
    const schema = req.tenantSchema;

    const targetVerificationStatus = String(verificationStatus || '').trim().toLowerCase();
    if (!ALLOWED_VERIFICATION_STATUS.has(targetVerificationStatus) || targetVerificationStatus === 'pending') {
      return res.status(400).json({ error: 'verification_status must be verified or rejected' });
    }

    const tenantIncident = Incident.schema(schema);
    const tenantIncidentHistory = IncidentHistory.schema(schema);

    const incident = await tenantIncident.findByPk(id);
    if (!incident) return res.status(404).json({ error: 'Incident not found' });

    const previousStatus = incident.status;
    const previousVerificationStatus = incident.verification_status || 'pending';
    const shouldTagFalsePositive = Boolean(falsePositiveTag) || targetVerificationStatus === 'rejected';

    incident.verification_status = targetVerificationStatus;
    incident.verified_by = req.user?.id || null;
    if (shouldTagFalsePositive) {
      incident.status = 'false_alarm';
    }
    await incident.save();

    await tenantIncidentHistory.create({
      incident_id: incident.id,
      action_by: req.user?.id || null,
      action: shouldTagFalsePositive ? 'verification_rejected_false_positive' : 'verification_approved',
      prev_status: previousStatus,
      new_status: incident.status,
      comment: comment || `Verification changed from ${previousVerificationStatus} to ${targetVerificationStatus}`,
      timestamp: new Date()
    });

    return res.json({
      message: shouldTagFalsePositive ? 'Incident rejected and tagged as false positive' : 'Incident verified',
      data: {
        id: incident.id,
        status: incident.status,
        verification_status: incident.verification_status,
        verified_by: incident.verified_by,
        false_positive_tag: shouldTagFalsePositive
      }
    });
  } catch (err) {
    return next(err);
  }
}
