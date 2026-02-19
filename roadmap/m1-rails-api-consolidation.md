# M1: Rails API Consolidation

## Overview
Eliminated the separate Rails backend dependency by consolidating its responsibilities into the Next.js BFF. This removed the operational complexity of running two servers and simplified local development.

## Goals
- Remove the runtime dependency on `workwise_api` for the BFF to function
- Inline or replicate backend logic directly in Next.js API routes
- Maintain API compatibility with the mobile app

## Deliverables
- [x] Replace `workwiseFetch()` proxy calls with direct DB/service logic in API routes
- [x] Move auth token validation into the BFF layer
- [x] Consolidate contractor and bid API endpoints under `app/api/`
- [x] Update `WORKWISE_URL` env var usage and document the new architecture

## Notes
- Commit `d34b809` ("Consolidate Rails API into Next.js BFF — eliminate backend dependency") marks the completion of this milestone
- The Rails API (`workwise_api/`) still exists in the monorepo and is used by the mobile app, but the BFF no longer depends on it at runtime
- `app/lib/workwise_api/utils.ts` (`workwiseFetch`) was the primary proxy utility; its call sites were migrated to native Next.js API routes
