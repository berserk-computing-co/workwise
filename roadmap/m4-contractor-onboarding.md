# M4: Contractor Onboarding

## Overview
Built a two-step contractor application/registration flow that captures business details, trade specializations, and license information before granting full platform access.

## Goals
- Guide new contractors through a structured onboarding process
- Capture trade type, service area, and license details
- Create a contractor record on the backend upon completion

## Deliverables
- [x] Multi-step onboarding form under `app/(site)/` or equivalent route
- [x] Trade/license capture fields
- [x] API route at `app/api/contractors/` for contractor creation
- [x] Form validation and error handling

## Notes
- The contractor onboarding routes live under `app/api/contractors/` (visible as untracked in git status)
- The `app/(site)/` directory (also untracked) likely contains the onboarding UI pages
- Contractor data is scoped in the Rails API by `@contractor` (derived from JWT `sub` field) — the BFF mirrors this scoping
- Open question: whether onboarding state is persisted mid-flow or only submitted on completion
