import { Model } from 'sequelize';

export default (sequelize, DataTypes) => {
  class Personnel extends Model {}

  Personnel.init({
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    
    // Identity
    name: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, unique: true, allowNull: false },
    password_hash: { type: DataTypes.STRING, allowNull: false },
    badge_id: { type: DataTypes.STRING, unique: true }, // e.g. "CHN-POL-405"
    
    // Access Control
    role: { 
      type: DataTypes.ENUM('admin', 'responder', 'analyst', 'dispatcher'), 
      defaultValue: 'responder' 
    },
    
    // Operational
    assigned_zone: { type: DataTypes.STRING }, // e.g., "T-Nagar"
    fcm_token: { type: DataTypes.TEXT }, // For Push Notifications
    is_active: { type: DataTypes.BOOLEAN, defaultValue: true }
  }, {
    sequelize,
    modelName: 'Personnel', // Renamed from 'User'
    tableName: 'personnel',
    timestamps: true
  });

  return Personnel;
};