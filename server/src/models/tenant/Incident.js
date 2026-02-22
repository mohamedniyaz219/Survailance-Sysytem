import { Model } from 'sequelize';

export default (sequelize, DataTypes) => {
  class Incident extends Model {}

  Incident.init({
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    type: { 
      type: DataTypes.ENUM('fire', 'weapon', 'crowd', 'fight', 'accident'),
      allowNull: false
    },
    source: { 
      type: DataTypes.ENUM('AI', 'CITIZEN'), 
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

    // Foreign Keys
    camera_id: { type: DataTypes.INTEGER, allowNull: true },
    
    // LINK TO PUBLIC SCHEMA (Logical FK)
    reported_by: { 
      type: DataTypes.UUID, 
      allowNull: true,
      comment: "Refers to public.citizens.id" 
    }, 
    
    // LINK TO LOCAL TENANT SCHEMA
    assigned_responder_id: { 
      type: DataTypes.UUID, 
      allowNull: true,
      references: {
        model: 'personnel', // Links to the Personnel table above
        key: 'id'
      }
    }
    
  }, {
    sequelize,
    modelName: 'Incident',
    tableName: 'incidents',
    timestamps: true
  });

  return Incident;
};