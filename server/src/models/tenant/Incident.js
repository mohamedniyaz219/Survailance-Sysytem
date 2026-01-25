import { Model } from 'sequelize';

export default (sequelize, DataTypes) => {
  class Incident extends Model {}

  Incident.init({
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    
    // UPDATED: Covers all 6 types you requested
    type: { 
      type: DataTypes.ENUM(
        'fire', 
        'weapon', 
        'crowd', 
        'fight', 
        'loitering', 
        'unattended_object'
      ),
      allowNull: false
    },
    
    source: { 
      type: DataTypes.ENUM('AI', 'APP_USER'), 
      defaultValue: 'AI'
    },

    description: { type: DataTypes.TEXT },
    location: { type: DataTypes.GEOMETRY('POINT'), allowNull: false },
    media_url: { type: DataTypes.TEXT }, 
    confidence: { type: DataTypes.FLOAT }, 
    
    status: { 
      type: DataTypes.ENUM('new', 'assigned', 'resolved', 'false_alarm'),
      defaultValue: 'new'
    },
    
    priority: {
       type: DataTypes.ENUM('high', 'medium', 'low'),
       defaultValue: 'high'
    },

    camera_id: { type: DataTypes.INTEGER, allowNull: true },
    reported_by: { type: DataTypes.UUID, allowNull: true }, 
    assigned_responder_id: { type: DataTypes.UUID, allowNull: true } 
    
  }, {
    sequelize,
    modelName: 'Incident',
    tableName: 'incidents',
    timestamps: true
  });

  return Incident;
};