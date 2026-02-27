import db from '../models/index.js';

const { Event, Sequelize } = db;

const ALLOWED_STATUS = new Set(['planned', 'active', 'completed', 'cancelled']);

function ensureAdmin(req, res) {
  if (!req.user || req.user.role !== 'admin') {
    res.status(403).json({ error: 'Only admins can manage events' });
    return false;
  }
  return true;
}

function paginationParams(pageParam, limitParam) {
  const page = Math.max(Number(pageParam) || 1, 1);
  const limit = Math.min(Math.max(Number(limitParam) || 10, 1), 100);
  return { page, limit, offset: (page - 1) * limit };
}

function validateStatus(status) {
  if (status === undefined || status === null || status === '') return 'planned';
  const normalized = String(status).toLowerCase();
  if (!ALLOWED_STATUS.has(normalized)) {
    const err = new Error('Invalid status');
    err.statusCode = 400;
    throw err;
  }
  return normalized;
}

function normalizeDate(value, fieldName) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    const err = new Error(`${fieldName} must be a valid date`);
    err.statusCode = 400;
    throw err;
  }
  return date;
}

export async function listEvents(req, res, next) {
  try {
    const businessCode = req.businessCode;
    if (!businessCode) return res.status(400).json({ error: 'Missing business code context' });

    const { page, limit, offset } = paginationParams(req.query.page, req.query.limit);
    const search = String(req.query.search || '').trim();
    const status = String(req.query.status || '').trim().toLowerCase();

    const where = {
      business_code: businessCode,
      ...(status && ALLOWED_STATUS.has(status) ? { status } : {}),
      ...(search
        ? {
            [Sequelize.Op.or]: [
              { title: { [Sequelize.Op.iLike]: `%${search}%` } },
              { description: { [Sequelize.Op.iLike]: `%${search}%` } },
              { event_type: { [Sequelize.Op.iLike]: `%${search}%` } },
              { location_name: { [Sequelize.Op.iLike]: `%${search}%` } }
            ]
          }
        : {})
    };

    const { rows, count } = await Event.findAndCountAll({
      where,
      order: [['start_at', 'DESC']],
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

export async function listAvailableEvents(req, res, next) {
  try {
    const businessCode = req.businessCode;
    if (!businessCode) return res.status(400).json({ error: 'Missing business code context' });

    const events = await Event.findAll({
      where: {
        business_code: businessCode,
        is_active: true,
        status: {
          [Sequelize.Op.in]: ['planned', 'active']
        }
      },
      order: [['start_at', 'ASC']]
    });

    return res.json({ data: events });
  } catch (err) {
    return next(err);
  }
}

export async function createEvent(req, res, next) {
  try {
    if (!ensureAdmin(req, res)) return;

    const businessCode = req.businessCode;
    if (!businessCode) return res.status(400).json({ error: 'Missing business code context' });

    const {
      title,
      description,
      event_type,
      location_name,
      start_at,
      end_at,
      status,
      is_active = true,
      metadata
    } = req.body || {};

    if (!title || !start_at) {
      return res.status(400).json({ error: 'title and start_at are required' });
    }

    const normalizedStartAt = normalizeDate(start_at, 'start_at');
    const normalizedEndAt = normalizeDate(end_at, 'end_at');
    if (normalizedEndAt && normalizedEndAt < normalizedStartAt) {
      return res.status(400).json({ error: 'end_at must be after start_at' });
    }

    const created = await Event.create({
      business_code: businessCode,
      title: String(title).trim(),
      description: description || null,
      event_type: event_type || null,
      location_name: location_name || null,
      start_at: normalizedStartAt,
      end_at: normalizedEndAt,
      status: validateStatus(status),
      is_active: Boolean(is_active),
      metadata: metadata ?? null
    });

    return res.status(201).json({ message: 'Event created', data: created });
  } catch (err) {
    if (err?.statusCode) {
      return res.status(err.statusCode).json({ error: err.message });
    }
    return next(err);
  }
}

export async function updateEvent(req, res, next) {
  try {
    if (!ensureAdmin(req, res)) return;

    const businessCode = req.businessCode;
    if (!businessCode) return res.status(400).json({ error: 'Missing business code context' });

    const { id } = req.params;

    const event = await Event.findOne({ where: { id, business_code: businessCode } });
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const {
      title,
      description,
      event_type,
      location_name,
      start_at,
      end_at,
      status,
      is_active,
      metadata
    } = req.body || {};

    if (title !== undefined) event.title = String(title).trim();
    if (description !== undefined) event.description = description || null;
    if (event_type !== undefined) event.event_type = event_type || null;
    if (location_name !== undefined) event.location_name = location_name || null;
    if (status !== undefined) event.status = validateStatus(status);
    if (is_active !== undefined) event.is_active = Boolean(is_active);
    if (metadata !== undefined) event.metadata = metadata ?? null;

    if (start_at !== undefined) event.start_at = normalizeDate(start_at, 'start_at');
    if (end_at !== undefined) event.end_at = normalizeDate(end_at, 'end_at');

    if (event.end_at && event.start_at && event.end_at < event.start_at) {
      return res.status(400).json({ error: 'end_at must be after start_at' });
    }

    await event.save();

    return res.json({ message: 'Event updated', data: event });
  } catch (err) {
    if (err?.statusCode) {
      return res.status(err.statusCode).json({ error: err.message });
    }
    return next(err);
  }
}

export async function deleteEvent(req, res, next) {
  try {
    if (!ensureAdmin(req, res)) return;

    const businessCode = req.businessCode;
    if (!businessCode) return res.status(400).json({ error: 'Missing business code context' });

    const { id } = req.params;

    const deleted = await Event.destroy({
      where: {
        id,
        business_code: businessCode
      }
    });

    if (!deleted) {
      return res.status(404).json({ error: 'Event not found' });
    }

    return res.json({ message: 'Event deleted', id });
  } catch (err) {
    return next(err);
  }
}
