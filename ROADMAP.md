# WorkWise Roadmap

WorkWise's next phase is closing the loop between AI-generated estimates and signed jobs. The goal: a contractor clicks "Send to Client," the homeowner receives a branded email with a PDF estimate, views it on a polished portal, and taps Accept — all without WorkWise branding getting in the way. The phases below build that end-to-end flow incrementally, each one unlocking the next.

## Phases

| # | Name | Summary | Size |
|---|------|---------|------|
| 1 | [Contractor Profile & Client Contact](roadmap/phase-1-contractor-profile.md) | Add logo/phone/license to Org; clientEmail/clientPhone to Project; settings page | S |
| 2 | [PDF Estimate Generation](roadmap/phase-2-pdf-estimates.md) | Branded PDF via `@react-pdf/renderer`; download button on project detail | M |
| 3 | [Bid Email Delivery](roadmap/phase-3-bid-email-delivery.md) | White-labeled send-to-client via Resend; contractor's own domain; "Send to Client" button | M |
| 4 | [Homeowner Portal](roadmap/phase-4-homeowner-portal.md) | Public `/bid/[token]` page; homeowner accept/reject; contractor notification | L |
| 5 | [Engagement Tracking](roadmap/phase-5-engagement-tracking.md) | Resend webhooks; email open tracking; follow-up reminders; messaging thread | L |

## Dependency Chain

```
Phase 1 (Profile & Client Contact)
    │  Org has logo/phone/license; Project has clientEmail
    ▼
Phase 2 (PDF Generation)
    │  PdfService.renderToBuffer() — shared utility
    ▼
Phase 3 (Bid Email Delivery)
    │  Attaches PDF; creates ProjectShare token; sends via contractor domain
    ▼
Phase 4 (Homeowner Portal)
    │  Token from Phase 3 unlocks public portal; response written back to DB
    ▼
Phase 5 (Engagement Tracking)
    │  Resend webhook correlates with Phase 3 email IDs
    │  Portal messages extend Phase 4 portal
    └── Depends on both Phase 3 + Phase 4
```

## Key Technical Risks

| Risk | Mitigation |
|------|-----------|
| `@react-pdf/renderer` needs `canvas` for image rendering in Node | Fetch logo as base64 data URI, not a URL; pass buffer to PDF template |
| Proxy route calls `getAccessToken()` which throws without Auth0 session | Portal pages call NestJS API directly at `NEXT_PUBLIC_API_URL`, not via proxy |
| Resend domain DNS propagation (24–72h) | Provision at settings save, not at send time; show DNS records + status badge; disable "Send to Client" until `domainVerified = true` |
| Re-sending reverts `respondedAt` | `resend-bid` guard: only if `share.response` is null OR explicit force param from contractor |
