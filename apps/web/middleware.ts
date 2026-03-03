import { withMiddlewareAuthRequired } from "@auth0/nextjs-auth0/edge";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const authMiddleware = withMiddlewareAuthRequired();

export default function middleware(req: NextRequest, event: unknown) {
  if (process.env.DEV_SKIP_AUTH === "true") return NextResponse.next();
  return authMiddleware(req, event as Parameters<typeof authMiddleware>[1]);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - / (home page)
     * - /widget (public embed)
     * - /api/auth/* (Auth0 handlers)
     * - /_next/static (static files)
     * - /_next/image (image optimization)
     * - /favicon.ico, /workwise.png (public assets)
     */
    "/((?!$|widget|api/auth|_next/static|_next/image|favicon\\.ico|workwise\\.png).*)",
  ],
};
