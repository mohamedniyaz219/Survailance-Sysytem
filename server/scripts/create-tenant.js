// scripts/create-tenant.js
import db from '../models/index.js'; // Import your ESM models

const createTenant = async (tenantName, businessCode) => {
  const schemaName = `tenant_${tenantName.toLowerCase().replace(/\s+/g, '_')}`;

  console.log(`🚀 Starting setup for: ${tenantName} (${schemaName})...`);
  
  const t = await db.sequelize.transaction();

  try {
    // 1. Create the Entry in Public Tenant Table
    const tenantEntry = await db.Tenant.create({
      name: tenantName,
      business_code: businessCode,
      schema_name: schemaName
    }, { transaction: t });

    // 2. Create the Schema in Postgres
    await db.sequelize.query(`CREATE SCHEMA IF NOT EXISTS "${schemaName}";`, { transaction: t });
    console.log(`✅ Schema "${schemaName}" created.`);

    // 3. Sync "Tenant" Models to this specific Schema
    // We filter only the models that belong to the tenant folder
    const tenantModels = [
      'Personnel', 
      'Camera', 
      'Incident', 
      'IncidentHistory', 
      'AnomalyRule', 
      'AIModel', 
      'ZoneRiskScore', 
      'CrowdMetric', 
      'CameraHealthLog'
    ];

    for (const modelName of tenantModels) {
      if (db[modelName]) {
        // Sync creates the table in the DB
        await db[modelName].sync({ schema: schemaName, force: false }); 
        console.log(`   - Table ${modelName} synced.`);
      } else {
        console.warn(`    Model ${modelName} not found in DB object.`);
      }
    }

    await t.commit();
    console.log(`🎉 Tenant "${tenantName}" setup complete!`);
    process.exit(0);

  } catch (error) {
    await t.rollback();
    console.error(' Error creating tenant:', error);
    process.exit(1);
  }
};

// Usage: node scripts/create-tenant.js "Chennai City Police" "CHN-POL"
const args = process.argv.slice(2);
if (args.length < 2) {
  console.log('Usage: node scripts/create-tenant.js <Name> <Code>');
  process.exit(1);
}

createTenant(args[0], args[1]);