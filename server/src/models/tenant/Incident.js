import { Model } from 'sequelize';

export default (sequelize, DataTypes) => {
  class Incident extends Model {
    static associate(models) {
      Incident.belongsTo(models.Personnel, { foreignKey: 'assigned_responder_id', as: 'responder' });
      Incident.belongsTo(models.Personnel, { foreignKey: 'verified_by', as: 'verifier' });
      Incident.belongsTo(models.Camera, { foreignKey: 'camera_id', as: 'camera' });
      Incident.hasMany(models.IncidentHistory, { foreignKey: 'incident_id', as: 'history' });
    }
  }

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
    detected_class: { type: DataTypes.STRING },
    location: { type: DataTypes.GEOMETRY('POINT'), allowNull: false },
    media_url: { type: DataTypes.TEXT },
    confidence: { type: DataTypes.FLOAT },
    confidence_score: { type: DataTypes.FLOAT },
    verified_by: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'personnel',
        key: 'id'
      }
    },
    verification_status: {
      type: DataTypes.ENUM('pending', 'verified', 'rejected'),
      defaultValue: 'pending'
    },
    
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