import db from '../models/index.js';
const { Tenant } = db;

const tenantResolver = async (req, res, next) => {
  try {
    // 1. Get the Business Code from Headers (e.g., "CHN-POL-01")
    const businessCode = req.headers['x-business-code'];

    if (!businessCode) {
      return res.status(400).json({ error: 'Missing x-business-code header' });
    }

    // 2. Find the Tenant in the Public Schema
    const tenant = await Tenant.findOne({ 
      where: { business_code: businessCode } 
    });

    if (!tenant) {
      return res.status(404).json({ error: 'Invalid Business Code' });
    }

    // 3. Attach the specific schema name to the Request object
    // We will use this in Controllers to query the right tables
    req.tenantSchema = tenant.schema_name; // e.g., "tenant_chennai"
    req.tenantId = tenant.id;

    next();
  } catch (error) {
    console.error('Tenant Resolution Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export default tenantResolver;