import { Model } from 'sequelize';

export default (sequelize, DataTypes) => {
  class AnomalyRule extends Model {}

  AnomalyRule.init({
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    
    // UPDATED: Rules corresponding to your incident types
    rule_type: { 
        type: DataTypes.ENUM(
          'crowd_limit',        // For 'crowd'
          'fight_duration',     // For 'fight' (how long until alert)
          'loitering_time',     // For 'loitering'
          'object_duration',    // For 'unattended_object'
          'fire_confidence',    // For 'fire' (threshold)
          'weapon_confidence'   // For 'weapon' (threshold)
        ) 
    },
    
    threshold_value: { type: DataTypes.INTEGER }, // e.g., 50 (people), 10 (seconds)
    zone: { type: DataTypes.STRING },
    severity: { type: DataTypes.ENUM('low', 'medium', 'high', 'critical') },
    is_active: { type: DataTypes.BOOLEAN, defaultValue: true }
  }, {
    sequelize,
    modelName: 'AnomalyRule',
    tableName: 'anomaly_rules',
    timestamps: true
  });

  return AnomalyRule;
};