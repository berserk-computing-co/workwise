# Phase 4 — Homeowner Portal

**Size:** L
**Depends on:** Phase 3 (ProjectShare token, EmailService.sendResponseNotification)
**Unlocks:** Phase 5 (messaging thread, portal view tracking)

## Core User Story

Homeowner clicks the link in the estimate email → lands on a polished, mobile-first page showing the full estimate → can tap Accept or Reject → contractor is notified immediately.

No WorkWise account required. No WorkWise branding visible to the homeowner.

---

## Auth / Routing Approach

The homeowner portal is **public** — no Auth0 session. The Next.js proxy route (`/api/proxy/`) calls `getAccessToken()` which throws without an Auth0 session, so portal pages must call NestJS **directly** at `NEXT_PUBLIC_API_URL`.

### `apps/web/middleware.ts`

Update the Auth0 middleware matcher to **exclude** `/bid/*`:

```typescript
export const config = {
  matcher: ['/((?!bid|_next/static|_next/image|favicon.ico).*)'],
};
```

---

## New Public API Module: `apps/api/src/share/`

All endpoints are decorated `@Public()` (skip the global `Auth0AuthGuard`).

```
apps/api/src/share/
  share.module.ts
  share.controller.ts
  share.service.ts
```

### `GET /share/:token`

Returns a safe, read-only project payload. Excludes: `organizationId`, internal metadata, cost data beyond display totals.

Response shape:
```json
{
  "contractor": {
    "name": "Smith Contracting",
    "logoUrl": "https://...",
    "phone": "555-0100",
    "website": "smithcontracting.com",
    "licenseNumber": "CA-123456"
  },
  "project": {
    "id": "...",
    "address": "123 Main St",
    "description": "Kitchen remodel",
    "status": "sent"
  },
  "sections": [ ... ],
  "options": [ ... ],
  "share": {
    "response": null,
    "respondedAt": null
  }
}
```

### `POST /share/:token/view`

Idempotent. Sets `share.viewedAt = now()` if currently null.
Returns `204 No Content`.

### `POST /share/:token/respond`

Body: `{ response: 'accepted' | 'rejected', note?: string }`

Guards:
- `share.response` must be null → `409 { error: 'already_responded' }`

Steps:
1. Set `share.respondedAt = now()`, `share.response`, `share.responseNote`
2. Update `project.status` → `'accepted'` or `'rejected'`
3. Call `EmailService.sendResponseNotification(project, org, share)` — notifies contractor
4. Return `{ success: true }`

---

## New Next.js Route: `apps/web/app/bid/[token]/`

```
apps/web/app/bid/[token]/
  page.tsx                         # Server Component — fetches GET /share/:token
  _components/
    portal-header.tsx              # Contractor logo, name, license, phone
    estimate-summary.tsx           # Address, description, total range
    section-breakdown.tsx          # Collapsible sections + items (read-only)
    option-selector.tsx            # Good/Better/Best radio cards (Client Component)
    response-panel.tsx             # Accept/Reject + optional note (Client Component)
    responded-confirmation.tsx     # Thank-you screen after submission
```

### `page.tsx` (Server Component)

Fetch `GET ${process.env.NEXT_PUBLIC_API_URL}/share/${token}` at render time. If 404, render a "This estimate is no longer available" page. Pass data down to child components.

### `portal-header.tsx`

Contractor logo (or name as text fallback), license number, phone number.
**No WorkWise logo, no WorkWise navigation.**

### `estimate-summary.tsx`

Project address, description, date sent. Total price range (lowest option → highest option).

### `section-breakdown.tsx`

Collapsible accordion per section. Each section shows items as a table: description, qty, unit cost, extended cost. Read-only — no editing UI.

### `option-selector.tsx` (Client Component)

Good / Better / Best radio cards. Each card shows:
- Option name
- Short description
- Total price

Selection is local state only — informs the response panel which option the homeowner is leaning toward (can be included in `note`).

### `response-panel.tsx` (Client Component)

Accept / Reject buttons. Optional textarea for a note (e.g. "Going with the Better option"). On submit: `POST NEXT_PUBLIC_API_URL/share/:token/respond`. On success: render `<RespondedConfirmation>`.

### `responded-confirmation.tsx`

"Thank you! We've notified [Contractor Name] of your response."
Shows a summary: their response (Accepted / Declined), their note if any.

---

## Design Guidelines

- **Mobile-first** — designed for a phone screen, scales up gracefully
- **Contractor-branded** — only contractor logo/colors, no WorkWise branding
- **No navigation** — single-purpose page, no links out
- Tailwind + Flowbite (same as the rest of `apps/web`) but minimal/clean layout

---

## Acceptance Criteria

- [ ] `/bid/[token]` loads without Auth0 session; returns 404 for invalid tokens
- [ ] Page calls NestJS directly (not via `/api/proxy/`) — confirm in network tab
- [ ] `POST /share/:token/view` is called on page load; `viewedAt` is set in DB
- [ ] Auth0 middleware does not redirect `/bid/*` routes
- [ ] Homeowner can Accept or Reject; response is saved to DB
- [ ] Attempting to respond twice returns `409`
- [ ] Project status updates to `'accepted'` or `'rejected'` after response
- [ ] Contractor receives notification email when homeowner responds
- [ ] No WorkWise branding visible anywhere on the portal page
