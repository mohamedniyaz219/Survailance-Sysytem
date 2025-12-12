// AI service hook: receives detections from Python, stores, and emits alerts.
async function receiveDetection(req, res, next) {
  try {
    const {
      camera_id: cameraId,
      detection_type: detectionType,
      confidence,
      snapshot,
    } = req.body || {};

    if (!cameraId || !detectionType || typeof confidence !== 'number') {
      return res.status(400).json({ error: 'camera_id, detection_type, and confidence are required' });
    }

    if (!req.tenantSchema || !req.businessCode) {
      return res.status(500).json({ error: 'Tenant context not resolved' });
    }

    // TODO: insert incident into the tenant schema (e.g., schema_chennai.Incidents).
    const incident = {
      cameraId,
      detectionType,
      confidence,
      snapshot: snapshot || null,
      schema: req.tenantSchema,
      source: 'AI',
      status: 'Detected',
      createdAt: new Date().toISOString(),
    };

    // Broadcast to tenant-specific room so dashboard and apps receive immediately.
    if (req.io) {
      const room = req.tenantSchema || req.businessCode;
      req.io.to(room).emit('ALERT', incident);
    }

    return res.status(201).json({ message: 'Detection received', incident });
  } catch (err) {
    return next(err);
  }
}

module.exports = { receiveDetection };
