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

      for (const schema of schemas) {
        if (!(await schemaExists(schema))) {
          continue;
        }

        if (!(await tableExists(schema, 'user_reports'))) {
          await queryInterface.createTable(
            { schema, tableName: 'user_reports' },
            {
              id: {
                type: Sequelize.UUID,
                allowNull: false,
                primaryKey: true,
                defaultValue: Sequelize.UUIDV4
              },
              event_id: {
                type: Sequelize.INTEGER,
                allowNull: false
              },
              global_user_id: {
                type: Sequelize.UUID,
                allowNull: true
              },
              incident_type: {
                type: Sequelize.STRING,
                allowNull: false
              },
              description: {
                type: Sequelize.TEXT,
                allowNull: true
              },
              location_name: {
                type: Sequelize.STRING,
                allowNull: true
              },
              location: {
                type: Sequelize.GEOMETRY('POINT'),
                allowNull: true
              },
              media_url: {
                type: Sequelize.TEXT,
                allowNull: true
              },
              media_type: {
                type: Sequelize.ENUM('photo', 'video', 'unknown'),
                allowNull: false,
                defaultValue: 'unknown'
              },
              status: {
                type: Sequelize.ENUM('new', 'assigned', 'in_progress', 'resolved', 'rejected'),
                allowNull: false,
                defaultValue: 'new'
              },
              assigned_responder_id: {
                type: Sequelize.UUID,
                allowNull: true
              },
              assigned_at: {
                type: Sequelize.DATE,
                allowNull: true
              },
              createdAt: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.fn('NOW')
              },
              updatedAt: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.fn('NOW')
              }
            },
            { transaction }
          );

          await queryInterface.addConstraint(
            { schema, tableName: 'user_reports' },
            {
              fields: ['assigned_responder_id'],
              type: 'foreign key',
              name: `${schema}_user_reports_assigned_responder_id_fkey`,
              references: {
                table: { schema, tableName: 'personnel' },
                field: 'id'
              },
              onUpdate: 'CASCADE',
              onDelete: 'SET NULL',
              transaction
            }
          );

          await queryInterface.addIndex(
            { schema, tableName: 'user_reports' },
            ['status'],
            { transaction }
          );
          await queryInterface.addIndex(
            { schema, tableName: 'user_reports' },
            ['event_id'],
            { transaction }
          );
          await queryInterface.addIndex(
            { schema, tableName: 'user_reports' },
            ['assigned_responder_id'],
            { transaction }
          );
          await queryInterface.addIndex(
            { schema, tableName: 'user_reports' },
            ['createdAt'],
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

      for (const schema of schemas) {
        if (!(await schemaExists(schema))) {
          continue;
        }
        await queryInterface.dropTable({ schema, tableName: 'user_reports' }, { transaction });
      }

      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }
};
