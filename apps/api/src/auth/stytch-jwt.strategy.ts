import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { passportJwtSecret } from 'jwks-rsa';
import { ExtractJwt, Strategy } from 'passport-jwt';

export interface StytchJwtPayload {
  sub: string;
  iss: string;
  aud: string[];
  exp: number;
  iat: number;
  nbf: number;
  'https://stytch.com/session'?: {
    id: string;
    started_at: string;
    last_accessed_at: string;
    expires_at: string;
    attributes: Record<string, unknown>;
    authentication_factors: Array<{
      type: string;
      delivery_method: string;
      last_authenticated_at: string;
    }>;
  };
}

@Injectable()
export class StytchJwtStrategy extends PassportStrategy(Strategy, 'stytch-jwt') {
  private readonly logger = new Logger(StytchJwtStrategy.name);

  constructor() {
    const projectId = process.env.STYTCH_PROJECT_ID;
    const env = process.env.STYTCH_PROJECT_ENV ?? 'test';
    const baseUrl = env === 'live'
      ? 'https://stytch.com'
      : 'https://test.stytch.com';

    super({
      secretOrKeyProvider: passportJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri: `${baseUrl}/v1/sessions/jwks/${projectId}`,
        handleSigningKeyError: (err: Error, cb: (err: Error) => void) => {
          this.logger.error('Stytch JWKS signing key error', err.message);
          cb(err);
        },
      }),
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      issuer: `stytch.com/${projectId}`,
      algorithms: ['RS256'],
    });
  }

  validate(payload: StytchJwtPayload): StytchJwtPayload {
    return payload;
  }
}
