import { Model } from 'sequelize';

export default (sequelize, DataTypes) => {
  class IncidentHistory extends Model {
    static associate(models) {
      IncidentHistory.belongsTo(models.Incident, { foreignKey: 'incident_id', as: 'incident' });
    }
  }

  IncidentHistory.init({
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    incident_id: { type: DataTypes.UUID, allowNull: false },
    action_by: { type: DataTypes.UUID }, 
    action: { type: DataTypes.STRING }, 
    prev_status: { type: DataTypes.STRING },
    new_status: { type: DataTypes.STRING },
    comment: { type: DataTypes.TEXT },
    timestamp: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
  }, {
    sequelize,
    modelName: 'IncidentHistory',
    tableName: 'incident_history',
    timestamps: false
  });

  return IncidentHistory;
};