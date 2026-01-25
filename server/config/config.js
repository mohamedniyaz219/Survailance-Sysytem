import dotenv from 'dotenv';

const env = process.env.NODE_ENV === 'production' ? 'production' : 'development';
const envFile = `.env.${env}`;

dotenv.config({ path: envFile });
dotenv.config();

const common = {
	username: process.env.DB_USER || '',
	password: process.env.DB_PASSWORD || null,
	database: process.env.DB_NAME || 'survailance_sys',
	host: process.env.DB_HOST || '127.0.0.1',
	port: Number(process.env.DB_PORT) || 5432,
	dialect: 'postgres',
};

export default {
	development: { ...common },
	test: { ...common, database: `${common.database}_test` },
	production: {
		...common,
		dialectOptions: process.env.DB_SSL === 'true'
			? { ssl: { require: true, rejectUnauthorized: false } }
			: {},
	},
};
