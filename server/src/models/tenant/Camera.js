import { Model } from 'sequelize';

export default (sequelize, DataTypes) => {
  class Camera extends Model {
    static associate(models) {
      Camera.belongsTo(models.Zone, { foreignKey: 'zone_id', as: 'zone' });
      Camera.hasMany(models.CrowdMetric, { foreignKey: 'camera_id', as: 'crowdMetrics' });
    }
  }

  Camera.init({
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING },
    rtsp_url: { type: DataTypes.TEXT, allowNull: false },
    location: { type: DataTypes.GEOMETRY('POINT'), allowNull: false },
    location_name: { type: DataTypes.STRING },
    zone_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'zones',
        key: 'id'
      }
    },
    status: { 
      type: DataTypes.ENUM('online', 'offline', 'maintenance'), 
      defaultValue: 'online' 
    }
  }, {
    sequelize,
    modelName: 'Camera',
    tableName: 'cameras',
    timestamps: true
  });

  return Camera;
};