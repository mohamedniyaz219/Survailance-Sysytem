import db from '../models/index.js';

const { CrowdMetric, Camera, Sequelize } = db;

function ensureAdmin(req, res) {
  if (!req.user || req.user.role !== 'admin') {
    res.status(403).json({ error: 'Only admins can view crowd analytics' });
    return false;
  }
  return true;
}

function parseRange(start, end) {
  const endAt = end ? new Date(end) : new Date();
  const startAt = start ? new Date(start) : new Date(endAt.getTime() - 24 * 60 * 60 * 1000);

  if (Number.isNaN(startAt.getTime()) || Number.isNaN(endAt.getTime())) {
    return null;
  }

  return { startAt, endAt };
}

export async function listCrowdMetrics(req, res, next) {
  try {
    if (!ensureAdmin(req, res)) return;

    const schema = req.tenantSchema;
    const range = parseRange(req.query.start, req.query.end);
    if (!range) {
      return res.status(400).json({ error: 'Invalid start or end date' });
    }

    const cameraId = req.query.camera_id ? Number(req.query.camera_id) : null;
    if (req.query.camera_id && Number.isNaN(cameraId)) {
      return res.status(400).json({ error: 'camera_id must be a number' });
    }

    const tenantCrowdMetric = CrowdMetric.schema(schema);
    const tenantCamera = Camera.schema(schema);

    const where = {
      captured_at: {
        [Sequelize.Op.between]: [range.startAt, range.endAt]
      }
    };

    if (cameraId) {
      where.camera_id = cameraId;
    }

    const rows = await tenantCrowdMetric.findAll({
      where,
      include: [{
        model: tenantCamera,
        as: 'camera',
        attributes: ['id', 'name', 'location_name'],
        required: false
      }],
      attributes: ['id', 'camera_id', 'people_count', 'density_level', 'flow_direction', 'captured_at'],
      order: [['captured_at', 'DESC']],
      limit: Math.min(Number(req.query.limit) || 500, 2000)
    });

    const cameraAgg = new Map();
    for (const item of rows) {
      const key = item.camera_id;
      if (!cameraAgg.has(key)) {
        cameraAgg.set(key, {
          camera_id: key,
          camera_name: item.camera?.name || `Camera ${key}`,
          location_name: item.camera?.location_name || null,
          sample_count: 0,
          total_people: 0,
          peak_people: 0,
          dense_samples: 0,
          critical_samples: 0
        });
      }

      const agg = cameraAgg.get(key);
      const count = Number(item.people_count || 0);
      agg.sample_count += 1;
      agg.total_people += count;
      agg.peak_people = Math.max(agg.peak_people, count);
      if (item.density_level === 'dense') agg.dense_samples += 1;
      if (item.density_level === 'critical') agg.critical_samples += 1;
    }

    const perCamera = Array.from(cameraAgg.values()).map((item) => ({
      ...item,
      avg_people: item.sample_count ? Number((item.total_people / item.sample_count).toFixed(2)) : 0
    }));

    const flowBreakdown = {
      in: rows.filter((item) => item.flow_direction === 'in').length,
      out: rows.filter((item) => item.flow_direction === 'out').length,
      static: rows.filter((item) => item.flow_direction === 'static').length,
      chaotic: rows.filter((item) => item.flow_direction === 'chaotic').length
    };

    return res.json({
      range: {
        start: range.startAt,
        end: range.endAt
      },
      totalSamples: rows.length,
      suddenSurgeSignals: rows.filter((item) => item.density_level === 'critical' || item.flow_direction === 'chaotic').length,
      flowBreakdown,
      perCamera,
      rows
    });
  } catch (err) {
    return next(err);
  }
}
