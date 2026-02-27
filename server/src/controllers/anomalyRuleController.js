import db from '../models/index.js';

const { AnomalyRule, Zone, Sequelize } = db;

const ALLOWED_RULE_TYPES = new Set(['loitering', 'sudden_motion', 'object_abandoned', 'crowd_spike']);

function ensureAdmin(req, res) {
  if (!req.user || req.user.role !== 'admin') {
    res.status(403).json({ error: 'Only admins can manage anomaly rules' });
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

async function resolveZoneContext(schema, zoneId, zoneName) {
  const tenantZone = Zone.schema(schema);

  if (zoneId !== undefined && zoneId !== null && zoneId !== '') {
    const zone = await tenantZone.findByPk(zoneId);
    if (!zone) throw new Error('Selected zone not found');
    return { zone_id: zone.id, zone: zone.name };
  }

  if (zoneName && String(zoneName).trim()) {
    const normalized = String(zoneName).trim();
    const zone = await tenantZone.findOne({ where: { name: normalized } });
    if (zone) return { zone_id: zone.id, zone: zone.name };
    return { zone_id: null, zone: normalized };
  }

  return { zone_id: null, zone: null };
}

function normalizeOutput(rule) {
  return {
    id: rule.id,
    name: rule.name,
    rule_type: rule.rule_type,
    threshold_value: rule.threshold_value,
    zone_id: rule.zone_id,
    zone: rule.zone || rule.zoneRef?.name || null,
    is_active: rule.is_active,
    created_by: rule.created_by,
    created_by_name: rule.createdBy?.name || null,
    createdAt: rule.createdAt,
    updatedAt: rule.updatedAt
  };
}

export async function listAnomalyRules(req, res, next) {
  try {
    if (!ensureAdmin(req, res)) return;

    const schema = req.tenantSchema;
    const { page, limit, offset } = normalizePagination(req.query.page, req.query.limit);
    const search = String(req.query.search || '').trim();
    const ruleType = String(req.query.rule_type || '').trim();
    const active = String(req.query.is_active || '').trim();

    const tenantAnomalyRule = AnomalyRule.schema(schema);
    const tenantZone = Zone.schema(schema);

    const where = {
      ...(ruleType && ALLOWED_RULE_TYPES.has(ruleType) ? { rule_type: ruleType } : {}),
      ...(active === 'true' ? { is_active: true } : {}),
      ...(active === 'false' ? { is_active: false } : {}),
      ...(search
        ? {
            [Sequelize.Op.or]: [
              { name: { [Sequelize.Op.iLike]: `%${search}%` } },
              { rule_type: { [Sequelize.Op.iLike]: `%${search}%` } },
              { zone: { [Sequelize.Op.iLike]: `%${search}%` } }
            ]
          }
        : {})
    };

    const { rows, count } = await tenantAnomalyRule.findAndCountAll({
      where,
      include: [
        { model: tenantZone, as: 'zoneRef', attributes: ['id', 'name'], required: false }
      ],
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });

    return res.json({
      data: rows.map(normalizeOutput),
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

export async function createAnomalyRule(req, res, next) {
  try {
    if (!ensureAdmin(req, res)) return;

    const schema = req.tenantSchema;
    const {
      name,
      rule_type: ruleType,
      threshold_value: thresholdValue,
      zone_id: zoneId,
      zone,
      is_active: isActive = true
    } = req.body || {};

    if (!name || !ruleType || thresholdValue === undefined || thresholdValue === null || thresholdValue === '') {
      return res.status(400).json({ error: 'name, rule_type, threshold_value are required' });
    }

    if (!ALLOWED_RULE_TYPES.has(String(ruleType))) {
      return res.status(400).json({ error: 'Invalid rule_type' });
    }

    const threshold = Number(thresholdValue);
    if (Number.isNaN(threshold) || threshold < 0) {
      return res.status(400).json({ error: 'threshold_value must be a non-negative number' });
    }

    const zoneContext = await resolveZoneContext(schema, zoneId, zone);

    const tenantAnomalyRule = AnomalyRule.schema(schema);
    const tenantZone = Zone.schema(schema);

    const created = await tenantAnomalyRule.create({
      name: String(name).trim(),
      rule_type: String(ruleType),
      threshold_value: threshold,
      zone_id: zoneContext.zone_id,
      zone: zoneContext.zone,
      is_active: Boolean(isActive),
      created_by: req.user?.id || null
    });

    const createdWithZone = await tenantAnomalyRule.findByPk(created.id, {
      include: [{ model: tenantZone, as: 'zoneRef', attributes: ['id', 'name'], required: false }]
    });

    return res.status(201).json({ message: 'Anomaly rule created', data: normalizeOutput(createdWithZone) });
  } catch (err) {
    if (err?.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ error: 'Anomaly rule name already exists' });
    }
    return next(err);
  }
}

export async function updateAnomalyRule(req, res, next) {
  try {
    if (!ensureAdmin(req, res)) return;

    const schema = req.tenantSchema;
    const { id } = req.params;
    const {
      name,
      rule_type: ruleType,
      threshold_value: thresholdValue,
      zone_id: zoneId,
      zone,
      is_active: isActive
    } = req.body || {};

    const tenantAnomalyRule = AnomalyRule.schema(schema);
    const tenantZone = Zone.schema(schema);

    const rule = await tenantAnomalyRule.findByPk(id);
    if (!rule) {
      return res.status(404).json({ error: 'Anomaly rule not found' });
    }

    if (name !== undefined) rule.name = String(name).trim();

    if (ruleType !== undefined) {
      if (!ALLOWED_RULE_TYPES.has(String(ruleType))) {
        return res.status(400).json({ error: 'Invalid rule_type' });
      }
      rule.rule_type = String(ruleType);
    }

    if (thresholdValue !== undefined) {
      const threshold = Number(thresholdValue);
      if (Number.isNaN(threshold) || threshold < 0) {
        return res.status(400).json({ error: 'threshold_value must be a non-negative number' });
      }
      rule.threshold_value = threshold;
    }

    if (zoneId !== undefined || zone !== undefined) {
      const zoneContext = await resolveZoneContext(schema, zoneId, zone);
      rule.zone_id = zoneContext.zone_id;
      rule.zone = zoneContext.zone;
    }

    if (isActive !== undefined) {
      rule.is_active = Boolean(isActive);
    }

    await rule.save();

    const updatedWithZone = await tenantAnomalyRule.findByPk(rule.id, {
      include: [{ model: tenantZone, as: 'zoneRef', attributes: ['id', 'name'], required: false }]
    });

    return res.json({ message: 'Anomaly rule updated', data: normalizeOutput(updatedWithZone) });
  } catch (err) {
    if (err?.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ error: 'Anomaly rule name already exists' });
    }
    return next(err);
  }
}

export async function deleteAnomalyRule(req, res, next) {
  try {
    if (!ensureAdmin(req, res)) return;

    const schema = req.tenantSchema;
    const { id } = req.params;

    const tenantAnomalyRule = AnomalyRule.schema(schema);
    const deleted = await tenantAnomalyRule.destroy({ where: { id } });

    if (!deleted) {
      return res.status(404).json({ error: 'Anomaly rule not found' });
    }

    return res.json({ message: 'Anomaly rule deleted', id });
  } catch (err) {
    return next(err);
  }
}
