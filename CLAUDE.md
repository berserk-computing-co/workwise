# CLAUDE.md

## Commands

```bash
# Development (run both + infrastructure)
docker compose up db redis -d   # Start Postgres + Redis
npm run dev:web                 # Next.js frontend (localhost:4000)
npm run dev:api                 # NestJS backend (watch mode)

# Build
npm run build                   # Both apps
npm run build:web               # Next.js standalone build
npm run build:api               # NestJS compile to dist/

# Quality
npm run lint                    # ESLint both apps
npm run test                    # Jest (API only, no web tests yet)
nx check-types web              # Frontend type check
nx check-types api              # Backend type check

# Database (TypeORM)
nx migration:run api                              # Run pending migrations
nx migration:revert api                           # Revert last migration
nx migration:generate api --args="--name=AddFoo"  # Generate new migration

# Docker (full stack)
docker compose up               # All services: web + api + db + redis
docker compose up --build       # Rebuild images first
```

## Architecture

Nx monorepo, two apps:

- `apps/web/` — Next.js 14 frontend (port 4000). Auth0, Tailwind + Flowbite, App Router.
- `apps/api/` — NestJS 11 backend. TypeORM + Postgres, BullMQ + Redis, Anthropic AI.

The frontend proxies all API calls through `app/api/proxy/[...path]/route.ts` to inject Auth0 tokens server-side. Browser never calls the NestJS API directly.

### API modules

| Module | What it does |
|--------|-------------|
| `auth/` | Dual Auth0 + Stytch JWT strategies, global `Auth0AuthGuard` |
| `users/` | User + Organization CRUD |
| `projects/` | Projects, Sections, Items, Options CRUD (soft-delete) |
| `pipelines/bidengine/` | AI bid generation — BullMQ processor, 6-step pipeline |
| `ai/` | Provider-agnostic `AgentRunner` + `AnthropicProvider` |
| `datasources/onebuild/` | 1Build material pricing GraphQL client |
| `pipeline/` | Generic pipeline runner, job tracking, SSE progress |

### Web routes

| Route | What it does |
|-------|-------------|
| `/` | Conversation-style project creation (BidGenerator) |
| `/projects` | Project list with status filters + pagination |
| `/projects/[id]` | Project detail — inline editing, sections/items, generation |
| `/onboarding` | First-time user/org setup |

### BidEngine pipeline

6 steps: scope decomposition → [1Build pricing + web pricing] (parallel) → price merge → option generation → calculation. Runs as a BullMQ job with SSE progress streaming via `/jobs/:jobId/progress`.

## Code Conventions

- **ESM imports** — Always use `.js` extension on relative imports in the API
- **Env files** — `.env` committed with placeholders, `.env.local` gitignored with secrets. `ConfigModule` loads `.env.local` first.
- **Auth** — `@Public()` decorator skips the global auth guard. `@CurrentUser()` extracts JWT payload.
- **AI model** — All pipeline steps and agents use `claude-haiku-4-5-20251001` to minimize costs during iteration. TODO: upgrade to Sonnet once token counts are optimized.
- **Agent two-phase pattern** — When an agent has both tools and `outputFormat`, Phase 1 runs tools freely (no schema), Phase 2 formats output (no tools). Prevents the model from skipping tool use.
- **Frontend state** — React Context + hooks only, no external state library. `useReducer` for multi-step flows.
- **API proxy** — Client components call `/api/proxy/...`, never the NestJS API directly.
- **Project statuses** — `draft` → `generating` → `generated` → `review`. Generation sets status via the pipeline, not PATCH.

## Environment Variables

### API (`apps/api/.env.local`)

`DB_USERNAME`, `DB_PASSWORD`, `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `ONEBUILD_API_KEY`, `STYTCH_SECRET`

### Web (`apps/web/.env.local`)

`AUTH0_SECRET`, `AUTH0_ISSUER_BASE_URL`, `AUTH0_CLIENT_ID`, `AUTH0_CLIENT_SECRET`, `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
