# M5: Chat UI Migration

## Overview
Replacing the old multi-step wizard form for bid creation with a conversational, chat-like interface. The new UI drives AI bid generation through natural language, making the experience more intuitive for contractors.

## Goals
- Replace the `app/bids/create/` multi-step form with a chat-based interaction model
- Stream AI responses progressively to the user
- Maintain feature parity: material pricing, PDF generation, email delivery
- Support a dark/light theme toggle

## Deliverables
- [x] Delete old multi-step form files (`app/bids/create/forms/`, `app/bids/create/page.tsx`)
- [x] Build `app/components/bid_generator.tsx` as the new chat UI component
- [x] Add `app/components/theme_toggle.tsx` for dark/light mode support
- [x] Add `app/lib/theme/` for theme context/provider
- [x] Update `app/globals.css` and `tailwind.config.ts` for chat UI styling
- [x] Update `app/layout.tsx` and `app/components/workwise_navbar.tsx`
- [ ] Polish streaming UX (loading states, error recovery)
- [ ] Handle edge cases: empty responses, network failures, rate limits
- [ ] Add bid history/review after generation completes

## Notes
- Active branch: `feature/chat-ui-ai-bid-generation`
- Old pages deleted: `app/bids/[id]/page.tsx`, `app/bids/page.tsx`, `app/bids/layout.tsx`, `app/login/page.tsx`, `app/page.tsx`
- The `app/api/bids/generate/route.ts` backend route is shared with the previous UI and has been hardened
- Theme toggle is a new UX addition not present in the old form flow
