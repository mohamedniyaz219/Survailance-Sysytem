import { Model } from 'sequelize';

export default (sequelize, DataTypes) => {
  class CrowdMetric extends Model {
    static associate(models) {
      CrowdMetric.belongsTo(models.Camera, { foreignKey: 'camera_id', as: 'camera' });
    }
  }

  CrowdMetric.init({
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    camera_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'cameras',
        key: 'id'
      }
    },
    people_count: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    density_level: {
      type: DataTypes.ENUM('normal', 'dense', 'critical'),
      allowNull: false,
      defaultValue: 'normal'
    },
    flow_direction: {
      type: DataTypes.ENUM('in', 'out', 'static', 'chaotic'),
      allowNull: false,
      defaultValue: 'static'
    },
    captured_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
  }, {
    sequelize,
    modelName: 'CrowdMetric',
    tableName: 'crowd_metrics',
    timestamps: false
  });

  return CrowdMetric;
};