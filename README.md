# BidEngine

AI-powered construction estimating platform. Contractors describe a project and the system generates itemized bids with pricing from multiple sources (1Build material database, web pricing research).

Nx monorepo: Next.js 14 frontend + NestJS 11 API.

## Project Structure

```
apps/
  web/    — Next.js 14 frontend (port 4000)
  api/    — NestJS 11 API backend
```

## Prerequisites

- Node.js 22+
- PostgreSQL 16 (or use Docker)
- Redis 7 (or use Docker)

## Setup

```bash
npm install
```

Each app needs a `.env.local` with secrets (gitignored). Committed `.env` files have placeholders — copy and fill in real values:

```bash
cp apps/api/.env apps/api/.env.local    # then fill in DB creds, API keys
cp apps/web/.env apps/web/.env.local    # then fill in Auth0 + Google Maps keys
```

Start infrastructure and run migrations:

```bash
docker compose up db redis -d
nx migration:run api
```

## Development

```bash
npm run dev:web          # Next.js dev server (localhost:4000)
npm run dev:api          # NestJS watch mode
```

Both services must be running. The frontend proxies API calls through Next.js to inject auth tokens.

## Build

```bash
npm run build            # Build everything
npm run build:web        # Next.js standalone build
npm run build:api        # NestJS compile to dist/
```

## Test & Lint

```bash
npm run test             # Jest (API tests)
npm run lint             # ESLint both apps
nx check-types web       # Frontend type check
nx check-types api       # Backend type check
```

## Database (TypeORM)

```bash
nx migration:run api                              # Run pending migrations
nx migration:revert api                           # Revert last migration
nx migration:generate api --args="--name=AddFoo"  # Generate new migration
```

## Docker

```bash
docker compose up               # All services: web + api + db + redis
docker compose up --build       # Rebuild images first
docker compose up db redis      # Just infrastructure
```

## Nx Utilities

```bash
nx show projects                # List all projects
nx show project web             # Show web config
nx show project api             # Show api config
nx graph                        # Interactive dependency graph
nx affected -t build            # Build only changed projects
nx affected -t test             # Test only changed projects
```

## Generators (scaffolding)

```bash
# NestJS
nx g @nx/nest:resource estimates --project=api    # module + controller + service + DTOs
nx g @nx/nest:module estimates --project=api
nx g @nx/nest:service estimates --project=api
nx g @nx/nest:controller estimates --project=api

# Next.js
nx g @nx/next:page about --project=web
nx g @nx/next:component Button --project=web
```
