import db from '../models/index.js';
const { Incident, Camera } = db;

export async function receiveAIAlert(req, res, next) {
  try {
    const { camera_id, type, confidence, image } = req.body;
    const schema = req.tenantSchema; // Comes from headers

    // 1. Validate Camera
    const camera = await Camera.findOne({ where: { id: camera_id }, schema });
    if (!camera) return res.status(404).json({ error: 'Unknown Camera' });

    // 2. Create Incident
    const incident = await Incident.create({
      type,
      confidence,
      source: 'AI',
      status: 'new',
      priority: type === 'weapon' || type === 'fire' ? 'high' : 'medium',
      camera_id,
      location: camera.location, // Copy location from camera
      media_url: image, // You should upload this base64 to S3 and store URL
      description: `AI Detected ${type} with ${confidence} confidence`
    }, { schema });

    // 3. Real-time Push
    req.io.to(req.headers['x-business-code']).emit('CRITICAL_ALERT', {
      ...incident.toJSON(),
      camera_name: camera.name
    });

    res.status(201).json({ success: true, incidentId: incident.id });
  } catch (err) {
    next(err);
  }
}