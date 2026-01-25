import { Model } from 'sequelize';

export default (sequelize, DataTypes) => {
  class CameraHealthLog extends Model {}

  CameraHealthLog.init({
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    camera_id: { type: DataTypes.INTEGER },
    status: { type: DataTypes.STRING }, // 'offline', 'lagging'
    error_message: { type: DataTypes.TEXT },
    latency_ms: { type: DataTypes.INTEGER },
    checked_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
  }, {
    sequelize,
    modelName: 'CameraHealthLog',
    tableName: 'camera_health_logs',
    timestamps: false
  });

  return CameraHealthLog;
};