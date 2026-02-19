# M2: AI Bid Generation

## Overview
Built an AI-powered bid generation pipeline that uses an OpenAI agent loop to research construction material costs via 1Build's GraphQL API, then assembles a structured bid estimate, generates a PDF, and emails it to the contractor.

## Goals
- Allow contractors to generate a bid estimate using natural language project descriptions
- Pull real-time material pricing from 1Build
- Produce a downloadable/emailable PDF bid document
- Deliver the completed bid to the contractor via email

## Deliverables
- [x] OpenAI agent loop in `app/lib/openai/materials_agent.ts`
- [x] 1Build GraphQL integration at `app/api/onebuild/` with UOM bidirectional mapping
- [x] PDF generation endpoint
- [x] Email delivery on bid completion
- [x] `POST /api/bids/generate` route wiring everything together

## Notes
- The materials agent uses tool-calling with a loop: it iterates until the model stops requesting tools or a turn limit is hit
- 1Build UOM enums live in `app/api/onebuild/` and handle the impedance mismatch between Workwise and 1Build naming conventions
- Commit `27a2051` ("Add chat-like home page with AI bid generation via 1Build pricing") and `85bf0b5` ("Add email delivery") capture the core work
- `app/api/bids/generate/route.ts` is the main entry point; edge cases and input validation were tightened in `61d7519`
