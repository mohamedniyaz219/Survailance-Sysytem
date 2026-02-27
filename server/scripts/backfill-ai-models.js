import db from '../src/models/index.js';
import { syncModelsForSchema } from '../src/services/aiModelCatalogService.js';

const { Tenant, AIModel } = db;

async function run() {
  const tenants = await Tenant.findAll({
    where: { is_active: true },
    attributes: ['business_code', 'schema_name']
  });

  if (!tenants.length) {
    console.log('No active tenants found.');
    return;
  }

  let totalInserted = 0;
  let totalUpdated = 0;
  let totalDeleted = 0;

  for (const tenant of tenants) {
    if (!tenant.schema_name) {
      console.log(`Skipping ${tenant.business_code}: missing schema_name`);
      continue;
    }

    try {
      const result = await syncModelsForSchema({
        AIModel,
        schema: tenant.schema_name
      });

      totalInserted += result.inserted;
      totalUpdated += result.updated;
      totalDeleted += result.deleted;
      console.log(
        `[${tenant.business_code}] discovered=${result.discovered} inserted=${result.inserted} updated=${result.updated} deleted=${result.deleted}`
      );
    } catch (err) {
      if (err?.original?.code === '42P01') {
        console.log(`[${tenant.business_code}] skipped: ai_models table missing in schema ${tenant.schema_name}`);
        continue;
      }
      throw err;
    }
  }

  console.log(`Done. inserted=${totalInserted} updated=${totalUpdated} deleted=${totalDeleted}`);
}

run()
  .catch((err) => {
    console.error('Backfill failed:', err.message);
    process.exit(1);
  })
  .finally(async () => {
    await db.sequelize.close();
  });
