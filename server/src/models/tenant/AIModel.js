import { Model } from 'sequelize';

export default (sequelize, DataTypes) => {
  class AIModel extends Model {}

  AIModel.init({
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING }, // e.g., "YOLOv8-Weapons"
    version: { type: DataTypes.STRING }, // "v1.2"
    accuracy_score: { type: DataTypes.FLOAT },
    is_active: { type: DataTypes.BOOLEAN, defaultValue: false }
  }, {
    sequelize,
    modelName: 'AIModel',
    tableName: 'ai_models',
    timestamps: true
  });

  return AIModel;
};