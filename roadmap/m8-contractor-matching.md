# M8: Contractor Matching

## Overview
Leverage the Neo4j graph database (already provisioned in the stack) to match contractors to projects based on trade specialization, geographic service area, and availability. This enables homeowners to discover qualified contractors and allows the platform to proactively route leads.

## Goals
- Model contractor capabilities and project requirements as a graph
- Query Neo4j to find best-fit contractors for a given project
- Surface match results to homeowners during the bid request flow
- Allow contractors to set availability and service radius

## Deliverables
- [ ] Neo4j schema design for contractor/project/trade relationships
- [ ] BFF API route for match queries (`app/api/matching/`)
- [ ] Contractor profile fields: trades, license types, service area (geo), availability
- [ ] Match scoring algorithm (Neo4j Cypher queries)
- [ ] UI for homeowners to browse matched contractors
- [ ] UI for contractors to manage their profile/availability

## Notes
- `neo4j-driver` is already listed as a dependency in the BFF (`package.json`), indicating this was planned from early in the project
- The Rails API backend also has Neo4j wired in — the matching logic could live in either layer; the BFF is the more likely host for the query/display layer
- Geographic matching likely requires storing contractor service areas as point + radius data in Neo4j
- This is the most architecturally novel milestone — spike work to validate Neo4j query performance is recommended before full implementation
