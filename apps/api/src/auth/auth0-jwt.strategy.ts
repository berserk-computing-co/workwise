import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { passportJwtSecret } from 'jwks-rsa';
import { ExtractJwt, Strategy } from 'passport-jwt';

export interface Auth0JwtPayload {
  sub: string;
  email?: string;
  iat?: number;
  exp?: number;
  aud?: string | string[];
  iss?: string;
}

@Injectable()
export class Auth0JwtStrategy extends PassportStrategy(Strategy, 'auth0-jwt') {
  private readonly logger = new Logger(Auth0JwtStrategy.name);

  constructor() {
    const domain = process.env.AUTH0_DOMAIN;

    super({
      secretOrKeyProvider: passportJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri: `https://${domain}/.well-known/jwks.json`,
        handleSigningKeyError: (err: Error, cb: (err: Error) => void) => {
          this.logger.error('JWKS signing key error', err.message);
          cb(err);
        },
      }),
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      audience: process.env.AUTH0_AUDIENCE,
      issuer: `https://${domain}/`,
      algorithms: ['RS256'],
    });
  }

  validate(payload: Auth0JwtPayload): Auth0JwtPayload {
    return payload;
  }
}
