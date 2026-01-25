import { Model } from 'sequelize';

export default (sequelize, DataTypes) => {
  class TenantAccess extends Model {}

  TenantAccess.init({
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    official_email: { type: DataTypes.STRING, allowNull: false }, 
    target_schema: { type: DataTypes.STRING, allowNull: false }, // "tenant_mumbai"
    role: { 
      type: DataTypes.ENUM('viewer', 'collaborator'), 
      defaultValue: 'viewer' 
    },
    granted_by: { type: DataTypes.UUID }, 
    expires_at: { type: DataTypes.DATE }
  }, {
    sequelize,
    modelName: 'TenantAccess',
    schema: 'public',
    tableName: 'tenant_access',
    timestamps: false
  });

  return TenantAccess;
};