import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_GUARD } from '@nestjs/core';
import { AuthModule } from './auth/auth.module.js';
import { StytchAuthGuard } from './auth/stytch-auth.guard.js';
import { UsersModule } from './users/users.module.js';
import { EstimatesModule } from './estimates/estimates.module.js';
import { typeOrmConfigFactory } from './config/database.config.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: typeOrmConfigFactory,
    }),
    AuthModule,
    UsersModule,
    EstimatesModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useExisting: StytchAuthGuard,
    },
  ],
})
export class AppModule {}
