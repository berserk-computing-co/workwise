# M7: Homeowner Portal

## Overview
A dedicated portal for homeowners (clients) to view bids submitted to them, track project status, compare contractors, and accept or decline bids. This is the consumer-facing counterpart to the contractor-facing dashboard.

## Goals
- Allow homeowners to log in and view bids addressed to them
- Display bid breakdowns in a homeowner-friendly format (summary, not raw estimates)
- Support bid acceptance/declination workflow
- Show project status after a bid is accepted and converted to a project

## Deliverables
- [ ] Homeowner authentication flow (separate from contractor auth or role-based)
- [ ] Bid inbox view listing bids received
- [ ] Bid detail view with cost summary and contractor info
- [ ] Accept/decline actions wired to API
- [ ] Project status tracking post-acceptance
- [ ] Mobile-responsive layout

## Notes
- The Rails API `Bid` model belongs to `Client` and `Contractor` — homeowner access would be scoped to the `Client` record
- A bid can be converted to a `Project` via `bid.convert_to_project` on the Rails side; the BFF needs to surface this state change
- Auth strategy for homeowners is an open question: Stytch magic links (no password) would fit the use case
- The `app/(site)/` directory may be the intended home for these public-facing routes
