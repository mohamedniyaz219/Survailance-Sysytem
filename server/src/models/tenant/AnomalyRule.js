import { Model } from 'sequelize';

export default (sequelize, DataTypes) => {
  class AnomalyRule extends Model {
    static associate(models) {
      AnomalyRule.belongsTo(models.Zone, { foreignKey: 'zone_id', as: 'zoneRef' });
      AnomalyRule.belongsTo(models.Personnel, { foreignKey: 'created_by', as: 'createdBy' });
    }
  }

  AnomalyRule.init({
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },

    name: { type: DataTypes.STRING, allowNull: false },
    rule_type: { type: DataTypes.STRING, allowNull: false },
    threshold_value: { type: DataTypes.INTEGER }, // e.g., 50 (people), 10 (seconds)
    zone: { type: DataTypes.STRING },
    zone_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'zones',
        key: 'id'
      }
    },
    created_by: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'personnel',
        key: 'id'
      }
    },
    is_active: { type: DataTypes.BOOLEAN, defaultValue: true }
  }, {
    sequelize,
    modelName: 'AnomalyRule',
    tableName: 'anomaly_rules',
    timestamps: true
  });

  return AnomalyRule;
};