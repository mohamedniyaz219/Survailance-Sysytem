import { Tenant } from '../models/index.js';

// Resolves the tenant schema from the incoming business code header.
async function tenantResolver(req, res, next) {
  const businessCode = req.headers['x-business-code'];

  if (!businessCode) {
    return res.status(400).json({ error: 'Missing x-business-code header' });
  }

  try {
    const tenant = await Tenant.findOne({ where: { business_code: businessCode } });

    if (!tenant || !tenant.schema_name) {
      return res.status(404).json({ error: 'Invalid business code' });
    }

    req.tenantSchema = tenant.schema_name;
    req.businessCode = businessCode;
    return next();
  } catch (err) {
    return next(err);
  }
}

export default tenantResolver;
