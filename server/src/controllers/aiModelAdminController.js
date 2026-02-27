import db from '../models/index.js';
import { syncModelsForSchema } from '../services/aiModelCatalogService.js';

const { AIModel } = db;

function ensureAdmin(req, res) {
  if (!req.user || req.user.role !== 'admin') {
    res.status(403).json({ error: 'Only admins can manage AI models' });
    return false;
  }
  return true;
}

function paginationParams(pageParam, limitParam) {
  const page = Math.max(Number(pageParam) || 1, 1);
  const limit = Math.min(Math.max(Number(limitParam) || 10, 1), 100);
  return { page, limit, offset: (page - 1) * limit };
}

export async function listAIModels(req, res, next) {
  try {
    if (!ensureAdmin(req, res)) return;

    const schema = req.tenantSchema;
    const { page, limit, offset } = paginationParams(req.query.page, req.query.limit);
    const search = String(req.query.search || '').trim();

    const tenantAIModel = AIModel.schema(schema);

    const where = search
      ? {
          name: {
            [db.Sequelize.Op.iLike]: `%${search}%`
          }
        }
      : undefined;

    const { rows, count } = await tenantAIModel.findAndCountAll({
      where,
      order: [
        ['is_active', 'DESC'],
        ['createdAt', 'DESC']
      ],
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

export async function activateAIModel(req, res, next) {
  try {
    if (!ensureAdmin(req, res)) return;

    const schema = req.tenantSchema;
    const { id } = req.params;

    const tenantAIModel = AIModel.schema(schema);
    const selected = await tenantAIModel.findByPk(id);

    if (!selected) {
      return res.status(404).json({ error: 'AI model not found' });
    }

    await tenantAIModel.update(
      { is_active: false },
      { where: { is_active: true } }
    );

    selected.is_active = true;
    await selected.save();

    return res.json({ message: 'AI model activated', data: selected });
  } catch (err) {
    return next(err);
  }
}

export async function syncAvailableAIModels(req, res, next) {
  try {
    if (!ensureAdmin(req, res)) return;

    const schema = req.tenantSchema;
    const result = await syncModelsForSchema({ AIModel, schema });

    return res.json({
      message: 'AI models synced',
      ...result
    });
  } catch (err) {
    return next(err);
  }
}
