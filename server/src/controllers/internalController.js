import db from '../models/index.js';
const { Camera, Tenant } = db;

function isMissingRelationError(err) {
  return err?.name === 'SequelizeDatabaseError' && err?.original?.code === '42P01';
}

export async function getAllActiveCameras(req, res) {
  try {
    const internalKey = req.headers['x-internal-key'];
    if (internalKey !== "internal-secret-key") { // Simple security
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // 1. Get all Tenants
    const tenants = await Tenant.findAll({ where: { is_active: true } });
    
    let allCameras = [];

    // 2. Loop through each tenant schema to get their cameras
    for (const tenant of tenants) {
      if (!tenant.schema_name) {
        continue;
      }

      const tenantCamera = Camera.schema(tenant.schema_name);
      let cameras = [];

      try {
        cameras = await tenantCamera.findAll({
          where: { status: 'online' },
          attributes: ['id', 'rtsp_url']
        });
      } catch (err) {
        if (isMissingRelationError(err)) {
          console.warn(`Skipping tenant ${tenant.business_code}: cameras table missing in schema ${tenant.schema_name}`);
          continue;
        }
        throw err;
      }

      // Format data for Python
      const formatted = cameras.map(cam => ({
        id: cam.id,
        rtsp_url: cam.rtsp_url,
        business_code: tenant.business_code, // Needed for alerts later
        schema: tenant.schema_name
      }));

      allCameras = [...allCameras, ...formatted];
    }

    res.json(allCameras);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Error' });
  }
}