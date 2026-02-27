import db from '../models/index.js';

const { Zone, Camera, AnomalyRule, ZoneRiskScore } = db;

function ensureAdmin(req, res) {
  if (!req.user || req.user.role !== 'admin') {
    res.status(403).json({ error: 'Only admins can manage zones' });
    return false;
  }
  return true;
}

function paginationParams(pageParam, limitParam) {
  const page = Math.max(Number(pageParam) || 1, 1);
  const limit = Math.min(Math.max(Number(limitParam) || 10, 1), 100);
  return { page, limit, offset: (page - 1) * limit };
}

export async function listZones(req, res, next) {
  try {
    if (!ensureAdmin(req, res)) return;

    const schema = req.tenantSchema;
    const { page, limit, offset } = paginationParams(req.query.page, req.query.limit);
    const search = String(req.query.search || '').trim();

    const tenantZone = Zone.schema(schema);
    const where = search
      ? {
          name: {
            [db.Sequelize.Op.iLike]: `%${search}%`
          }
        }
      : undefined;

    const { rows, count } = await tenantZone.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });

    return res.json({
      data: rows,
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

export async function listZoneOptions(req, res, next) {
  try {
    if (!ensureAdmin(req, res)) return;

    const schema = req.tenantSchema;
    const search = String(req.query.search || '').trim();
    const limit = Math.min(Math.max(Number(req.query.limit) || 100, 1), 500);

    const tenantZone = Zone.schema(schema);
    const where = {
      is_active: true,
      ...(search
        ? {
            name: {
              [db.Sequelize.Op.iLike]: `%${search}%`
            }
          }
        : {})
    };

    const zones = await tenantZone.findAll({
      where,
      attributes: ['id', 'name'],
      order: [['name', 'ASC']],
      limit
    });

    return res.json({
      data: zones.map((zone) => ({
        value: zone.id,
        label: zone.name
      }))
    });
  } catch (err) {
    return next(err);
  }
}

export async function createZone(req, res, next) {
  try {
    if (!ensureAdmin(req, res)) return;

    const schema = req.tenantSchema;
    const { name, description, is_active = true } = req.body || {};

    if (!name) {
      return res.status(400).json({ error: 'Zone name is required' });
    }

    const tenantZone = Zone.schema(schema);
    const created = await tenantZone.create({
      name: String(name).trim(),
      description: description || null,
      is_active: Boolean(is_active)
    });

    return res.status(201).json({ message: 'Zone created', data: created });
  } catch (err) {
    if (err?.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ error: 'Zone name already exists' });
    }
    return next(err);
  }
}

export async function updateZone(req, res, next) {
  try {
    if (!ensureAdmin(req, res)) return;

    const schema = req.tenantSchema;
    const { id } = req.params;
    const { name, description, is_active } = req.body || {};

    const tenantZone = Zone.schema(schema);
    const zone = await tenantZone.findByPk(id);

    if (!zone) {
      return res.status(404).json({ error: 'Zone not found' });
    }

    if (name !== undefined) zone.name = String(name).trim();
    if (description !== undefined) zone.description = description || null;
    if (is_active !== undefined) zone.is_active = Boolean(is_active);

    await zone.save();

    return res.json({ message: 'Zone updated', data: zone });
  } catch (err) {
    if (err?.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ error: 'Zone name already exists' });
    }
    return next(err);
  }
}

export async function deleteZone(req, res, next) {
  try {
    if (!ensureAdmin(req, res)) return;

    const schema = req.tenantSchema;
    const { id } = req.params;

    const tenantCamera = Camera.schema(schema);
    const tenantAnomalyRule = AnomalyRule.schema(schema);
    const tenantZoneRiskScore = ZoneRiskScore.schema(schema);
    const tenantZone = Zone.schema(schema);

    const [cameraCount, ruleCount, riskCount] = await Promise.all([
      tenantCamera.count({ where: { zone_id: id } }),
      tenantAnomalyRule.count({ where: { zone_id: id } }),
      tenantZoneRiskScore.count({ where: { zone_id: id } })
    ]);

    if (cameraCount || ruleCount || riskCount) {
      return res.status(409).json({
        error: 'Zone is in use and cannot be deleted',
        usage: {
          cameras: cameraCount,
          anomalyRules: ruleCount,
          zoneRiskScores: riskCount
        }
      });
    }

    const deleted = await tenantZone.destroy({ where: { id } });

    if (!deleted) {
      return res.status(404).json({ error: 'Zone not found' });
    }

    return res.json({ message: 'Zone deleted', id });
  } catch (err) {
    return next(err);
  }
}
