export default (sequelize, DataTypes) => {
	const Incident = sequelize.define('Incident', {
		id: {
			type: DataTypes.UUID,
			defaultValue: DataTypes.UUIDV4,
			primaryKey: true,
		},
		camera_id: {
			type: DataTypes.UUID,
			allowNull: false,
		},
		detection_type: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		confidence: {
			type: DataTypes.FLOAT,
			allowNull: false,
		},
		source: {
			type: DataTypes.STRING,
			allowNull: false,
			defaultValue: 'AI',
		},
		status: {
			type: DataTypes.STRING,
			allowNull: false,
			defaultValue: 'Detected',
		},
		snapshot: {
			type: DataTypes.TEXT,
			allowNull: true,
		},
	}, {
		tableName: 'incidents',
		underscored: true,
	});

	Incident.associate = (models) => {
		Incident.belongsTo(models.Camera, { foreignKey: 'camera_id' });
	};

	return Incident;
};
