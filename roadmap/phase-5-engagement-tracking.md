# Phase 5 — Engagement Tracking

**Size:** L
**Depends on:** Phase 3 (resendEmailId on ProjectShare), Phase 4 (portal, ProjectShare.viewedAt)
**Unlocks:** nothing — this completes the loop

## Why Last

Engagement tracking adds visibility on top of the delivery + portal flow. It depends on Resend email IDs from Phase 3 for webhook correlation, and on the portal infrastructure from Phase 4 for message threads. Neither can be built before those foundations exist.

---

## New Entities

### `EmailEvent`

`apps/api/src/email/entities/email-event.entity.ts`

| Column | Type | Notes |
|--------|------|-------|
| `id` | `UUID` | |
| `projectId` | `UUID` | FK to Project |
| `resendEmailId` | `string` | Correlates with `ProjectShare.resendEmailId` |
| `event` | `enum` | `sent \| delivered \| opened \| clicked \| bounced` |
| `payload` | `JSONB` | Raw Resend webhook body |
| `occurredAt` | `Date` | From Resend webhook `created_at` |

### `PortalMessage`

`apps/api/src/share/entities/portal-message.entity.ts`

| Column | Type | Notes |
|--------|------|-------|
| `id` | `UUID` | |
| `projectId` | `UUID` | FK to Project |
| `sender` | `enum` | `contractor \| homeowner` |
| `body` | `string` | Message text |
| `createdAt` | `Date` | Auto-set |

Also: add `resendEmailId: string | null` to `ProjectShare` if not already present (was in Phase 3).

```bash
nx migration:generate api --args="--name=EmailEventsAndPortalMessages"
nx migration:run api
```

---

## New API Endpoints

### `POST /webhooks/resend` — `@Public()`

Resend delivery webhook receiver.

1. Validate HMAC-SHA256 signature (Resend signing secret from env) → `401` if invalid
2. Parse event type + `data.email_id`
3. Write `EmailEvent` row
4. If event = `opened`: find `ProjectShare` by `resendEmailId`, set `viewedAt = now()` if null
5. Return `200`

Configure in Resend dashboard: `https://api.workwise.com/webhooks/resend`
Events to subscribe: `email.sent`, `email.delivered`, `email.opened`, `email.clicked`, `email.bounced`

### `POST /projects/:id/resend-bid`

Re-send the estimate email (follow-up).

Guards:
- Project status must be `'sent'` (not accepted/rejected/draft)
- Last send must be > 24h ago — check `ProjectShare.createdAt` or a new `lastSentAt` field
- `share.response` must be null (no point re-sending after decision)

Steps:
1. Same as `POST /projects/:id/send` (Phase 3)
2. Update `ProjectShare.createdAt` (or `lastSentAt`) to now
3. Store new `resendEmailId`

### `GET /share/:token/messages` — `@Public()`

Returns all `PortalMessage` rows for the project, ordered by `createdAt` asc.

### `POST /share/:token/messages` — `@Public()`

Body: `{ body: string }`
Creates a `PortalMessage` with `sender = 'homeowner'`.
Optionally notifies contractor via email (simple notification, not a full email chain).

### `GET /projects/:id/messages` — authenticated

Returns all `PortalMessage` rows for the project.

### `POST /projects/:id/messages` — authenticated

Body: `{ body: string }`
Creates a `PortalMessage` with `sender = 'contractor'`.

---

## Frontend Changes

### Project detail page — Engagement panel

Visible when `project.status ∈ { 'sent', 'accepted', 'rejected' }`.

Collapsible panel below the main project content:

```
┌─ Engagement ──────────────────────────────────────────┐
│  Email sent       Mar 5, 2026 at 2:34 PM              │
│  Email delivered  Mar 5, 2026 at 2:34 PM              │
│  Email opened     Mar 5, 2026 at 3:12 PM  ✓           │
│  Portal viewed    Mar 5, 2026 at 3:13 PM  ✓           │
│                                                        │
│  Response: Accepted  (Mar 5 at 3:15 PM)               │
│  Note: "Going with the Better option"                  │
│                                                        │
│  [ Resend Follow-up ]  (disabled if < 24h)            │
└────────────────────────────────────────────────────────┘
```

Timestamps come from `EmailEvent` rows + `ProjectShare` fields. Poll or use SWR with a short revalidation interval while status is `'sent'`.

"Resend Follow-up" button:
- Disabled with countdown ("Available in 18h") if < 24h since last send
- On click: `POST /api/proxy/projects/:id/resend-bid` → toast "Follow-up sent"

### Project list page

Unread dot badge on project card when:
- A homeowner message was posted after the contractor last viewed the project
- `ProjectShare.viewedAt` was updated (portal was viewed for the first time)

### Portal `/bid/[token]` — Message thread

Below the response panel (or confirmation screen after responding):

```
┌─ Questions? ──────────────────────────────────────────┐
│  Smith Contracting (contractor):                       │
│  "Happy to answer any questions before you decide."   │
│                                                        │
│  You:                                                  │
│  "Does the Better option include tile removal?"        │
│                                                        │
│  [ Type a message... ]          [ Send ]               │
└────────────────────────────────────────────────────────┘
```

Homeowner can send before or after responding. Messages persist — no login required.

---

## Environment Variables

Add to `apps/api/.env.local`:
```
RESEND_WEBHOOK_SECRET=whsec_...
```

---

## Acceptance Criteria

- [ ] Resend webhook `POST /webhooks/resend` validates signature; rejects invalid HMAC
- [ ] `EmailEvent` rows are written for sent/delivered/opened events
- [ ] `ProjectShare.viewedAt` is updated when Resend fires `email.opened`
- [ ] Engagement panel on project detail shows correct timestamps
- [ ] "Resend Follow-up" is disabled for 24h after last send; enabled after
- [ ] Homeowner can post messages on portal; contractor sees them on project detail
- [ ] Contractor can reply; homeowner sees replies on portal
- [ ] Unread badge appears on project list when homeowner messages unread
