# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Structure

This is an **Nx monorepo** with two applications:

```
workwise_bff/
├── apps/
│   ├── web/    # Next.js 14 BFF frontend (port 4000)
│   └── api/    # NestJS API (port 3000)
├── package.json
├── nx.json
└── tsconfig.base.json
```

## Commands

```bash
# Development
npm run dev:web      # Start Next.js frontend on http://localhost:4000
npm run dev:api      # Start NestJS API on http://localhost:3000

# Build
npm run build        # Build both apps
npm run build:web    # Build Next.js only
npm run build:api    # Build NestJS only

# Lint & Test
npm run lint         # Lint both apps
npm run test         # Test both apps

# TypeORM Migrations (run from repo root)
nx run api:migration:run                         # Apply pending migrations
nx run api:migration:revert                      # Revert last migration
nx run api:migration:generate --args="--name=MigrationName"  # Generate migration
```

## Architecture

```
Browser → Next.js BFF (apps/web, port 4000)
             ├── /api/bids/*        → AI-powered bid operations
             ├── /api/contractors/* → Proxies to Rails API (port 5000)
             └── /api/onebuild/*   → 1Build GraphQL (material pricing)
                      ↓
         NestJS API (apps/api, port 3000)
             ├── PostgreSQL via TypeORM
             └── Stytch JWT auth (global guard)
```

## apps/web (Next.js 14 BFF)

### Route Groups

- **`app/(site)/`** — Pages with shared navbar/footer: home (`BidGenerator`), bid list, bid detail, bid create (multi-step), login, join.
- **`app/widget/`** — Embeddable iframe bid generator. CSP is `frame-ancestors *`.
- **`app/api/`** — API routes.

### AI Bid Generation Pipeline (`/api/bids/generate`)

Core feature with `maxDuration = 300` (Vercel). Single `POST` triggers:

1. **Materials agent** (`app/lib/openai/materials_agent.ts`) — `gpt-4o` tool-calling loop (up to 15 iterations) querying 1Build GraphQL for real material prices.
2. **Project name** — `gpt-4o-mini` generates a short name.
3. **Document spec** (`app/lib/openai/bids.ts:generateBidDocumentSpec`) — `gpt-4` returns structured JSON for PDF sections.
4. **PDF rendering** (`app/lib/pdf/bid_pdf.tsx`) — `@react-pdf/renderer` renders to a buffer.
5. **Email delivery** (`app/lib/email/resend.ts`) — Resend sends the PDF; non-fatal on failure.
6. **Stytch user creation** — Fire-and-forget, non-blocking.

### Other API Routes

- `POST /api/bids/analyze` — GPT-4 price anomaly detection.
- `POST /api/bids/email` — GPT-4 client-facing email draft.
- `POST /api/bids/pdf` — PDF generation for existing bid.
- `POST /api/contractors/apply` — Validates then proxies to Rails `POST /contractors`.
- `GET /api/onebuild/` — 1Build GraphQL proxy (`?material=` query param).

### Authentication (web)

**Stytch** is the auth provider. `app/lib/auth/stytch_client.ts` exports the server-side client. Legacy NextAuth config at `app/api/auth/[...nextauth]/` is still required.

Public routes (bid generator at `/`, `/widget`) require no auth. Protected `/(site)/` pages use Stytch session tokens when proxying to Rails.

### Type System (`app/types/`)

- `api/interfaces.ts` — API request/response contracts (`BidRequest`, `EstimateAttributes`, etc.)
- `bids.ts` — Frontend `Bid` interface + converter functions (`toBidRequest()`, `toBid()`, `toUpdateBidRequest()`)
- Type guards: `isBid()`, `isClient()`, `isAddress()`, `isUserType()`
- All API responses are snake_case; frontend uses camelCase. `decamelize-keys` converts requests to snake_case for Rails.

### 1Build Integration

`app/api/onebuild/one_build_client.ts` — GraphQL client with full `Uom` enum and `uomToOneBuildUomMap` bidirectional mapping. Prices returned in USD cents, converted to dollars before use.

## apps/api (NestJS)

### Architecture

- **Auth**: `StytchAuthGuard` applied globally via `APP_GUARD`. Use `@Public()` decorator to opt routes out. Two JWT strategies: `StytchJwtStrategy` (primary) and `Auth0JwtStrategy` (legacy). Both use JWKS-RSA for key rotation.
- **Database**: TypeORM with PostgreSQL. Config in `src/config/database.config.ts` (shared by app and TypeORM CLI). Reads `.env.local` then `.env`. Migrations run automatically on startup.
- **Current modules**: `AuthModule`, `UsersModule`, `EstimatesModule`. Entities are defined but controllers are minimal — this API is still being built out.
- **User injection**: `@CurrentUser()` decorator injects the JWT payload (`Auth0JwtPayload | StytchJwtPayload`).

### Environment Variables (api)

```
PORT=3000
CORS_ORIGIN=http://localhost:4000
DB_HOST / DB_PORT / DB_NAME / DB_USER / DB_PASSWORD
STYTCH_PROJECT_ID / STYTCH_PROJECT_ENV / STYTCH_SECRET
```

## Key Libraries

| Library | Purpose |
|---------|---------|
| `openai` | GPT-4/GPT-4o for bid generation, analysis, email drafting |
| `@react-pdf/renderer` | Server-side PDF rendering |
| `resend` | Transactional email delivery |
| `@stytch/nextjs` + `stytch` | Authentication |
| `typeorm` + `pg` | ORM + PostgreSQL (NestJS API) |
| `flowbite-react` | UI component library |
| `react-hook-form` | Form state management |
| `decamelize-keys` | camelCase → snake_case for Rails API requests |

## Environment Variables (web)

- `OPENAI_API_KEY`
- `ONEBUILD_API_KEY`
- `RESEND_API_KEY`
- `STYTCH_PROJECT_ID`, `STYTCH_SECRET`, `NEXT_PUBLIC_STYTCH_PUBLIC_TOKEN`
- `WORKWISE_URL` — Rails backend URL (default: `http://localhost:5000`)
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
- `NEXTAUTH_SECRET` — Legacy; still required
