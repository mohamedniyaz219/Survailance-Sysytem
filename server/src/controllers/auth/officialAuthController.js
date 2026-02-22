import bcrypt from 'bcryptjs';
import { signToken } from '../../services/tokenService.js';
import db from '../../models/index.js';

const { Personnel, Tenant } = db;

// --- 1. OFFICIAL LOGIN (Admins & Responders) ---
// Both use this because they exist in the 'Personnel' table of the tenant schema
export async function loginOfficial(req, res, next) {
  try {
    const { business_code, email, password } = req.body;

    if (!business_code || !email || !password) {
      return res.status(400).json({ error: 'Missing business_code, email, or password' });
    }

    // Tenant Schema is resolved by middleware before this hits
    const schema = req.tenantSchema; 

    // Look for the user in THAT schema
    const user = await Personnel.findOne({
      where: { email },
      schema: schema
    });

    if (!user) return res.status(401).json({ error: 'User not found in this organization' });

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) return res.status(401).json({ error: 'Invalid password' });

    if (!user.is_active) return res.status(403).json({ error: 'Account suspended' });

    // Token contains Role (Admin vs Responder)
    const token = signToken({
      id: user.id,
      role: user.role, // 'admin' or 'responder'
      businessCode: business_code,
      schema: schema
    });

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
        badge_id: user.badge_id,
        business_code
      }
    });

  } catch (err) {
    next(err);
  }
}

// --- 2. REGISTER NEW TENANT (Admin Only) ---
// Creates a new Organization + 1st Admin Account
export async function registerTenant(req, res, next) {
  const t = await db.sequelize.transaction();
  try {
    const { business_name, business_code, admin_email, admin_password, admin_name } = req.body;

    // ... (Same logic as previous answer: Check duplicate, Create Schema, Sync Tables) ...
    // Note: I'm abbreviating here to save space, stick to the logic provided previously.
    
    // 1. Validation & Check Duplicate in Public.Tenants
    const existing = await Tenant.findOne({ where: { business_code } });
    if(existing) { await t.rollback(); return res.status(409).json({error: 'Code taken'}); }

    // 2. Create Schema
    const schemaName = `schema_${business_code.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
    await Tenant.create({ name: business_name, business_code, schema_name: schemaName }, { transaction: t });
    await db.sequelize.query(`CREATE SCHEMA IF NOT EXISTS "${schemaName}";`, { transaction: t });

    // 3. Sync Tables
    const tenantModels = ['Personnel', 'Camera', 'Incident', 'IncidentHistory', 'AnomalyRule', 'AIModel', 'ZoneRiskScore', 'CrowdMetric', 'CameraHealthLog'];
    for (const m of tenantModels) { if(db[m]) await db[m].sync({ schema: schemaName }); }

    // 4. Create Admin
    const hashedParams = await bcrypt.hash(admin_password, 10);
    await Personnel.create({
      name: admin_name, email: admin_email, password_hash: hashedParams, role: 'admin'
    }, { schema: schemaName, transaction: t });

    await t.commit();
    res.status(201).json({ message: 'Organization created', business_code });

  } catch (err) {
    await t.rollback();
    next(err);
  }
}
