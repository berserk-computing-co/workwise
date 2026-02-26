import { withMiddlewareAuthRequired } from "@auth0/nextjs-auth0/edge";

export default withMiddlewareAuthRequired();

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
