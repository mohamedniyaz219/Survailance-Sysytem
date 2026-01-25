import dotenv from 'dotenv';
import { Sequelize } from 'sequelize';

const env = process.env.NODE_ENV === 'production' ? 'production' : 'development';
const envFile = `.env.${env}`;

dotenv.config({ path: envFile });
dotenv.config();

const {
  DB_HOST,
  DB_PORT = 5432,
  DB_NAME,
  DB_USER,
  DB_PASSWORD,
  DB_SSL,
  DB_LOGGING,
} = process.env;

if (!DB_HOST || !DB_NAME || !DB_USER) {
  throw new Error('Database environment variables are missing (DB_HOST, DB_NAME, DB_USER)');
}

export const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
  host: DB_HOST,
  port: Number(DB_PORT),
  dialect: 'postgres',
  logging: DB_LOGGING === 'true' ? console.log : false,
  dialectOptions: DB_SSL === 'true' ? { ssl: { require: true, rejectUnauthorized: false } } : {},
});

export async function initDatabase() {
  await sequelize.authenticate();

  // Optional sync for local development. Set DB_SYNC=true to enable auto migrations.
  if (process.env.DB_SYNC === 'true') {
    await sequelize.sync({ alter: true });
  }
}
