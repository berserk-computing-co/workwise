import { Global, Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { Auth0JwtStrategy } from './auth0-jwt.strategy.js';
import { Auth0AuthGuard } from './auth0-auth.guard.js';
import { StytchJwtStrategy } from './stytch-jwt.strategy.js';
import { StytchAuthGuard } from './stytch-auth.guard.js';

@Global()
@Module({
  imports: [PassportModule],
  providers: [
    Auth0JwtStrategy,
    Auth0AuthGuard,
    StytchJwtStrategy,
    StytchAuthGuard,
  ],
  exports: [Auth0AuthGuard, StytchAuthGuard],
})
export class AuthModule {}
