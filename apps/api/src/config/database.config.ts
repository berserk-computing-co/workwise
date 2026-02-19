import { ConfigService } from '@nestjs/config';

export interface DatabaseConfig {
  type: 'postgres';
  host: string;
  port: number;
  username: string | undefined;
  password: string | undefined;
  database: string | undefined;
}

/** Shared DB connection config used by both the NestJS app and TypeORM CLI. */
export function getDatabaseConfig(env: Record<string, string | undefined>): DatabaseConfig {
  return {
    type: 'postgres',
    host: env.DB_HOST ?? 'localhost',
    port: Number(env.DB_PORT ?? 5432),
    username: env.DB_USERNAME,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
  };
}

/** Factory for TypeOrmModule.forRootAsync in app.module.ts */
export function typeOrmConfigFactory(config: ConfigService) {
  return {
    ...getDatabaseConfig({
      DB_HOST: config.get<string>('DB_HOST'),
      DB_PORT: config.get<string>('DB_PORT'),
      DB_USERNAME: config.get<string>('DB_USERNAME'),
      DB_PASSWORD: config.get<string>('DB_PASSWORD'),
      DB_NAME: config.get<string>('DB_NAME'),
    }),
    autoLoadEntities: true,
    synchronize: false,
    migrationsRun: true,
    migrations: ['dist/migrations/*.js'],
  };
}
