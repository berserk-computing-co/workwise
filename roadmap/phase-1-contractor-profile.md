# Phase 1 — Contractor Profile & Client Contact

**Size:** S
**Depends on:** nothing
**Unlocks:** Phase 2 (PDF needs logo/license), Phase 3 (email needs clientEmail + domain fields)

## Why First

Neither a PDF nor an email can be branded without logo, phone, and license number. No estimate email can be sent without `clientEmail`. This phase plants every field that Phases 2–5 need — it's the foundation.

---

## Data Model Changes

### `apps/api/src/users/entities/organization.entity.ts`

New nullable columns:

| Column | Type | Purpose |
|--------|------|---------|
| `logoUrl` | `string \| null` | S3 URL of contractor logo |
| `phone` | `string \| null` | Displayed on PDF header + portal |
| `website` | `string \| null` | Displayed on PDF + portal |
| `licenseNumber` | `string \| null` | Displayed on PDF header |
| `emailDomain` | `string \| null` | Contractor's domain e.g. `smithcontracting.com` |
| `emailFromAddress` | `string \| null` | e.g. `bids@smithcontracting.com` |
| `resendDomainId` | `string \| null` | Resend domain ID once registered (Phase 3) |
| `domainVerified` | `boolean` | Default `false`; true once Resend confirms DKIM/SPF (Phase 3) |

### `apps/api/src/projects/entities/project.entity.ts`

New nullable columns:

| Column | Type | Purpose |
|--------|------|---------|
| `clientEmail` | `string \| null` | Recipient for Phase 3 email send |
| `clientPhone` | `string \| null` | Displayed in project detail + PDF |

### Migration

```bash
nx migration:generate api --args="--name=ContractorProfileAndClientContact"
nx migration:run api
```

---

## Shared Types (`libs/shared-types/src/`)

### `models.ts`

Update `Organization` interface — add all 8 new fields.
Update `Project` interface — add `clientEmail` and `clientPhone`.

### `requests.ts`

Update `UpdateOrganizationPayload` — add `phone?`, `website?`, `licenseNumber?`, `emailDomain?`, `emailFromAddress?`.
Update `UpdateProjectPayload` — add `clientEmail?`, `clientPhone?`.

```bash
npx nx build shared-types
```

---

## API Changes

### `PATCH /organizations/me`

`UpdateOrganizationDto` gets 5 new optional fields: `phone`, `website`, `licenseNumber`, `emailDomain`, `emailFromAddress`. No service logic changes needed — TypeORM `save()` handles partial updates.

### `POST /organizations/me/logo`  *(new)*

Multipart upload → S3 (reuse existing S3 pattern from the codebase) → updates `org.logoUrl` → returns `{ logoUrl: string }`.

```
apps/api/src/users/
  users.controller.ts   — add POST /organizations/me/logo
  users.service.ts      — add uploadLogo(orgId, file): Promise<string>
```

### `PATCH /projects/:id`

`UpdateProjectDto` gets `clientEmail?: string` and `clientPhone?: string`. No service logic changes.

---

## Frontend Changes

### New page: `/settings`

`apps/web/app/(site)/settings/page.tsx`

Pattern: `react-hook-form` as in `/onboarding/page.tsx`.

Sections:
1. **Company Profile** — logo upload (image preview + file input), company name, phone, website, license number
2. **Sending Domain** *(placeholder for Phase 3)* — greyed out section with "Coming soon" or empty state

Logo upload: `<input type="file" accept="image/*">` → POST `/api/proxy/organizations/me/logo` → update form state with returned `logoUrl`.

Link from navbar: add "Settings" item to the top-nav or sidebar.

### Project detail page (`/projects/[id]/page.tsx`)

Add `clientEmail` and `clientPhone` as `EditableField` components in the client info section (same inline-edit pattern used for project title, address, etc.).

Fields sit under the client name (if a `Client` entity exists) or as standalone fields if no client is linked.

---

## Acceptance Criteria

- [ ] Contractor can upload a logo; it persists across page reloads
- [ ] Contractor can set phone, website, license number via Settings page
- [ ] Project detail shows editable `clientEmail` and `clientPhone` fields
- [ ] All new fields appear in `GET /organizations/me` and `GET /projects/:id` responses
- [ ] Migration runs cleanly on a fresh DB and on an existing DB with data
