import db from '../models/index.js';
const { Incident, Camera, Personnel, ZoneRiskScore } = db;

export async function getStats(req, res, next) {
  try {
    const schema = req.tenantSchema;

    const totalIncidents = await Incident.count({ schema });
    const activeIncidents = await Incident.count({ 
      where: { status: ['new', 'assigned'] }, 
      schema 
    });
    const activeCameras = await Camera.count({ 
      where: { status: 'online' }, 
      schema 
    });
    const highRiskZones = await ZoneRiskScore.count({ 
      where: { risk_score: { [db.Sequelize.Op.gt]: 70 } }, 
      schema 
    });

    res.json({
      totalIncidents,
      activeIncidents,
      activeCameras,
      highRiskZones
    });
  } catch (err) {
    next(err);
  }
}

export async function getRecentActivity(req, res, next) {
  try {
    const schema = req.tenantSchema;
    // Get last 5 incidents
    const recent = await Incident.findAll({
      limit: 5,
      order: [['created_at', 'DESC']],
      schema
    });
    res.json(recent);
  } catch (err) {
    next(err);
  }
}