import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { AuthGuard } from "@nestjs/passport";
import { IS_PUBLIC_KEY } from "../common/decorators/public.decorator.js";

@Injectable()
export class Auth0AuthGuard extends AuthGuard("auth0-jwt") {
  constructor(private reflector: Reflector) {
    super();
  }

  override canActivate(context: ExecutionContext) {
    if (process.env.DEV_SKIP_AUTH === "true") {
      const request = context.switchToHttp().getRequest<{
        headers: Record<string, string | undefined>;
        user?: unknown;
      }>();
      const authHeader = request.headers["authorization"] ?? "";
      const token = authHeader.startsWith("Bearer ")
        ? authHeader.slice(7)
        : null;
      if (token && token === process.env.DEV_JWT_TOKEN) {
        request.user = { sub: "dev|local", email: "dev@local.test" };
        return true;
      }
    }

    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    return super.canActivate(context);
  }

  override handleRequest<T>(err: Error | null, user: T): T {
    if (err || !user) {
      throw new UnauthorizedException("Invalid or missing Auth0 token");
    }

    return user;
  }
}
