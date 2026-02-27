import bcrypt from 'bcryptjs';
import { Op } from 'sequelize';
import db from '../models/index.js';
import { sendResponderWelcomeEmail } from '../services/mailService.js';

const { Personnel, Zone } = db;

function ensureAdmin(req, res) {
  if (!req.user || req.user.role !== 'admin') {
    res.status(403).json({ error: 'Only admins can manage responders' });
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

async function generateResponderBadgeId(schema) {
  const tenantPersonnel = Personnel.schema(schema);
  const prefix = 'RSP-';

  const existing = await tenantPersonnel.findAll({
    where: {
      role: 'responder',
      badge_id: {
        [Op.like]: `${prefix}%`
      }
    },
    attributes: ['badge_id']
  });

  const currentMax = existing.reduce((maxValue, item) => {
    const badge = String(item.badge_id || '');
    const numericPart = Number(badge.replace(prefix, ''));
    if (!Number.isNaN(numericPart)) {
      return Math.max(maxValue, numericPart);
    }
    return maxValue;
  }, 0);

  const nextValue = currentMax + 1;
  return `${prefix}${String(nextValue).padStart(4, '0')}`;
}

async function resolveAssignedZoneId(schema, assigned_zone_id, assigned_zone) {
  const tenantZone = Zone.schema(schema);

  if (assigned_zone_id !== undefined && assigned_zone_id !== null && assigned_zone_id !== '') {
    const zone = await tenantZone.findByPk(assigned_zone_id);
    if (!zone) {
      throw new Error('Assigned zone not found');
    }
    return zone.id;
  }

  if (assigned_zone !== undefined && assigned_zone !== null && String(assigned_zone).trim() !== '') {
    const zone = await tenantZone.findOne({ where: { name: String(assigned_zone).trim() } });
    if (!zone) {
      throw new Error('Assigned zone not found');
    }
    return zone.id;
  }

  return null;
}

function normalizeResponderOutput(responder) {
  return {
    id: responder.id,
    name: responder.name,
    email: responder.email,
    badge_id: responder.badge_id,
    assigned_zone_id: responder.assigned_zone_id,
    assigned_zone_name: responder.assignedZone?.name || null,
    assigned_zone: responder.assignedZone?.name || null,
    is_active: responder.is_active,
    role: responder.role,
    createdAt: responder.createdAt,
    updatedAt: responder.updatedAt
  };
}

export async function listResponders(req, res, next) {
  try {
    if (!ensureAdmin(req, res)) return;

    const schema = req.tenantSchema;
    const { page, limit, offset } = normalizePagination(req.query.page, req.query.limit);
    const search = String(req.query.search || '').trim();
    const tenantZone = Zone.schema(schema);

    const where = { role: 'responder' };
    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
        { badge_id: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const tenantPersonnel = Personnel.schema(schema);
    const { rows, count } = await tenantPersonnel.findAndCountAll({
      where,
      attributes: { exclude: ['password_hash'] },
      include: [{ model: tenantZone, as: 'assignedZone', attributes: ['id', 'name'], required: false }],
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });

    return res.json({
      data: rows.map(normalizeResponderOutput),
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

export async function listResponderOptions(req, res, next) {
  try {
    if (!ensureAdmin(req, res)) return;

    const schema = req.tenantSchema;
    const search = String(req.query.search || '').trim();
    const limit = Math.min(Math.max(Number(req.query.limit) || 100, 1), 500);

    const tenantPersonnel = Personnel.schema(schema);
    const where = {
      role: 'responder',
      is_active: true,
      ...(search
        ? {
            [Op.or]: [
              { name: { [Op.iLike]: `%${search}%` } },
              { badge_id: { [Op.iLike]: `%${search}%` } }
            ]
          }
        : {})
    };

    const responders = await tenantPersonnel.findAll({
      where,
      attributes: ['id', 'name', 'badge_id'],
      order: [['name', 'ASC']],
      limit
    });

    return res.json({
      data: responders.map((item) => ({
        value: item.id,
        label: item.badge_id ? `${item.name} (${item.badge_id})` : item.name
      }))
    });
  } catch (err) {
    return next(err);
  }
}

export async function createResponder(req, res, next) {
  try {
    if (!ensureAdmin(req, res)) return;

    const schema = req.tenantSchema;
    const {
      name,
      email,
      assigned_zone_id,
      assigned_zone,
      is_active = true,
      password
    } = req.body || {};

    if (!name || !email) {
      return res.status(400).json({ error: 'name and email are required' });
    }

    const temporaryPassword = String(password || `Responder@${Date.now()}`);
    const password_hash = await bcrypt.hash(temporaryPassword, 10);
    let resolvedAssignedZoneId = null;

    try {
      resolvedAssignedZoneId = await resolveAssignedZoneId(schema, assigned_zone_id, assigned_zone);
    } catch (zoneErr) {
      return res.status(400).json({ error: zoneErr.message });
    }

    const tenantPersonnel = Personnel.schema(schema);
    const tenantZone = Zone.schema(schema);
    let created = null;

    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        const badgeId = await generateResponderBadgeId(schema);
        created = await tenantPersonnel.create({
          name,
          email,
          badge_id: badgeId,
          assigned_zone_id: resolvedAssignedZoneId,
          is_active: Boolean(is_active),
          role: 'responder',
          password_hash
        });
        break;
      } catch (createErr) {
        const isBadgeCollision =
          createErr?.name === 'SequelizeUniqueConstraintError' &&
          Array.isArray(createErr?.errors) &&
          createErr.errors.some((item) => item.path === 'badge_id');

        if (!isBadgeCollision || attempt === 2) {
          throw createErr;
        }
      }
    }

    const createdWithZone = await tenantPersonnel.findByPk(created.id, {
      include: [{ model: tenantZone, as: 'assignedZone', attributes: ['id', 'name'], required: false }]
    });

    let emailStatus = 'sent';
    try {
      const result = await sendResponderWelcomeEmail({
        to: created.email,
        name: created.name,
        businessCode: req.businessCode,
        temporaryPassword
      });
      if (result?.skipped) {
        emailStatus = 'skipped';
      }
    } catch (mailErr) {
      emailStatus = 'failed';
      console.error('Responder welcome email failed:', mailErr.message);
    }

    return res.status(201).json({
      message: 'Responder created',
      emailStatus,
      data: normalizeResponderOutput(createdWithZone)
    });
  } catch (err) {
    if (err?.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ error: 'Email or badge ID already exists' });
    }
    return next(err);
  }
}

export async function updateResponder(req, res, next) {
  try {
    if (!ensureAdmin(req, res)) return;

    const schema = req.tenantSchema;
    const { id } = req.params;
    const {
      name,
      email,
      assigned_zone_id,
      assigned_zone,
      is_active,
      password
    } = req.body || {};

    const tenantPersonnel = Personnel.schema(schema);
    const tenantZone = Zone.schema(schema);
    const responder = await tenantPersonnel.findOne({ where: { id, role: 'responder' } });

    if (!responder) {
      return res.status(404).json({ error: 'Responder not found' });
    }

    if (name !== undefined) responder.name = name;
    if (email !== undefined) responder.email = email;

    if (assigned_zone_id !== undefined || assigned_zone !== undefined) {
      try {
        responder.assigned_zone_id = await resolveAssignedZoneId(schema, assigned_zone_id, assigned_zone);
      } catch (zoneErr) {
        return res.status(400).json({ error: zoneErr.message });
      }
    }

    if (is_active !== undefined) responder.is_active = Boolean(is_active);
    if (password) responder.password_hash = await bcrypt.hash(String(password), 10);

    await responder.save();

    const responderWithZone = await tenantPersonnel.findByPk(responder.id, {
      include: [{ model: tenantZone, as: 'assignedZone', attributes: ['id', 'name'], required: false }]
    });

    return res.json({
      message: 'Responder updated',
      data: normalizeResponderOutput(responderWithZone)
    });
  } catch (err) {
    if (err?.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ error: 'Email or badge ID already exists' });
    }
    return next(err);
  }
}

export async function deleteResponder(req, res, next) {
  try {
    if (!ensureAdmin(req, res)) return;

    const schema = req.tenantSchema;
    const { id } = req.params;

    const tenantPersonnel = Personnel.schema(schema);
    const deletedCount = await tenantPersonnel.destroy({ where: { id, role: 'responder' } });

    if (!deletedCount) {
      return res.status(404).json({ error: 'Responder not found' });
    }

    return res.json({ message: 'Responder deleted', id });
  } catch (err) {
    return next(err);
  }
}
