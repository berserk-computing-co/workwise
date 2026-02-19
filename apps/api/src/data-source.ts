import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { getDatabaseConfig } from './config/database.config.js';

// Load .env.local first, then .env
config({ path: '.env.local' });
config({ path: '.env' });

export default new DataSource({
  ...getDatabaseConfig(process.env),
  entities: ['src/**/entities/*.entity.ts'],
  migrations: ['src/migrations/*.ts'],
});
