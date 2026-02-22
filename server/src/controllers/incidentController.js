import db from '../models/index.js';
const { Incident, Personnel, Camera, IncidentHistory } = db;

export async function getAllIncidents(req, res, next) {
  try {
    const schema = req.tenantSchema;
    const { status, type } = req.query;

    const where = {};
    if (status) where.status = status;
    if (type) where.type = type;

    const incidents = await Incident.findAll({
      where,
      include: [
        { model: Personnel, as: 'responder', attributes: ['name', 'badge_id'] },
        { model: Camera, as: 'camera', attributes: ['name', 'location_name'] }
      ],
      order: [['created_at', 'DESC']],
      schema
    });

    res.json(incidents);
  } catch (err) {
    next(err);
  }
}

export async function getIncidentDetails(req, res, next) {
  try {
    const { id } = req.params;
    const schema = req.tenantSchema;

    const incident = await Incident.findOne({
      where: { id },
      include: [
        { model: IncidentHistory, as: 'history' } // Audit trail
      ],
      schema
    });

    if (!incident) return res.status(404).json({ error: 'Not found' });
    res.json(incident);
  } catch (err) {
    next(err);
  }
}

export async function assignResponder(req, res, next) {
  try {
    const { id } = req.params;
    const { responder_id } = req.body;
    const schema = req.tenantSchema;

    const incident = await Incident.findOne({ where: { id }, schema });
    if (!incident) return res.status(404).json({ error: 'Incident not found' });

    await incident.update({ 
      assigned_responder_id: responder_id,
      status: 'assigned'
    });

    // Notify Responder via Socket
    req.io.to(responder_id).emit('NEW_ASSIGNMENT', incident);

    res.json({ message: 'Responder assigned' });
  } catch (err) {
    next(err);
  }
}