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

      for (const schema of schemas) {
        if (!(await schemaExists(schema))) continue;

        if (!(await columnExists(schema, 'incidents', 'detected_class'))) {
          await queryInterface.addColumn(
            { schema, tableName: 'incidents' },
            'detected_class',
            { type: Sequelize.STRING, allowNull: true },
            { transaction }
          );
        }
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

        if (await columnExists(schema, 'incidents', 'detected_class')) {
          await queryInterface.removeColumn(
            { schema, tableName: 'incidents' },
            'detected_class',
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
