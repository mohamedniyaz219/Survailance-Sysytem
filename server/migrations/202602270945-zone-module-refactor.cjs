'use strict';

const SAFE_SCHEMA = /^[a-zA-Z_][a-zA-Z0-9_]*$/;

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    const tenantRows = await queryInterface.sequelize.query(
      'SELECT schema_name FROM public.tenants WHERE is_active = true',
      { type: Sequelize.QueryTypes.SELECT, transaction }
    );

    const schemas = tenantRows
      .map((row) => row.schema_name)
      .filter((schema) => SAFE_SCHEMA.test(schema));

    const columnExists = async (schema, tableName, columnName) => {
      const rows = await queryInterface.sequelize.query(
        `
          SELECT 1
          FROM information_schema.columns
          WHERE table_schema = :schema
            AND table_name = :tableName
            AND column_name = :columnName
          LIMIT 1
        `,
        {
          replacements: { schema, tableName, columnName },
          type: Sequelize.QueryTypes.SELECT,
          transaction
        }
      );
      return rows.length > 0;
    };

    const addForeignKeyIfMissing = async (schema, tableName, columnName, refTableName, refColumnName, constraintName) => {
      const rows = await queryInterface.sequelize.query(
        `
          SELECT 1
          FROM pg_constraint c
          JOIN pg_class t ON t.oid = c.conrelid
          JOIN pg_namespace ns ON ns.oid = t.relnamespace
          WHERE ns.nspname = :schema
            AND t.relname = :tableName
            AND c.conname = :constraintName
          LIMIT 1
        `,
        {
          replacements: { schema, tableName, constraintName },
          type: Sequelize.QueryTypes.SELECT,
          transaction
        }
      );

      if (rows.length === 0) {
        await queryInterface.addConstraint(
          { schema, tableName },
          {
            fields: [columnName],
            type: 'foreign key',
            name: constraintName,
            references: {
              table: { schema, tableName: refTableName },
              field: refColumnName
            },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL',
            transaction
          }
        );
      }
    };

    for (const schema of schemas) {
      await queryInterface.sequelize.query(
        `
          CREATE TABLE IF NOT EXISTS "${schema}"."zones" (
            "id" SERIAL PRIMARY KEY,
            "name" VARCHAR(255) NOT NULL UNIQUE,
            "description" TEXT,
            "is_active" BOOLEAN DEFAULT TRUE,
            "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          )
        `,
        { transaction }
      );

      if (!(await columnExists(schema, 'cameras', 'zone_id'))) {
        await queryInterface.addColumn(
          { schema, tableName: 'cameras' },
          'zone_id',
          { type: Sequelize.INTEGER, allowNull: true },
          { transaction }
        );
      }

      if (!(await columnExists(schema, 'anomaly_rules', 'zone_id'))) {
        await queryInterface.addColumn(
          { schema, tableName: 'anomaly_rules' },
          'zone_id',
          { type: Sequelize.INTEGER, allowNull: true },
          { transaction }
        );
      }

      if (!(await columnExists(schema, 'zone_risk_scores', 'zone_id'))) {
        await queryInterface.addColumn(
          { schema, tableName: 'zone_risk_scores' },
          'zone_id',
          { type: Sequelize.INTEGER, allowNull: true },
          { transaction }
        );
      }

      if (!(await columnExists(schema, 'personnel', 'assigned_zone_id'))) {
        await queryInterface.addColumn(
          { schema, tableName: 'personnel' },
          'assigned_zone_id',
          { type: Sequelize.INTEGER, allowNull: true },
          { transaction }
        );
      }

      await queryInterface.sequelize.query(
        `
          INSERT INTO "${schema}"."zones" ("name", "description", "is_active", "createdAt", "updatedAt")
          SELECT DISTINCT BTRIM(val), NULL, TRUE, NOW(), NOW()
          FROM (
            SELECT zone AS val FROM "${schema}"."cameras"
            UNION ALL
            SELECT zone AS val FROM "${schema}"."anomaly_rules"
            UNION ALL
            SELECT zone AS val FROM "${schema}"."zone_risk_scores"
            UNION ALL
            SELECT assigned_zone AS val FROM "${schema}"."personnel"
          ) src
          WHERE src.val IS NOT NULL AND BTRIM(src.val) <> ''
          ON CONFLICT ("name") DO NOTHING
        `,
        { transaction }
      );

      await queryInterface.sequelize.query(
        `
          UPDATE "${schema}"."cameras" c
          SET zone_id = z.id
          FROM "${schema}"."zones" z
          WHERE c.zone_id IS NULL
            AND c.zone IS NOT NULL
            AND BTRIM(c.zone) <> ''
            AND z.name = BTRIM(c.zone)
        `,
        { transaction }
      );

      await queryInterface.sequelize.query(
        `
          UPDATE "${schema}"."anomaly_rules" ar
          SET zone_id = z.id
          FROM "${schema}"."zones" z
          WHERE ar.zone_id IS NULL
            AND ar.zone IS NOT NULL
            AND BTRIM(ar.zone) <> ''
            AND z.name = BTRIM(ar.zone)
        `,
        { transaction }
      );

      await queryInterface.sequelize.query(
        `
          UPDATE "${schema}"."zone_risk_scores" zrs
          SET zone_id = z.id
          FROM "${schema}"."zones" z
          WHERE zrs.zone_id IS NULL
            AND zrs.zone IS NOT NULL
            AND BTRIM(zrs.zone) <> ''
            AND z.name = BTRIM(zrs.zone)
        `,
        { transaction }
      );

      await queryInterface.sequelize.query(
        `
          UPDATE "${schema}"."personnel" p
          SET assigned_zone_id = z.id
          FROM "${schema}"."zones" z
          WHERE p.assigned_zone_id IS NULL
            AND p.assigned_zone IS NOT NULL
            AND BTRIM(p.assigned_zone) <> ''
            AND z.name = BTRIM(p.assigned_zone)
        `,
        { transaction }
      );

      await addForeignKeyIfMissing(schema, 'cameras', 'zone_id', 'zones', 'id', `${schema}_cameras_zone_id_fkey`);
      await addForeignKeyIfMissing(schema, 'anomaly_rules', 'zone_id', 'zones', 'id', `${schema}_anomaly_rules_zone_id_fkey`);
      await addForeignKeyIfMissing(schema, 'zone_risk_scores', 'zone_id', 'zones', 'id', `${schema}_zone_risk_scores_zone_id_fkey`);
      await addForeignKeyIfMissing(schema, 'personnel', 'assigned_zone_id', 'zones', 'id', `${schema}_personnel_assigned_zone_id_fkey`);

      if (await columnExists(schema, 'cameras', 'zone')) {
        await queryInterface.removeColumn({ schema, tableName: 'cameras' }, 'zone', { transaction });
      }
      if (await columnExists(schema, 'anomaly_rules', 'zone')) {
        await queryInterface.removeColumn({ schema, tableName: 'anomaly_rules' }, 'zone', { transaction });
      }
      if (await columnExists(schema, 'zone_risk_scores', 'zone')) {
        await queryInterface.removeColumn({ schema, tableName: 'zone_risk_scores' }, 'zone', { transaction });
      }
      if (await columnExists(schema, 'personnel', 'assigned_zone')) {
        await queryInterface.removeColumn({ schema, tableName: 'personnel' }, 'assigned_zone', { transaction });
      }
    }

    await transaction.commit();
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    const tenantRows = await queryInterface.sequelize.query(
      'SELECT schema_name FROM public.tenants WHERE is_active = true',
      { type: Sequelize.QueryTypes.SELECT, transaction }
    );

    const schemas = tenantRows
      .map((row) => row.schema_name)
      .filter((schema) => SAFE_SCHEMA.test(schema));

    const columnExists = async (schema, tableName, columnName) => {
      const rows = await queryInterface.sequelize.query(
        `
          SELECT 1
          FROM information_schema.columns
          WHERE table_schema = :schema
            AND table_name = :tableName
            AND column_name = :columnName
          LIMIT 1
        `,
        {
          replacements: { schema, tableName, columnName },
          type: Sequelize.QueryTypes.SELECT,
          transaction
        }
      );
      return rows.length > 0;
    };

    const removeConstraintIfExists = async (schema, tableName, constraintName) => {
      const rows = await queryInterface.sequelize.query(
        `
          SELECT 1
          FROM pg_constraint c
          JOIN pg_class t ON t.oid = c.conrelid
          JOIN pg_namespace ns ON ns.oid = t.relnamespace
          WHERE ns.nspname = :schema
            AND t.relname = :tableName
            AND c.conname = :constraintName
          LIMIT 1
        `,
        {
          replacements: { schema, tableName, constraintName },
          type: Sequelize.QueryTypes.SELECT,
          transaction
        }
      );

      if (rows.length > 0) {
        await queryInterface.removeConstraint({ schema, tableName }, constraintName, { transaction });
      }
    };

    for (const schema of schemas) {
      if (!(await columnExists(schema, 'cameras', 'zone'))) {
        await queryInterface.addColumn(
          { schema, tableName: 'cameras' },
          'zone',
          { type: Sequelize.STRING, allowNull: true },
          { transaction }
        );
      }
      if (!(await columnExists(schema, 'anomaly_rules', 'zone'))) {
        await queryInterface.addColumn(
          { schema, tableName: 'anomaly_rules' },
          'zone',
          { type: Sequelize.STRING, allowNull: true },
          { transaction }
        );
      }
      if (!(await columnExists(schema, 'zone_risk_scores', 'zone'))) {
        await queryInterface.addColumn(
          { schema, tableName: 'zone_risk_scores' },
          'zone',
          { type: Sequelize.STRING, allowNull: true },
          { transaction }
        );
      }
      if (!(await columnExists(schema, 'personnel', 'assigned_zone'))) {
        await queryInterface.addColumn(
          { schema, tableName: 'personnel' },
          'assigned_zone',
          { type: Sequelize.STRING, allowNull: true },
          { transaction }
        );
      }

      await queryInterface.sequelize.query(
        `
          UPDATE "${schema}"."cameras" c
          SET zone = z.name
          FROM "${schema}"."zones" z
          WHERE c.zone_id = z.id
        `,
        { transaction }
      );

      await queryInterface.sequelize.query(
        `
          UPDATE "${schema}"."anomaly_rules" ar
          SET zone = z.name
          FROM "${schema}"."zones" z
          WHERE ar.zone_id = z.id
        `,
        { transaction }
      );

      await queryInterface.sequelize.query(
        `
          UPDATE "${schema}"."zone_risk_scores" zrs
          SET zone = z.name
          FROM "${schema}"."zones" z
          WHERE zrs.zone_id = z.id
        `,
        { transaction }
      );

      await queryInterface.sequelize.query(
        `
          UPDATE "${schema}"."personnel" p
          SET assigned_zone = z.name
          FROM "${schema}"."zones" z
          WHERE p.assigned_zone_id = z.id
        `,
        { transaction }
      );

      await removeConstraintIfExists(schema, 'cameras', `${schema}_cameras_zone_id_fkey`);
      await removeConstraintIfExists(schema, 'anomaly_rules', `${schema}_anomaly_rules_zone_id_fkey`);
      await removeConstraintIfExists(schema, 'zone_risk_scores', `${schema}_zone_risk_scores_zone_id_fkey`);
      await removeConstraintIfExists(schema, 'personnel', `${schema}_personnel_assigned_zone_id_fkey`);

      if (await columnExists(schema, 'cameras', 'zone_id')) {
        await queryInterface.removeColumn({ schema, tableName: 'cameras' }, 'zone_id', { transaction });
      }
      if (await columnExists(schema, 'anomaly_rules', 'zone_id')) {
        await queryInterface.removeColumn({ schema, tableName: 'anomaly_rules' }, 'zone_id', { transaction });
      }
      if (await columnExists(schema, 'zone_risk_scores', 'zone_id')) {
        await queryInterface.removeColumn({ schema, tableName: 'zone_risk_scores' }, 'zone_id', { transaction });
      }
      if (await columnExists(schema, 'personnel', 'assigned_zone_id')) {
        await queryInterface.removeColumn({ schema, tableName: 'personnel' }, 'assigned_zone_id', { transaction });
      }

      await queryInterface.sequelize.query(`DROP TABLE IF EXISTS "${schema}"."zones" CASCADE`, { transaction });
    }

    await transaction.commit();
  }
};
