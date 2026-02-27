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
        if (!(await tableExists(schema, 'incidents'))) continue;

        if (!(await columnExists(schema, 'incidents', 'confidence_score'))) {
          await queryInterface.addColumn(
            { schema, tableName: 'incidents' },
            'confidence_score',
            { type: Sequelize.FLOAT, allowNull: true },
            { transaction }
          );
        }

        if (!(await columnExists(schema, 'incidents', 'verified_by'))) {
          await queryInterface.addColumn(
            { schema, tableName: 'incidents' },
            'verified_by',
            { type: Sequelize.UUID, allowNull: true },
            { transaction }
          );
        }

        if (!(await columnExists(schema, 'incidents', 'verification_status'))) {
          await queryInterface.addColumn(
            { schema, tableName: 'incidents' },
            'verification_status',
            {
              type: Sequelize.ENUM('pending', 'verified', 'rejected'),
              allowNull: false,
              defaultValue: 'pending'
            },
            { transaction }
          );
        }

        await queryInterface.sequelize.query(
          `
            UPDATE "${schema}"."incidents"
            SET confidence_score = confidence
            WHERE confidence_score IS NULL
              AND confidence IS NOT NULL
          `,
          { transaction }
        );

        await queryInterface.sequelize.query(
          `
            UPDATE "${schema}"."incidents"
            SET verification_status = CASE
              WHEN status = 'false_alarm' THEN 'rejected'::"${schema}"."enum_incidents_verification_status"
              ELSE 'pending'::"${schema}"."enum_incidents_verification_status"
            END
            WHERE verification_status IS NULL
          `,
          { transaction }
        );

        const verifierFk = `${schema}_incidents_verified_by_fkey`;
        if (!(await constraintExists(schema, 'incidents', verifierFk))) {
          await queryInterface.addConstraint(
            { schema, tableName: 'incidents' },
            {
              fields: ['verified_by'],
              type: 'foreign key',
              name: verifierFk,
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
          `CREATE INDEX IF NOT EXISTS "${schema}_incidents_verification_status_idx" ON "${schema}"."incidents" ("verification_status")`,
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
        await queryInterface.sequelize.query(
          `DROP INDEX IF EXISTS "${schema}_incidents_verification_status_idx"`,
          { transaction }
        );

        await queryInterface.sequelize.query(
          `ALTER TABLE "${schema}"."incidents" DROP CONSTRAINT IF EXISTS "${schema}_incidents_verified_by_fkey"`,
          { transaction }
        );

        if (await columnExists(schema, 'incidents', 'verification_status')) {
          await queryInterface.removeColumn(
            { schema, tableName: 'incidents' },
            'verification_status',
            { transaction }
          );
        }

        if (await columnExists(schema, 'incidents', 'verified_by')) {
          await queryInterface.removeColumn(
            { schema, tableName: 'incidents' },
            'verified_by',
            { transaction }
          );
        }

        if (await columnExists(schema, 'incidents', 'confidence_score')) {
          await queryInterface.removeColumn(
            { schema, tableName: 'incidents' },
            'confidence_score',
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
