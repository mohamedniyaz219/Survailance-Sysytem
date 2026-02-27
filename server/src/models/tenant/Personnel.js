import { Model } from 'sequelize';

export default (sequelize, DataTypes) => {
  class Personnel extends Model {
    static associate(models) {
      Personnel.belongsTo(models.Zone, { foreignKey: 'assigned_zone_id', as: 'assignedZone' });
    }
  }

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
    assigned_zone_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'zones',
        key: 'id'
      }
    },
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