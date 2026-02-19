# M3: Stytch Auth

## Overview
Migrated authentication from the Auth0 + NextAuth stack to Stytch, enabling magic link and OAuth sign-in flows. The app is mid-migration — Stytch is wired in but legacy NextAuth config remains while the transition completes.

## Goals
- Replace Auth0/NextAuth with Stytch for simpler, passwordless auth
- Support magic link (email OTP) and OAuth providers via Stytch
- Gate API proxy requests with Stytch session tokens

## Deliverables
- [x] Wrap app in `StytchProvider` (`app/auth_provider.tsx`)
- [x] Add `app/lib/auth/` utilities including `getAccessToken()` for session token retrieval
- [x] Configure Stytch env vars (`STYTCH_PROJECT_ID`, `STYTCH_PUBLIC_TOKEN`, `STYTCH_SECRET`)
- [x] Implement login page with Stytch UI components
- [ ] Remove legacy NextAuth config (`app/api/auth/[...nextauth]/`)
- [ ] Fully deprecate `NEXTAUTH_SECRET` env var

## Notes
- Commit `f2aa60b` ("Start working on stytch") begins the migration
- Both `NEXT_PUBLIC_STYTCH_PUBLIC_TOKEN` (client-safe) and `STYTCH_SECRET` (server-only) are required
- Legacy NextAuth config is intentionally left in place during the transition to avoid breaking existing sessions
- The active development branch for auth work was `stytch`; this is now merged into the main feature branches
