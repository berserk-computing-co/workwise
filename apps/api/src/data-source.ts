import 'dotenv/config';
import { DataSource } from 'typeorm';
import { config } from 'dotenv';

// Load .env.local first, then .env
config({ path: '.env.local' });
config({ path: '.env' });

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5432),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: ['src/**/entities/*.entity.ts'],
  migrations: ['src/migrations/*.ts'],
});
