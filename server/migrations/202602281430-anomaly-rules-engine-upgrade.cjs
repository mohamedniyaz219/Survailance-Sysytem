'use strict';

const SAFE_SCHEMA = /^[a-zA-Z_][a-zA-Z0-9_]*$/;

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      const tenantRows = await queryInterface.sequelize.query(
        'SELECT schema_name FROM public.tenants WHERE is_active = true',
        { type: Sequelize.QueryTypes.SELECT, transaction }
      );

      const schemas = tenantRows
        .map((row) => row.schema_name)
        .filter((schema) => SAFE_SCHEMA.test(schema));

      const schemaExists = async (schema) => {
        const rows = await queryInterface.sequelize.query(
          `
            SELECT 1
            FROM information_schema.schemata
            WHERE schema_name = :schema
            LIMIT 1
          `,
          {
            replacements: { schema },
            type: Sequelize.QueryTypes.SELECT,
            transaction
          }
        );
        return rows.length > 0;
      };

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

      const constraintExists = async (schema, tableName, constraintName) => {
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
        return rows.length > 0;
      };

      for (const schema of schemas) {
        if (!(await schemaExists(schema))) continue;

        if (!(await columnExists(schema, 'anomaly_rules', 'name'))) {
          await queryInterface.addColumn(
            { schema, tableName: 'anomaly_rules' },
            'name',
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

        if (!(await columnExists(schema, 'anomaly_rules', 'created_by'))) {
          await queryInterface.addColumn(
            { schema, tableName: 'anomaly_rules' },
            'created_by',
            { type: Sequelize.UUID, allowNull: true },
            { transaction }
          );
        }

        const ruleTypeColumnTypeRows = await queryInterface.sequelize.query(
          `
            SELECT data_type, udt_name
            FROM information_schema.columns
            WHERE table_schema = :schema
              AND table_name = 'anomaly_rules'
              AND column_name = 'rule_type'
            LIMIT 1
          `,
          {
            replacements: { schema },
            type: Sequelize.QueryTypes.SELECT,
            transaction
          }
        );

        const ruleTypeMeta = ruleTypeColumnTypeRows[0];
        if (ruleTypeMeta && ruleTypeMeta.data_type === 'USER-DEFINED') {
          await queryInterface.sequelize.query(
            `ALTER TABLE "${schema}"."anomaly_rules" ALTER COLUMN "rule_type" TYPE VARCHAR(64) USING "rule_type"::text`,
            { transaction }
          );
        }

        await queryInterface.sequelize.query(
          `
            UPDATE "${schema}"."anomaly_rules"
            SET rule_type = CASE rule_type
              WHEN 'crowd_limit' THEN 'crowd_spike'
              WHEN 'fight_duration' THEN 'sudden_motion'
              WHEN 'loitering_time' THEN 'loitering'
              WHEN 'object_duration' THEN 'object_abandoned'
              WHEN 'fire_confidence' THEN 'crowd_spike'
              WHEN 'weapon_confidence' THEN 'sudden_motion'
              ELSE rule_type
            END
            WHERE rule_type IN (
              'crowd_limit',
              'fight_duration',
              'loitering_time',
              'object_duration',
              'fire_confidence',
              'weapon_confidence'
            )
          `,
          { transaction }
        );

        await queryInterface.sequelize.query(
          `
            UPDATE "${schema}"."anomaly_rules" ar
            SET zone = z.name
            FROM "${schema}"."zones" z
            WHERE ar.zone_id = z.id
              AND (ar.zone IS NULL OR BTRIM(ar.zone) = '')
          `,
          { transaction }
        );

        await queryInterface.sequelize.query(
          `
            UPDATE "${schema}"."anomaly_rules"
            SET name = COALESCE(name, INITCAP(REPLACE(rule_type, '_', ' ')) || ' Rule #' || id)
          `,
          { transaction }
        );

        await queryInterface.changeColumn(
          { schema, tableName: 'anomaly_rules' },
          'name',
          { type: Sequelize.STRING, allowNull: false },
          { transaction }
        );

        const createdByConstraintName = `${schema}_anomaly_rules_created_by_fkey`;
        if (!(await constraintExists(schema, 'anomaly_rules', createdByConstraintName))) {
          await queryInterface.addConstraint(
            { schema, tableName: 'anomaly_rules' },
            {
              fields: ['created_by'],
              type: 'foreign key',
              name: createdByConstraintName,
              references: {
                table: { schema, tableName: 'personnel' },
                field: 'id'
              },
              onUpdate: 'CASCADE',
              onDelete: 'SET NULL',
              transaction
            }
          );
        }

        await queryInterface.sequelize.query(
          `CREATE INDEX IF NOT EXISTS "${schema}_anomaly_rules_rule_type_idx" ON "${schema}"."anomaly_rules" ("rule_type")`,
          { transaction }
        );

        await queryInterface.sequelize.query(
          `CREATE INDEX IF NOT EXISTS "${schema}_anomaly_rules_is_active_idx" ON "${schema}"."anomaly_rules" ("is_active")`,
          { transaction }
        );
      }

      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      const tenantRows = await queryInterface.sequelize.query(
        'SELECT schema_name FROM public.tenants WHERE is_active = true',
        { type: Sequelize.QueryTypes.SELECT, transaction }
      );

      const schemas = tenantRows
        .map((row) => row.schema_name)
        .filter((schema) => SAFE_SCHEMA.test(schema));

      const schemaExists = async (schema) => {
        const rows = await queryInterface.sequelize.query(
          `
            SELECT 1
            FROM information_schema.schemata
            WHERE schema_name = :schema
            LIMIT 1
          `,
          {
            replacements: { schema },
            type: Sequelize.QueryTypes.SELECT,
            transaction
          }
        );
        return rows.length > 0;
      };

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

      for (const schema of schemas) {
        if (!(await schemaExists(schema))) continue;

        await queryInterface.sequelize.query(
          `DROP INDEX IF EXISTS "${schema}_anomaly_rules_rule_type_idx"`,
          { transaction }
        );

        await queryInterface.sequelize.query(
          `DROP INDEX IF EXISTS "${schema}_anomaly_rules_is_active_idx"`,
          { transaction }
        );

        const createdByConstraintName = `${schema}_anomaly_rules_created_by_fkey`;
        await queryInterface.sequelize.query(
          `ALTER TABLE "${schema}"."anomaly_rules" DROP CONSTRAINT IF EXISTS "${createdByConstraintName}"`,
          { transaction }
        );

        if (await columnExists(schema, 'anomaly_rules', 'created_by')) {
          await queryInterface.removeColumn(
            { schema, tableName: 'anomaly_rules' },
            'created_by',
            { transaction }
          );
        }

        if (await columnExists(schema, 'anomaly_rules', 'zone')) {
          await queryInterface.removeColumn(
            { schema, tableName: 'anomaly_rules' },
            'zone',
            { transaction }
          );
        }

        if (await columnExists(schema, 'anomaly_rules', 'name')) {
          await queryInterface.removeColumn(
            { schema, tableName: 'anomaly_rules' },
            'name',
            { transaction }
          );
        }
      }

      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }
};
