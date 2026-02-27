import db from '../models/index.js';
import { spawnTranscoder } from '../services/videoService.js';

const { Camera, Zone, Sequelize } = db;

function ensureAdmin(req, res) {
  if (!req.user || req.user.role !== 'admin') {
    res.status(403).json({ error: 'Only admins can manage cameras' });
    return false;
  }
  return true;
}

function paginationParams(pageParam, limitParam) {
  const page = Math.max(Number(pageParam) || 1, 1);
  const limit = Math.min(Math.max(Number(limitParam) || 10, 1), 100);
  return { page, limit, offset: (page - 1) * limit };
}

function extractPoint(geometry) {
  const coords = geometry?.coordinates;
  if (!Array.isArray(coords) || coords.length < 2) {
    return { lat: null, lng: null };
  }
  return { lng: Number(coords[0]), lat: Number(coords[1]) };
}

function normalizeCameraOutput(camera) {
  const point = extractPoint(camera.location);
  return {
    id: camera.id,
    name: camera.name,
    rtsp_url: camera.rtsp_url,
    location_name: camera.location_name,
    zone_id: camera.zone_id,
    zone_name: camera.zone?.name || null,
    status: camera.status,
    lat: point.lat,
    lng: point.lng,
    createdAt: camera.createdAt,
    updatedAt: camera.updatedAt
  };
}

async function resolveZone(schema, zoneId) {
  if (!zoneId) return null;
  const tenantZone = Zone.schema(schema);
  const zone = await tenantZone.findByPk(zoneId);
  if (!zone) {
    throw new Error('Selected zone not found');
  }
  return zone.id;
}

function buildLocation(lat, lng) {
  if (lat === undefined || lng === undefined || lat === null || lng === null || lat === '' || lng === '') {
    throw new Error('Latitude and longitude are required');
  }

  const parsedLat = Number(lat);
  const parsedLng = Number(lng);

  if (Number.isNaN(parsedLat) || Number.isNaN(parsedLng)) {
    throw new Error('Latitude and longitude must be valid numbers');
  }

  if (parsedLat < -90 || parsedLat > 90) {
    throw new Error('Latitude must be between -90 and 90');
  }

  if (parsedLng < -180 || parsedLng > 180) {
    throw new Error('Longitude must be between -180 and 180');
  }

  return {
    type: 'Point',
    coordinates: [parsedLng, parsedLat]
  };
}

export async function listCameras(req, res, next) {
  try {
    if (!ensureAdmin(req, res)) return;

    const schema = req.tenantSchema;
    const { page, limit, offset } = paginationParams(req.query.page, req.query.limit);
    const search = String(req.query.search || '').trim();
    const status = String(req.query.status || '').trim();

    const tenantCamera = Camera.schema(schema);
    const tenantZone = Zone.schema(schema);

    const where = {};
    if (search) {
      where[Sequelize.Op.or] = [
        { name: { [Sequelize.Op.iLike]: `%${search}%` } },
        { location_name: { [Sequelize.Op.iLike]: `%${search}%` } },
        { rtsp_url: { [Sequelize.Op.iLike]: `%${search}%` } }
      ];
    }

    if (status && ['online', 'offline', 'maintenance'].includes(status)) {
      where.status = status;
    }

    const { rows, count } = await tenantCamera.findAndCountAll({
      where,
      include: [{ model: tenantZone, as: 'zone', attributes: ['id', 'name'], required: false }],
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });

    return res.json({
      data: rows.map(normalizeCameraOutput),
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

export async function createCamera(req, res, next) {
  try {
    if (!ensureAdmin(req, res)) return;

    const schema = req.tenantSchema;
    const {
      name,
      rtsp_url,
      location_name,
      zone_id,
      status = 'online',
      lat,
      lng
    } = req.body || {};

    if (!name || !rtsp_url) {
      return res.status(400).json({ error: 'name and rtsp_url are required' });
    }

    let resolvedZoneId;
    let location;

    try {
      resolvedZoneId = await resolveZone(schema, zone_id);
      location = buildLocation(lat, lng);
    } catch (validationErr) {
      return res.status(400).json({ error: validationErr.message });
    }

    const tenantCamera = Camera.schema(schema);
    const tenantZone = Zone.schema(schema);

    const created = await tenantCamera.create({
      name: String(name).trim(),
      rtsp_url: String(rtsp_url).trim(),
      location_name: location_name ? String(location_name).trim() : null,
      zone_id: resolvedZoneId,
      status,
      location
    });

    const cameraWithZone = await tenantCamera.findByPk(created.id, {
      include: [{ model: tenantZone, as: 'zone', attributes: ['id', 'name'], required: false }]
    });

    return res.status(201).json({ message: 'Camera created', data: normalizeCameraOutput(cameraWithZone) });
  } catch (err) {
    return next(err);
  }
}

export async function updateCamera(req, res, next) {
  try {
    if (!ensureAdmin(req, res)) return;

    const schema = req.tenantSchema;
    const { id } = req.params;
    const {
      name,
      rtsp_url,
      location_name,
      zone_id,
      status,
      lat,
      lng
    } = req.body || {};

    const tenantCamera = Camera.schema(schema);
    const tenantZone = Zone.schema(schema);

    const camera = await tenantCamera.findByPk(id);
    if (!camera) {
      return res.status(404).json({ error: 'Camera not found' });
    }

    if (name !== undefined) camera.name = String(name).trim();
    if (rtsp_url !== undefined) camera.rtsp_url = String(rtsp_url).trim();
    if (location_name !== undefined) camera.location_name = location_name ? String(location_name).trim() : null;
    if (status !== undefined) camera.status = status;

    if (zone_id !== undefined) {
      try {
        camera.zone_id = await resolveZone(schema, zone_id);
      } catch (validationErr) {
        return res.status(400).json({ error: validationErr.message });
      }
    }

    if (lat !== undefined || lng !== undefined) {
      try {
        camera.location = buildLocation(
          lat !== undefined ? lat : camera.location?.coordinates?.[1],
          lng !== undefined ? lng : camera.location?.coordinates?.[0]
        );
      } catch (validationErr) {
        return res.status(400).json({ error: validationErr.message });
      }
    }

    await camera.save();

    const updated = await tenantCamera.findByPk(camera.id, {
      include: [{ model: tenantZone, as: 'zone', attributes: ['id', 'name'], required: false }]
    });

    return res.json({ message: 'Camera updated', data: normalizeCameraOutput(updated) });
  } catch (err) {
    return next(err);
  }
}

export async function deleteCamera(req, res, next) {
  try {
    if (!ensureAdmin(req, res)) return;

    const schema = req.tenantSchema;
    const { id } = req.params;

    const tenantCamera = Camera.schema(schema);
    const deleted = await tenantCamera.destroy({ where: { id } });

    if (!deleted) {
      return res.status(404).json({ error: 'Camera not found' });
    }

    return res.json({ message: 'Camera deleted', id });
  } catch (err) {
    return next(err);
  }
}

export async function getCameraStream(req, res, next) {
  try {
    if (!ensureAdmin(req, res)) return;

    const schema = req.tenantSchema;
    const { id } = req.params;

    const tenantCamera = Camera.schema(schema);
    const camera = await tenantCamera.findByPk(id);
    if (!camera) return res.status(404).json({ error: 'Camera not found' });

    let streamUrl;
    try {
      streamUrl = await spawnTranscoder(camera.rtsp_url, camera.id);
    } catch (streamErr) {
      if (streamErr?.code === 'FFMPEG_MISSING') {
        return res.status(503).json({ error: streamErr.message });
      }
      throw streamErr;
    }

    return res.json({ streamUrl });
  } catch (err) {
    return next(err);
  }
}
