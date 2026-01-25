import { Model } from 'sequelize';

export default (sequelize, DataTypes) => {
  class ZoneRiskScore extends Model {}

  ZoneRiskScore.init({
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    zone: { type: DataTypes.STRING },
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