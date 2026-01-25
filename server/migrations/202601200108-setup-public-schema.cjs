'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      // 1. Enable Extensions
      await queryInterface.sequelize.query('CREATE EXTENSION IF NOT EXISTS postgis;', { transaction });
      // await queryInterface.sequelize.query('CREATE EXTENSION IF NOT EXISTS vector;', { transaction });

      // 2. Create Tenants Table
      await queryInterface.createTable('tenants', {
        id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
        name: { type: Sequelize.STRING, allowNull: false },
        business_code: { type: Sequelize.STRING, unique: true, allowNull: false },
        schema_name: { type: Sequelize.STRING, unique: true, allowNull: false },
        db_host: { type: Sequelize.STRING },
        is_active: { type: Sequelize.BOOLEAN, defaultValue: true },
        createdAt: { type: Sequelize.DATE, defaultValue: Sequelize.literal('NOW()') },
        updatedAt: { type: Sequelize.DATE, defaultValue: Sequelize.literal('NOW()') }
      }, { transaction, schema: 'public' });

      // 3. Create Global Users (Citizens)
      await queryInterface.createTable('global_users', {
        id: { type: Sequelize.UUID, defaultValue: Sequelize.literal('gen_random_uuid()'), primaryKey: true },
        phone: { type: Sequelize.STRING, unique: true, allowNull: false },
        name: { type: Sequelize.STRING },
        home_city: { type: Sequelize.STRING },
        blood_group: { type: Sequelize.STRING(5) },
        emergency_contact: { type: Sequelize.STRING(20) },
        // Note: Using ARRAY(FLOAT) to represent vector in migration, 
        // but PG will treat it as vector if cast correctly in queries.
        face_vector: { type: Sequelize.ARRAY(Sequelize.FLOAT) }, 
        createdAt: { type: Sequelize.DATE, defaultValue: Sequelize.literal('NOW()') },
        updatedAt: { type: Sequelize.DATE, defaultValue: Sequelize.literal('NOW()') }
      }, { transaction, schema: 'public' });

      // 4. Create Tenant Access
      await queryInterface.createTable('tenant_access', {
        id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
        official_email: { type: Sequelize.STRING, allowNull: false },
        target_schema: { type: Sequelize.STRING, allowNull: false },
        role: { type: Sequelize.ENUM('viewer', 'collaborator'), defaultValue: 'viewer' },
        granted_by: { type: Sequelize.UUID },
        expires_at: { type: Sequelize.DATE },
        // No timestamps for this table in your model
      }, { transaction, schema: 'public' });

      // 5. Create Responder Tracking
      await queryInterface.createTable('responder_tracking', {
        id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
        responder_id: { type: Sequelize.UUID, allowNull: false },
        tenant_schema: { type: Sequelize.STRING, allowNull: false },
        current_location: { type: Sequelize.GEOMETRY('POINT'), allowNull: false },
        heading: { type: Sequelize.FLOAT },
        speed: { type: Sequelize.FLOAT },
        last_updated: { type: Sequelize.DATE, defaultValue: Sequelize.literal('NOW()') }
      }, { transaction, schema: 'public' });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.dropTable({ tableName: 'responder_tracking', schema: 'public' }, { transaction });
      await queryInterface.dropTable({ tableName: 'tenant_access', schema: 'public' }, { transaction });
      await queryInterface.dropTable({ tableName: 'global_users', schema: 'public' }, { transaction });
      await queryInterface.dropTable({ tableName: 'tenants', schema: 'public' }, { transaction });
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};