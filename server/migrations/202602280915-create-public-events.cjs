'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      { schema: 'public', tableName: 'events' },
      {
        id: {
          type: Sequelize.INTEGER,
          autoIncrement: true,
          primaryKey: true,
          allowNull: false
        },
        business_code: {
          type: Sequelize.STRING,
          allowNull: false
        },
        title: {
          type: Sequelize.STRING,
          allowNull: false
        },
        description: {
          type: Sequelize.TEXT,
          allowNull: true
        },
        event_type: {
          type: Sequelize.STRING,
          allowNull: true
        },
        location_name: {
          type: Sequelize.STRING,
          allowNull: true
        },
        start_at: {
          type: Sequelize.DATE,
          allowNull: false
        },
        end_at: {
          type: Sequelize.DATE,
          allowNull: true
        },
        status: {
          type: Sequelize.STRING,
          allowNull: false,
          defaultValue: 'planned'
        },
        is_active: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: true
        },
        metadata: {
          type: Sequelize.JSONB,
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
      }
    );

    await queryInterface.addIndex({ schema: 'public', tableName: 'events' }, ['business_code']);
    await queryInterface.addIndex({ schema: 'public', tableName: 'events' }, ['business_code', 'status']);
    await queryInterface.addIndex({ schema: 'public', tableName: 'events' }, ['business_code', 'start_at']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable({ schema: 'public', tableName: 'events' });
  }
};
