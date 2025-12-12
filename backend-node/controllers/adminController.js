const { Tenant } = require('../models');
const response = require('../utils/responseHandler');

exports.createTenant = async (req, res) => {
  try {
    const { name, businessCode, schemaName } = req.body;
    if (!name || !businessCode || !schemaName) {
      return response.error(res, 'Missing tenant fields', 400);
    }

    const existing = await Tenant.findOne({ where: { businessCode } });
    if (existing) {
      return response.error(res, 'Business code already exists', 409);
    }

    const tenant = await Tenant.create({ name, businessCode, schemaName });
    return response.success(res, tenant, 201);
  } catch (err) {
    console.error(err);
    return response.error(res, 'Tenant creation failed');
  }
};
