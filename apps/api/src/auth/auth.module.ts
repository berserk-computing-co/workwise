import { Global, Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Auth0JwtStrategy } from './auth0-jwt.strategy.js';
import { Auth0AuthGuard } from './auth0-auth.guard.js';
import { StytchJwtStrategy } from './stytch-jwt.strategy.js';
import { StytchAuthGuard } from './stytch-auth.guard.js';
import { AuthService } from './auth.service.js';
import { AuthController } from './auth.controller.js';
import { User } from '../users/entities/user.entity.js';
import { Organization } from '../users/entities/organization.entity.js';

@Global()
@Module({
  imports: [PassportModule, TypeOrmModule.forFeature([User, Organization])],
  controllers: [AuthController],
  providers: [
    Auth0JwtStrategy,
    Auth0AuthGuard,
    StytchJwtStrategy,
    StytchAuthGuard,
    AuthService,
  ],
  exports: [Auth0AuthGuard, StytchAuthGuard],
})
export class AuthModule {}
