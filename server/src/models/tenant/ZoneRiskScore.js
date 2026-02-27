import { Model } from 'sequelize';

export default (sequelize, DataTypes) => {
  class ZoneRiskScore extends Model {
    static associate(models) {
      ZoneRiskScore.belongsTo(models.Zone, { foreignKey: 'zone_id', as: 'zone' });
    }
  }

  ZoneRiskScore.init({
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    zone_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'zones',
        key: 'id'
      }
    },
    risk_score: { type: DataTypes.INTEGER }, // 0-100
    risk_factor: { type: DataTypes.STRING }, // e.g. "High Frequency Fights"
    last_calculated: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
  }, {
    sequelize,
    modelName: 'ZoneRiskScore',
    tableName: 'zone_risk_scores',
    timestamps: false
  });

  return ZoneRiskScore;
};