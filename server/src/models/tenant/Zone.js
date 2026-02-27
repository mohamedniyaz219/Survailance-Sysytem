import { Model } from 'sequelize';

export default (sequelize, DataTypes) => {
  class Zone extends Model {
    static associate(models) {
      Zone.hasMany(models.Camera, { foreignKey: 'zone_id', as: 'cameras' });
      Zone.hasMany(models.AnomalyRule, { foreignKey: 'zone_id', as: 'anomalyRules' });
      Zone.hasMany(models.ZoneRiskScore, { foreignKey: 'zone_id', as: 'riskScores' });
    }
  }

  Zone.init(
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      name: { type: DataTypes.STRING, allowNull: false, unique: true },
      description: { type: DataTypes.TEXT },
      is_active: { type: DataTypes.BOOLEAN, defaultValue: true }
    },
    {
      sequelize,
      modelName: 'Zone',
      tableName: 'zones',
      timestamps: true
    }
  );

  return Zone;
};
