import { Model } from 'sequelize';

export default (sequelize, DataTypes) => {
  class Personnel extends Model {}

  Personnel.init({
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    badge_id: { type: DataTypes.STRING, unique: true },
    name: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, unique: true, allowNull: false },
    password_hash: { type: DataTypes.STRING, allowNull: false },
    role: { 
      type: DataTypes.ENUM('admin', 'responder', 'analyst', 'dispatcher'), 
      defaultValue: 'responder' 
    },
    assigned_zone: { type: DataTypes.STRING },
    fcm_token: { type: DataTypes.TEXT },
    is_active: { type: DataTypes.BOOLEAN, defaultValue: true }
  }, {
    sequelize,
    modelName: 'Personnel',
    tableName: 'personnel',
    timestamps: true
  });

  return Personnel;
};