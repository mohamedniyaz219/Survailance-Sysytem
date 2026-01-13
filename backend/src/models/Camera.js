export default (sequelize, DataTypes) => {
	const Camera = sequelize.define('Camera', {
		id: {
			type: DataTypes.UUID,
			defaultValue: DataTypes.UUIDV4,
			primaryKey: true,
		},
		name: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		rtsp_url: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		location: {
			type: DataTypes.STRING,
			allowNull: true,
		},
		status: {
			type: DataTypes.STRING,
			allowNull: false,
			defaultValue: 'active',
		},
	}, {
		tableName: 'cameras',
		underscored: true,
	});

	return Camera;
};
