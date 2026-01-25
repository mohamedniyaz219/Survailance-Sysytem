import { Model } from 'sequelize';

export default (sequelize, DataTypes) => {
  class ResponderTracking extends Model {}

  ResponderTracking.init({
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    responder_id: { type: DataTypes.UUID, allowNull: false }, 
    tenant_schema: { type: DataTypes.STRING, allowNull: false },
    current_location: { type: DataTypes.GEOMETRY('POINT'), allowNull: false },
    heading: { type: DataTypes.FLOAT },
    speed: { type: DataTypes.FLOAT },
    last_updated: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
  }, {
    sequelize,
    modelName: 'ResponderTracking',
    schema: 'public',
    tableName: 'responder_tracking',
    timestamps: false
  });

  return ResponderTracking;
};