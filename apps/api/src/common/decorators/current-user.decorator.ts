import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import type { Auth0JwtPayload } from '../../auth/auth0-jwt.strategy.js';
import type { StytchJwtPayload } from '../../auth/stytch-jwt.strategy.js';

export type JwtPayload = Auth0JwtPayload | StytchJwtPayload;

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): JwtPayload => {
    const request = ctx.switchToHttp().getRequest<Request>();
    return request.user as JwtPayload;
  },
);
