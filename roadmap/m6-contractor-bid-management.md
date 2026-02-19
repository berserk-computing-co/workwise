# M6: Contractor Bid Management

## Overview
An enhanced contractor dashboard for viewing, editing, and managing bids after they've been generated. This milestone covers bid lifecycle management: status transitions, phase grouping, and estimate item editing.

## Goals
- Give contractors a full view of their generated bids
- Allow editing of estimate items (quantities, materials, prices)
- Support bid status transitions (draft → sent → accepted/declined)
- Enable phase-based grouping of estimate items

## Deliverables
- [ ] Bid list view with status indicators
- [ ] Bid detail/edit page (`app/bids/[id]/`)
- [ ] Estimate item inline editing
- [ ] Phase grouping UI (mirrors Rails `Phase` / `PhaseEstimateItem` models)
- [ ] Status update API routes
- [ ] Bid PDF download from within the dashboard

## Notes
- The old `app/bids/[id]/page.tsx` was deleted as part of M5 chat UI migration — this milestone will rebuild it with richer functionality
- The Rails API models (`Bid → Estimate → EstimateItem`, `Phase → PhaseEstimateItem`) define the data shape; the BFF needs corresponding API routes and type converters
- `toBidRequest()` / `toBid()` converter functions in `app/types/` handle snake_case ↔ camelCase translation
- Flowbite-React components (Card, Modal, Table) are the preferred UI primitives
