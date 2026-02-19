# BidEngine

AI-powered construction estimating tool. Nx monorepo with Next.js frontend and NestJS API.

## Project Structure

```
apps/
  web/    — Next.js frontend (port 4000)
  api/    — NestJS API (port 3000)
```

## Setup

```bash
npm install
```

Copy environment files for each app:

```bash
# apps/web/.env.local  — Auth0, NextAuth, Google Maps keys
# apps/api/.env        — PORT, CORS_ORIGIN, DB connection
# apps/api/.env.local  — DB credentials, Auth0 domain
```

## Development

```bash
nx dev web              # Next.js dev server (localhost:4000)
nx serve api            # NestJS watch mode (localhost:3000)
```

## Build

```bash
nx build web            # Next.js production build
nx build api            # NestJS compile to dist/
nx run-many -t build    # Build everything
```

## Test

```bash
nx test api             # Run API tests
nx run-many -t test     # Test everything
```

## Database (TypeORM)

```bash
nx migration:run api                            # Run pending migrations
nx migration:revert api                         # Revert last migration
nx migration:generate api --args="--name=AddFoo"  # Generate new migration
```

## Docker

```bash
docker compose up               # Start web + api + postgres
docker compose up --build       # Rebuild images first
docker compose up db             # Just the database
```

## Nx Utilities

```bash
nx show projects        # List all projects
nx show project web     # Show web's full config
nx show project api     # Show api's full config
nx graph                # Interactive dependency graph in browser
nx affected -t build    # Build only projects changed in current branch
nx affected -t test     # Test only changed projects
```

## Generators (scaffolding)

```bash
# NestJS
nx g @nx/nest:module estimates --project=api
nx g @nx/nest:service estimates --project=api
nx g @nx/nest:controller estimates --project=api
nx g @nx/nest:resource estimates --project=api    # module + controller + service + DTOs

# Next.js
nx g @nx/next:page about --project=web
nx g @nx/next:component Button --project=web
```
