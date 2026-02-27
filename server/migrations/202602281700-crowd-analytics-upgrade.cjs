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

      const tableExists = async (schema, tableName) => {
        const rows = await queryInterface.sequelize.query(
          `
            SELECT 1
            FROM information_schema.tables
            WHERE table_schema = :schema
              AND table_name = :tableName
            LIMIT 1
          `,
          {
            replacements: { schema, tableName },
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
        if (!(await tableExists(schema, 'crowd_metrics'))) continue;

        await queryInterface.sequelize.query(
          `
            DO $$
            BEGIN
              IF NOT EXISTS (
                SELECT 1
                FROM pg_type t
                JOIN pg_namespace n ON n.oid = t.typnamespace
                WHERE t.typname = 'enum_crowd_metrics_density_level'
                  AND n.nspname = '${schema}'
              ) THEN
                CREATE TYPE "${schema}"."enum_crowd_metrics_density_level"
                  AS ENUM ('normal', 'dense', 'critical');
              END IF;
            END $$;
          `,
          { transaction }
        );

        await queryInterface.sequelize.query(
          `
            DO $$
            BEGIN
              IF NOT EXISTS (
                SELECT 1
                FROM pg_type t
                JOIN pg_namespace n ON n.oid = t.typnamespace
                WHERE t.typname = 'enum_crowd_metrics_flow_direction'
                  AND n.nspname = '${schema}'
              ) THEN
                CREATE TYPE "${schema}"."enum_crowd_metrics_flow_direction"
                  AS ENUM ('in', 'out', 'static', 'chaotic');
              END IF;
            END $$;
          `,
          { transaction }
        );

        if (await columnExists(schema, 'crowd_metrics', 'timestamp')) {
          await queryInterface.renameColumn(
            { schema, tableName: 'crowd_metrics' },
            'timestamp',
            'captured_at',
            { transaction }
          );
        }

        if (!(await columnExists(schema, 'crowd_metrics', 'captured_at'))) {
          await queryInterface.addColumn(
            { schema, tableName: 'crowd_metrics' },
            'captured_at',
            { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
            { transaction }
          );
        }

        if (!(await columnExists(schema, 'crowd_metrics', 'flow_direction'))) {
          await queryInterface.addColumn(
            { schema, tableName: 'crowd_metrics' },
            'flow_direction',
            {
              type: Sequelize.ENUM('in', 'out', 'static', 'chaotic'),
              allowNull: false,
              defaultValue: 'static'
            },
            { transaction }
          );
        }

        await queryInterface.sequelize.query(
          `
            UPDATE "${schema}"."crowd_metrics"
            SET density_level = CASE
              WHEN COALESCE(people_count, 0) >= 30 THEN 'critical'
              WHEN COALESCE(people_count, 0) >= 15 THEN 'dense'
              ELSE 'normal'
            END
            WHERE density_level IS NULL OR BTRIM(density_level::text) = ''
          `,
          { transaction }
        );

        await queryInterface.sequelize.query(
          `
            ALTER TABLE "${schema}"."crowd_metrics"
            ALTER COLUMN density_level TYPE "${schema}"."enum_crowd_metrics_density_level"
            USING (
              CASE
                WHEN density_level::text = 'critical' THEN 'critical'::"${schema}"."enum_crowd_metrics_density_level"
                WHEN density_level::text = 'dense' THEN 'dense'::"${schema}"."enum_crowd_metrics_density_level"
                ELSE 'normal'::"${schema}"."enum_crowd_metrics_density_level"
              END
            )
          `,
          { transaction }
        );

        await queryInterface.changeColumn(
          { schema, tableName: 'crowd_metrics' },
          'people_count',
          { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
          { transaction }
        );

        await queryInterface.changeColumn(
          { schema, tableName: 'crowd_metrics' },
          'density_level',
          {
            type: Sequelize.ENUM('normal', 'dense', 'critical'),
            allowNull: false,
            defaultValue: 'normal'
          },
          { transaction }
        );

        await queryInterface.changeColumn(
          { schema, tableName: 'crowd_metrics' },
          'captured_at',
          { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
          { transaction }
        );

        await queryInterface.sequelize.query(
          `CREATE INDEX IF NOT EXISTS "${schema}_crowd_metrics_camera_time_idx" ON "${schema}"."crowd_metrics" ("camera_id", "captured_at" DESC)`,
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

      for (const schema of schemas) {
        await queryInterface.sequelize.query(
          `DROP INDEX IF EXISTS "${schema}_crowd_metrics_camera_time_idx"`,
          { transaction }
        );

        const hasCapturedAt = await queryInterface.sequelize.query(
          `
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = :schema
              AND table_name = 'crowd_metrics'
              AND column_name = 'captured_at'
            LIMIT 1
          `,
          { replacements: { schema }, type: Sequelize.QueryTypes.SELECT, transaction }
        );

        if (hasCapturedAt.length) {
          await queryInterface.renameColumn(
            { schema, tableName: 'crowd_metrics' },
            'captured_at',
            'timestamp',
            { transaction }
          );
        }

        const hasFlowDirection = await queryInterface.sequelize.query(
          `
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = :schema
              AND table_name = 'crowd_metrics'
              AND column_name = 'flow_direction'
            LIMIT 1
          `,
          { replacements: { schema }, type: Sequelize.QueryTypes.SELECT, transaction }
        );

        if (hasFlowDirection.length) {
          await queryInterface.removeColumn(
            { schema, tableName: 'crowd_metrics' },
            'flow_direction',
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
