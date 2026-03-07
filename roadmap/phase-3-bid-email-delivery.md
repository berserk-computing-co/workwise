# Phase 3 — Bid Email Delivery

**Size:** M
**Depends on:** Phase 1 (clientEmail, org domain fields), Phase 2 (PdfService)
**Unlocks:** Phase 4 (ProjectShare token used for portal URL), Phase 5 (resendEmailId for webhook correlation)

## Core User Story

Contractor clicks "Send to Client" → homeowner receives an email that looks like it came from the contractor (e.g. `bids@smithcontracting.com`), with the PDF estimate attached and a link to view/accept online.

---

## White-Labeling Approach: BYOD via Resend

Contractor provides their own domain in the Settings page. WorkWise:

1. Calls Resend Domains API to register the domain → receives DKIM/SPF/DMARC DNS records
2. Settings page displays DNS records with copy buttons + "Verify DNS" button
3. On verify: polls `GET /organizations/me/domain-status` → calls Resend to check
4. Once `domainVerified = true`, "Send to Client" is unlocked
5. Email sends `From: "Smith Contracting <bids@smithcontracting.com>"`

DNS propagation takes 24–72h — show clear status badges: **Pending → Verifying → Verified**.

---

## New Entity: `ProjectShare`

`apps/api/src/projects/entities/project-share.entity.ts`

| Column | Type | Notes |
|--------|------|-------|
| `id` | `UUID` | Opaque portal token (v4, 122-bit entropy). Used as the URL slug. |
| `projectId` | `UUID` | Unique — one active share per project |
| `resendEmailId` | `string \| null` | For webhook correlation in Phase 5 |
| `viewedAt` | `Date \| null` | Set on first portal view |
| `respondedAt` | `Date \| null` | Set when homeowner submits response |
| `response` | `'accepted' \| 'rejected' \| null` | Homeowner decision |
| `responseNote` | `string \| null` | Optional homeowner note |
| `createdAt` | `Date` | Auto-set |

```bash
nx migration:generate api --args="--name=ProjectShareTable"
nx migration:run api
```

---

## New API Module: `apps/api/src/email/`

```
apps/api/src/email/
  email.module.ts
  email.service.ts
  templates/
    bid-email.template.tsx
```

### `email.service.ts`

**`sendBidEmail(project, org, shareToken)`**
- Calls `PdfService.renderToBuffer()` (injected from `PdfModule`)
- Sends via Resend SDK:
  - `from`: `"${org.name} <${org.emailFromAddress}>"`
  - `to`: `project.clientEmail`
  - `subject`: `"Your Estimate from ${org.name}"`
  - `react`: `<BidEmailTemplate>` React Email component
  - `attachments`: `[{ filename: 'estimate.pdf', content: pdfBuffer }]`
- Stores returned Resend email ID on `ProjectShare.resendEmailId`

**`provisionDomain(org, domain, fromAddress)`**
- Calls `POST https://api.resend.com/domains` with `{ name: domain }`
- Stores `resendDomainId` + `emailDomain` + `emailFromAddress` on org
- Returns DNS records `{ dkim, spf, dmarc }` to display in UI

**`checkDomainVerification(org)`**
- Calls `GET https://api.resend.com/domains/:resendDomainId`
- If status = `verified`, sets `org.domainVerified = true` and saves
- Returns `{ verified: boolean, status: string }`

**`sendResponseNotification(project, org, share)`** *(used in Phase 4)*
- Sends contractor an email: "Your client responded to the estimate"
- From: WorkWise default domain (not contractor domain — this is internal)

### `templates/bid-email.template.tsx`

React Email HTML template. Sections:
- Contractor logo + name header
- "Hi [client name]," greeting
- Estimate summary (project address, total range)
- CTA button: "View Your Estimate" → `https://app.workwise.com/bid/[token]`
- "PDF attached for your records"
- Footer: contractor phone, website, license

---

## New Endpoint: `POST /projects/:id/send`

Steps:
1. Load project (with sections → items → options) + org
2. Assert `project.clientEmail` is not null → `400`
3. Assert `org.domainVerified` → `400 { error: 'domain_not_verified' }`
4. Call `PdfService.renderToBuffer()`
5. Upsert `ProjectShare` (create if none, update `createdAt` if re-sending)
6. Call `EmailService.sendBidEmail(project, org, share.id)`
7. Patch `project.status` → `'sent'`
8. Return `{ sent: true, shareToken: share.id }`

---

## Additional Endpoints

### `POST /organizations/me/email-domain`

Body: `{ domain: string, fromAddress: string }`

1. Validate domain format
2. Call `EmailService.provisionDomain(org, domain, fromAddress)`
3. Return DNS records for display in UI:
   ```json
   {
     "resendDomainId": "...",
     "records": {
       "dkim": { "name": "...", "type": "TXT", "value": "..." },
       "spf":  { "name": "...", "type": "TXT", "value": "..." },
       "dmarc":{ "name": "...", "type": "TXT", "value": "..." }
     }
   }
   ```

### `GET /organizations/me/domain-status`

1. Load org, assert `resendDomainId` not null
2. Call `EmailService.checkDomainVerification(org)`
3. Return `{ verified: boolean, status: 'pending' | 'verifying' | 'verified' | 'failed' }`

---

## Frontend Changes

### Settings page — "Sending Domain" section

*(Placeholder added in Phase 1 is now filled in.)*

1. Input fields: **Domain** (e.g. `smithcontracting.com`) + **From address** (e.g. `bids@smithcontracting.com`)
2. "Save Domain" button → `POST /api/proxy/organizations/me/email-domain`
3. On success: display DNS record table with copy-to-clipboard buttons for each value
4. **Status badge**: Pending / Verifying / Verified (polls `GET /api/proxy/organizations/me/domain-status` every 30s while Pending)
5. "Verify DNS" button → triggers one-off poll + shows result immediately

### Project detail page

Replace "Share" placeholder button with **"Send to Client"**:

- **Disabled states:**
  - `clientEmail` is null → tooltip: "Add client email first"
  - `org.domainVerified` is false → tooltip: "Set up your sending domain in Settings"
- **Pre-send confirmation modal:**
  - "Sending to: client@example.com"
  - "From: bids@smithcontracting.com"
  - "PDF attached"
  - Confirm / Cancel
- On success: toast "Estimate sent!" + project status badge updates to "Sent"

---

## Acceptance Criteria

- [ ] Contractor can provision a domain and see DNS records in Settings
- [ ] Domain status polling works; badge shows Pending → Verified correctly
- [ ] `POST /projects/:id/send` sends a real email with PDF attached
- [ ] Email arrives `From` the contractor's domain, not a WorkWise domain
- [ ] "Send to Client" button is disabled with correct tooltip when preconditions unmet
- [ ] `ProjectShare` row is created in DB with correct `resendEmailId`
- [ ] Project status updates to `'sent'` after successful send
