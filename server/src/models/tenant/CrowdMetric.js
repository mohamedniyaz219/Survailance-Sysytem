import { Model } from 'sequelize';

export default (sequelize, DataTypes) => {
  class CrowdMetric extends Model {}

  CrowdMetric.init({
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    camera_id: { type: DataTypes.INTEGER },
    people_count: { type: DataTypes.INTEGER },
    density_level: { type: DataTypes.STRING }, 
    timestamp: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
  }, {
    sequelize,
    modelName: 'CrowdMetric',
    tableName: 'crowd_metrics',
    timestamps: false
  });

  return CrowdMetric;
};