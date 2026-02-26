# Frontend Rebuild — Mycel Execution Prompt

Use this with: `/mycel plan ~/projects/workwise/FRONTEND_PLAN.md`

---

## Context

The `apps/web/` Next.js 14 frontend is a legacy BFF with its own OpenAI pipeline, broken pages, and Stytch auth. It does NOT connect to the NestJS `apps/api/` backend at all. This plan rebuilds it as a thin client that drives the NestJS API.

### Backend API Surface (25 endpoints at `http://localhost:3000`)

**Auth:**
- `POST /auth/setup` — create user + org (idempotent). Body: `{ user: { firstName, lastName, email }, organization: { name, zipCode } }`. Returns `{ user, organization }`.

**User/Org:**
- `GET /users/me` — current user profile
- `PATCH /users/me` — update name
- `GET /organizations/me` — current org
- `PATCH /organizations/me` — update org name/zip

**Projects (org-scoped, soft-delete):**
- `GET /projects` — paginated list. Query: `?status=&page=&limit=`. Returns `{ data: Project[], meta: { total, page, limit, pages } }`
- `POST /projects` — create draft. Body: `{ description, address, zipCode, category?, clientName? }`. Returns Project.
- `GET /projects/:id` — full project with sections → items + options
- `PATCH /projects/:id` — update fields + status transitions (draft→generating blocked, must use /generate)
- `DELETE /projects/:id` — soft delete (204)
- `POST /projects/:id/duplicate` — clone as draft (201)
- `POST /projects/:id/recalculate` — recompute totals
- `POST /projects/:id/sections` — add section. Body: `{ name }`
- `PATCH /projects/:id/sections/:sectionId` — update section
- `DELETE /projects/:id/sections/:sectionId` — delete (items reassigned to "Other")
- `GET /projects/:id/options` — list options (good/better/best tiers)
- `PATCH /projects/:id/options/:optionId` — update option
- `POST /projects/:projectId/items` — add item. Body: `{ sectionId, description, quantity, unit, unitCost }`
- `PATCH /projects/:projectId/items/:itemId` — update item
- `DELETE /projects/:projectId/items/:itemId` — delete item (204)
- `POST /projects/:projectId/items/reorder` — reorder items. Body: `{ sectionId, itemIds[] }`

**AI Pipeline:**
- `POST /projects/:id/generate` — trigger BidEngine (202). Returns `{ jobId }`. Sets status to `generating`.
- `GET /jobs/:jobId/progress` — **PUBLIC** SSE stream. Events: `progress`, `error`, `complete`. Data: `{ step, status, message, total? }`

**Pricing:**
- `GET /pricing/lookup?description=&zip=&unit=` — single item price lookup
- `POST /pricing/batch-lookup` — batch price lookup

**Auth header:** `Authorization: Bearer <auth0_access_token>`
**Errors:** 422 = `{ message: [{ field, message }] }`, 401/403/404 = `{ statusCode, error, message }`

---

## Milestone 1: Auth0 + Onboarding

### 1A. Remove Stytch, install Auth0

**What to remove:**
- `app/auth_provider.tsx` — StytchProvider wrapper
- `app/lib/auth/stytch_client.ts` — server Stytch SDK
- `app/(site)/login/login.tsx` — StytchLogin component
- `app/(site)/login/page.tsx` — login page
- All `@stytch/*` and `stytch` dependencies from package.json
- All `next-auth` usage (SessionProvider in `bids/layout.tsx`, `workwise_navbar.tsx`)
- `next-auth` dependency
- `STYTCH_*`, `NEXTAUTH_*`, `AUTH0_*` env vars from `.env.local`
- `app/types/next-auth.d.ts` type augmentation

**What to install:**
- `@auth0/nextjs-auth0` — the official Auth0 Next.js SDK (App Router compatible)

**What to create:**
- `app/api/auth/[auth0]/route.ts` — the Auth0 dynamic catch-all handler (handles login, logout, callback, me). Use `handleAuth()` from `@auth0/nextjs-auth0`.
- `app/auth0-provider.tsx` — client component wrapping `<UserProvider>` from `@auth0/nextjs-auth0/client`
- `app/layout.tsx` — replace StytchProvider with Auth0 UserProvider
- `middleware.ts` — Auth0 middleware for session management. Use `withMiddlewareAuthRequired` for protected routes. Public routes: `/`, `/widget`, `/api/auth/*`
- `.env.local` entries:
  - `AUTH0_SECRET` — random 32-byte secret for cookie encryption
  - `AUTH0_BASE_URL=http://localhost:4000`
  - `AUTH0_ISSUER_BASE_URL=https://<tenant>.auth0.com`
  - `AUTH0_CLIENT_ID`
  - `AUTH0_CLIENT_SECRET`
  - `AUTH0_AUDIENCE` — the API audience identifier (matches NestJS backend)
  - `NEXT_PUBLIC_API_URL=http://localhost:3000` — NestJS API base URL

**Auth0 tenant config required (document, don't implement):**
- Application type: Regular Web Application
- Allowed Callback URLs: `http://localhost:4000/api/auth/callback`
- Allowed Logout URLs: `http://localhost:4000`
- Connections: Email (passwordless magic link) + Google OAuth
- API: Create API with identifier matching `AUTH0_AUDIENCE`, RS256

### 1B. API client utility

**New file:** `app/lib/api/client.ts`

A thin fetch wrapper for calling the NestJS API:
```typescript
async function apiClient<T>(path: string, options?: RequestInit): Promise<T>
```
- Prepends `NEXT_PUBLIC_API_URL` to the path
- Gets the Auth0 access token via `getAccessToken()` from `@auth0/nextjs-auth0` (for server components/route handlers) or passes it from the client via a header proxy
- Sets `Authorization: Bearer <token>` and `Content-Type: application/json`
- Handles error responses: 401 → redirect to login, 422 → parse field errors, others → throw with message
- For client-side usage, create a Next.js API proxy route `app/api/proxy/[...path]/route.ts` that forwards requests to the NestJS API with the Auth0 token attached. This avoids exposing the API URL to the browser and handles token injection server-side.

### 1C. Onboarding flow

After first Auth0 login, the user needs to set up their profile and org. The backend's `POST /auth/setup` is idempotent — call it on every login and check the response.

**New route:** `app/(site)/onboarding/page.tsx`

A 2-step form (modern, clean, centered card layout):
1. **Your info** — first name, last name, email (pre-filled from Auth0 profile, editable)
2. **Your company** — company name, ZIP code

On submit: `POST /auth/setup` with the combined payload. On success: redirect to `/projects`.

**Flow logic in middleware or layout:**
- After Auth0 login, check if user has completed setup by calling `GET /users/me`
- If 404 or error → redirect to `/onboarding`
- If success → allow through to app

### 1D. Update navbar

Replace `workwise_navbar.tsx`:
- Use Auth0's `useUser()` hook instead of Stytch session
- Show user avatar/name from Auth0 profile
- Dropdown: Dashboard, Settings, Sign Out (`/api/auth/logout`)
- Keep ThemeToggle
- Keep "Join as contractor" link (legacy but functional)

---

## Milestone 2: Projects Dashboard

### 2A. Projects list page

**Route:** `app/(site)/projects/page.tsx`

Modern card-grid layout showing all projects for the org.

- Fetch `GET /projects` on load (server component or SWR/React Query)
- Each project card shows: description (truncated), address, status badge (color-coded), total, created date
- Status badges: `draft` (gray), `generating` (amber pulse), `review` (blue), `sent` (purple), `accepted` (green), `rejected` (red)
- Empty state: illustrated prompt to create first project
- Floating action button or prominent "New Project" button → navigates to `/projects/new`
- Pagination at bottom (use `meta.pages`)
- Status filter tabs across top

### 2B. Project detail page

**Route:** `app/(site)/projects/[id]/page.tsx`

Full project view with editable sections/items:

- Header: project description (editable inline), address, status, total, action buttons (Generate, Duplicate, Delete)
- Sections: collapsible accordion. Each section shows name (editable), subtotal, item count
- Items table per section: description, qty, unit, unit cost, extended cost, source badge, actions (edit, delete)
- Inline item editing (click to edit, blur to save via `PATCH /projects/:projectId/items/:itemId`)
- Add item button per section → slide-over or modal form
- Drag-to-reorder items within sections (calls `POST /projects/:projectId/items/reorder`)
- Options panel (right sidebar or bottom): good/better/best cards showing totals
- Generate button: calls `POST /projects/:id/generate`, opens SSE progress overlay

### 2C. SSE progress overlay

When generation starts:
- Modal or full-screen overlay with step-by-step progress
- Connect to `GET /jobs/:jobId/progress` via EventSource
- Show each step: scope_decomposition → price_resolution / web_price_resolution (parallel) → price_merge → option_generation → calculation
- Animated progress indicators per step (spinner → checkmark → error icon)
- On `complete` event: close overlay, refresh project data, show success toast
- On `error` event: show error message, allow retry

---

## Milestone 3: Conversational Project Creation

### 3A. The "New Project" flow

**Route:** `app/(site)/projects/new/page.tsx`

This is the centerpiece UX — a **structured conversational interface** inspired by LLM chatbots but purpose-built for construction project intake. NOT a free-form chat. Think: a vertical flow of progressive disclosure cards, each building on the previous.

**Layout:** Full-width centered column (max-w-2xl), bottom-anchored input area, cards stack upward as the flow progresses. Light background, cards have subtle shadows. Mobile-first.

**Flow steps (each renders as a "message card" in the conversation):**

**Step 1: Address**
- Bot card: "Where's the project?" with a brief subtitle
- Input: Google Places autocomplete (full-width, prominent). Reuse `react-google-places-autocomplete`.
- On selection: address card locks in, shows formatted address + map thumbnail (Google Static Maps API), auto-extracts ZIP code. Animates the next step in.

**Step 2: Project description**
- Bot card: "What work needs to be done?" with examples based on common categories
- Input: Large textarea (auto-growing, 3-6 lines) with placeholder like "Describe the project — what rooms, what kind of work, any specific materials or requirements..."
- Category chips below textarea: Plumbing, Electrical, Kitchen, Bathroom, Roofing, General — selecting one pre-fills or adjusts the placeholder. Category is optional guidance, not required.
- Submit button: "Create Project" (or press Cmd+Enter)

**Step 3: Client info (optional, collapsible)**
- Bot card: "Who's the client?" — skippable
- Input: client name field
- "Skip" link to proceed without

**Step 4: Confirmation + Generate**
- Summary card showing: address, description, category, client name
- Two buttons: "Save as Draft" (creates project, goes to detail page) and "Generate Estimate" (creates project + immediately triggers generation, goes to detail page with SSE overlay)
- "Save as Draft" → `POST /projects` → redirect to `/projects/:id`
- "Generate Estimate" → `POST /projects` → `POST /projects/:id/generate` → redirect to `/projects/:id` with `?generating=jobId` query param to auto-open SSE overlay

**Future (document but don't implement):**
- Step 2.5: Image upload — "Got photos?" card with drag-and-drop zone for project photos. Images sent to the API for vision-based scope enhancement. The backend doesn't support this yet.
- AI-assisted description refinement — after typing description, show an "Enhance with AI" button that calls an endpoint to expand/clarify the scope

**Technical implementation:**
- Client component with `useReducer` for flow state
- Each step is a component that renders conditionally based on state
- Smooth scroll-into-view animations as steps appear
- Form validation per step (address required, description required + min 20 chars)
- All state is local until the final "Create" / "Generate" action
- Use the API proxy route for all API calls

### 3B. Quick generate widget

Keep the existing `/widget` page functional but rewire it:
- Instead of calling the OpenAI pipeline directly, it should:
  1. Create a guest/anonymous project somehow (future — needs backend support for anonymous projects)
  2. OR redirect to Auth0 login → onboarding → project creation flow
- For now, keep the existing OpenAI-based widget as-is (it's a separate consumer-facing product). Document that it will be migrated later.

---

## Milestone 4: Cleanup + Polish

### 4A. Remove dead code
- Delete `app/api/workwise/` if it exists (dead Rails proxy routes)
- Delete `app/api/bids/analyze/route.ts`, `app/api/bids/email/route.ts` (dead endpoints)
- Delete `app/lib/openai/` (replaced by NestJS backend pipeline)
- Delete `app/(site)/bids/` entirely (replaced by `/projects/`)
- Delete `app/types/next-auth.d.ts`
- Delete commented-out type directories (`contractor/`, `equipment/`, `files.ts`, `modal/`, `navigation/`, `users/`)
- Clean up barrel exports in `app/types/index.ts`

### 4B. Update types
- Create `app/types/api.ts` — TypeScript interfaces matching the NestJS API response shapes (Project, Section, Item, Option, User, Organization, PipelineJob, PaginatedResponse, etc.)
- These should be manually defined to match the API contracts above, NOT shared from the monorepo (the frontend is a separate deployment target)

### 4C. Environment cleanup
- Remove all STYTCH_*, NEXTAUTH_*, old AUTH0_* vars
- Add Auth0 vars, NEXT_PUBLIC_API_URL
- Update `.env` (committed) with placeholder values
- Update `.env.local` (gitignored) with real values

### 4D. Styling refresh
- Ensure dark mode works throughout all new pages
- Consistent color palette: use Tailwind's slate for surfaces, blue for primary actions, amber for generating states
- Loading skeletons for all data-fetching pages
- Toast notifications for success/error (use a lightweight toast library or build with Tailwind)
- Mobile responsive on all pages

---

## Implementation Order

```
Milestone 1A → 1B → 1C → 1D    (auth foundation)
Milestone 4A → 4B → 4C          (cleanup, can parallel with 1)
Milestone 2A → 2B → 2C          (dashboard, depends on 1+4B)
Milestone 3A                     (creation flow, depends on 2)
Milestone 4D                     (polish, last)
```

Estimated scope: ~25 tasks across 4 milestones. Standard tier — most files are new, moderate risk on auth migration and API proxy.

---

## Key Conventions

- ESM imports with `.js` extension on relative paths (monorepo convention)
- `"use client"` directive on all interactive components
- Server components for data fetching where possible (projects list, project detail initial load)
- API calls go through the proxy route (`/api/proxy/[...path]`) from client components
- Server components use `apiClient()` directly with `getAccessToken()`
- Tailwind + flowbite-react for UI components
- react-hook-form for all forms
- No OpenAI/Anthropic SDK on the frontend — all AI goes through the NestJS API
- Auth0 handles all authentication — no custom auth logic
- Port 4000 (configured in next.config)

## Auth0 Guard Note

The NestJS backend has `Auth0AuthGuard` wired as the global `APP_GUARD`. It currently verifies JWTs via a JWKS endpoint. When switching the frontend to Auth0, the backend's guard configuration may need to be updated to point to Auth0's JWKS URL (`https://<tenant>.auth0.com/.well-known/jwks.json`) and validate the Auth0 audience. Check `apps/api/src/auth/auth0-jwt.strategy.ts` and `apps/api/src/auth/auth0-auth.guard.ts` — they may already be configured for Auth0 (the guard is named `auth0-jwt`). If so, just ensure the env vars match between frontend and backend Auth0 configs.
