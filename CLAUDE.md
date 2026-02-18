# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start dev server on http://localhost:4000
npm run build    # Production build
npm run lint     # Run ESLint
```

There is no test runner configured. The app runs on port **4000** (not the Next.js default of 3000).

The Workwise Rails API backend is expected at `http://localhost:5000` (set via `WORKWISE_URL`).

## Architecture

This is a **Next.js 14 BFF (Backend-for-Frontend)** for a construction bidding platform. It uses the App Router and acts as the UI layer and API proxy in front of a Rails backend.

```
Browser → Next.js BFF (port 4000)
             ├── /api/workwise/*    → Rails API (port 5000)
             └── /api/onebuild/*   → 1Build GraphQL (material pricing)
```

### Authentication

Currently mid-migration from **Auth0 + NextAuth** → **Stytch**. The `stytch` branch is the active development branch. The app is wrapped in `StytchProvider` via `app/auth_provider.tsx`. Legacy NextAuth config remains at `app/api/auth/[...nextauth]/`.

- `app/lib/auth/utills.ts` — `getAccessToken()` retrieves the session token for proxying requests to the Rails backend
- Environment vars needed: `STYTCH_PROJECT_ID`, `STYTCH_PUBLIC_TOKEN`, `NEXT_PUBLIC_STYTCH_PUBLIC_TOKEN`, `STYTCH_SECRET`

### API Proxy Layer (`app/api/workwise/`)

All requests to the Rails backend go through Next.js API routes. `app/lib/workwise_api/utils.ts` contains `workwiseFetch()` — the central utility that adds auth headers and converts camelCase → snake_case (via `decamelize-keys`) before forwarding to the backend.

### Multi-step Bid Creation (`app/bids/create/`)

State is shared across form steps using React Context (`CreateBidStepContext`). Steps: DetailsForm → EstimateItemsForm → TimelineForm. Each step reads/writes to context; the final step submits to `POST /api/workwise/bids`.

### 1Build Integration (`app/api/onebuild/`)

GraphQL client for construction material pricing. Contains extensive UOM (unit of measure) enums with bidirectional mapping between Workwise and 1Build naming conventions.

### Type System (`app/types/`)

Domain types are defined here with converter functions (e.g., `toBidRequest()`, `toBid()`) that translate between API snake_case and frontend camelCase representations.

## Key Libraries

| Library | Purpose |
|---------|---------|
| `flowbite-react` | UI component library (Button, Card, Modal, etc.) |
| `react-hook-form` | Form state management |
| `react-google-places-autocomplete` | Address input with Google Maps |
| `@heroicons/react` | Icons |
| `neo4j-driver` | Graph DB client (used via Rails backend) |
| `decamelize-keys` | camelCase → snake_case conversion for API requests |

## Environment Variables

Copy `.env.local` from a team member. Key vars:

- `WORKWISE_URL` — Rails backend URL (default: `http://localhost:5000`)
- `NEXT_PUBLIC_STYTCH_PUBLIC_TOKEN` — Stytch public token (safe for client)
- `STYTCH_SECRET` — Stytch server-side secret
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` — Google Places autocomplete
- `NEXTAUTH_SECRET` — Legacy; still required while NextAuth is present
