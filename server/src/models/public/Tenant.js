import { Model } from 'sequelize';

export default (sequelize, DataTypes) => {
  class Tenant extends Model {}

  Tenant.init({
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false },
    business_code: { type: DataTypes.STRING, unique: true, allowNull: false }, // "CHN-POL"
    schema_name: { type: DataTypes.STRING, unique: true, allowNull: false },   // "tenant_chennai"
    db_host: { type: DataTypes.STRING }, 
    is_active: { type: DataTypes.BOOLEAN, defaultValue: true }
  }, {
    sequelize,
    modelName: 'Tenant',
    schema: 'public',
    tableName: 'tenants',
    timestamps: true
  });

  return Tenant;
};