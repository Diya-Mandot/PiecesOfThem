# PiecesOfThem Backend Implementation Plan

## Context

### The problem

PiecesOfThem exists because the most important evidence for Sanfilippo Syndrome treatment response is often not captured in conventional trial outputs.

Children with Sanfilippo Syndrome lose speech, memory, recognition, and daily-function continuity over time. The platform is built around the claim that small lived-experience signals, such as retained vocabulary, recognition of caregivers, or improved sleep continuity, can provide meaningful real-world evidence when they are gathered, de-identified, structured, and traced back to source material.

The core backend problem is therefore not generic CRUD. It is evidence delivery under trust constraints:
- fragments arrive as human narrative, not clean tables
- claims must remain traceable to source fragments
- outputs must support temporal reasoning across years
- the frontend and report surfaces need stable, inspectable payloads
- the demo must stay deterministic and review-friendly

### What the project aims to do

The project aims to turn de-identified patient-style narrative fragments into regulatory-ready evidence artifacts for the UX111 review window ending on September 19, 2026.

In the current repo, that means supporting a single clear demo path:
- `/`
- `/case/demo-child-a`
- `/report/demo-child-a`

The backend role in that flow is to:
- expose case, fragment, claim, and report data through stable route handlers
- preserve citation lineage from claims back to fragments
- package the evidence into payloads the UI can render without guesswork
- keep the runtime simple, local, and deterministic for the hackathon build

## Current State

The current backend is implemented as a standalone Fastify app in `backend/src/`.

Current routes:
- `GET /api/cases/[caseId]`
- `GET /api/fragments?caseId=...`
- `POST /api/claims`
- `GET /api/report/[caseId]`

Current data source:
- live ingestion-table projections from `backend/src/projection-repository.ts`

Current backend characteristics:
- no persistence layer
- no auth
- no uploads
- no background jobs
- no external model calls
- synchronous route handlers over deterministic local logic

This is the correct starting point for the hackathon build. The backend plan should harden and clarify this flow before introducing complexity.

## Backend Objectives

The backend should optimize for:
- lineage correctness
- deterministic output
- simple route contracts
- clear error handling
- local demo reliability
- future extraction path into `backend/` without forcing that split prematurely

The backend should not optimize for:
- premature microservices
- speculative infrastructure
- real PHI handling in the hackathon build
- open-ended ingestion pipelines before the core evidence path is stable

## Backend Scope

Backend ownership maps to:
- Phase 5: Integration and lineage delivery
- Phase 8: Runtime and delivery hardening
- Phase 9: Repo/demo packaging

Owned files today:
- `backend/src/server.ts`
- `backend/src/routes.ts`
- `backend/src/service.ts`
- `backend/src/projection-repository.ts`
- `frontend/app/layout.tsx`
- `frontend/package.json`
- `backend/package.json`
- `README.md`

Supporting note:
- the top-level `backend/` directory is currently a reserved workspace, not the active runtime

## Implementation Principles

1. Preserve lineage at every boundary.
Each claim returned by the backend must remain connected to fragment IDs and to recoverable fragment records.

2. Keep derived data explicit.
If a route returns computed metrics or synthesized summaries, those fields should be clearly distinguished from source observations.

3. Make temporal reasoning visible.
The backend should not flatten the time dimension away. Dates, ordering, and observation windows must remain first-class.

4. Favor deterministic demo behavior.
The hackathon backend should produce repeatable results from local data without network or model dependencies.

5. Harden the current runtime before extracting a new one.
The immediate goal is a reliable delivery layer, not a second backend stack.

## Phase Plan

### Phase 5: Integration and Lineage Delivery

Goal:
- make the route layer the authoritative API contract between the frontend and the evidence logic

Implementation tasks:
- define stable JSON response shapes for each route
- normalize error responses across all API handlers
- ensure every claim response includes recoverable lineage
- ensure report responses include both summary-level metrics and claim-level citations
- keep route handlers thin and move shaping logic into backend-oriented helper functions where useful

Recommended route contracts:

#### `GET /api/cases/[caseId]`

Purpose:
- return the case record and high-level metrics for dashboard initialization

Should include:
- `caseRecord`
- `metrics.fragmentCount`
- `metrics.claimCount`
- `metrics.sourceTypes`
- optional `availableDomains`
- optional `availableYears`

#### `GET /api/fragments`

Purpose:
- return filtered evidence fragments for dashboard exploration

Required query:
- `caseId`

Optional query:
- `domain`
- `year`
- `query`

Should include:
- `fragments`
- optional `appliedFilters`
- optional `totalCount`

#### `POST /api/claims`

Purpose:
- return claims for a case, optionally filtered by domain

Should include:
- `claims`
- each claim should preserve `fragmentIds`
- consider including lightweight lineage previews for immediate UI rendering

#### `GET /api/report/[caseId]`

Purpose:
- return a report-ready payload with metrics, claims, and citations

Should include:
- case metadata
- report metrics
- claims with embedded citation objects
- explicit distinction between source fragments and derived report summaries

Deliverables:
- consistent route payloads
- consistent 400/404/500 handling
- zero lineage breaks across all returned claims

### Phase 8: Runtime and Delivery Hardening

Goal:
- make the demo easy to run, type-safe, and robust under normal local use

Implementation tasks:
- add shared response helpers for success and error payloads
- centralize route-safe validation for params and query strings
- add simple runtime guards around request bodies
- ensure route behavior is deterministic for invalid case IDs and bad filters
- verify `npm run typecheck` and `npm run build` from `frontend/`
- keep `frontend/app/layout.tsx` minimal and stable for the app shell
- document local startup and demo routes clearly in `README.md`

Recommended hardening items:
- route helper for `notFound`
- route helper for `badRequest`
- route helper for `ok`
- helper for parsing filter inputs into typed values
- helper for assembling report payloads separate from UI concerns

Deliverables:
- predictable route behavior
- no frontend dependence on undocumented edge-case behavior
- startup instructions that match the moved `frontend/` structure

### Phase 9: Repo and Demo Packaging

Goal:
- make the backend understandable to judges, teammates, and future contributors

Implementation tasks:
- document the backend architecture and current runtime location
- explain that the live backend surface is now `backend/src/routes.ts`
- clarify what the reserved `backend/` directory is for
- document the single demo case and supported routes
- document what is intentionally out of scope for the hackathon build

Packaging checklist:
- repo root README explains where to run the app
- backend workspace README explains current vs future backend split
- API routes are discoverable and named consistently
- no stale path references remain after the `frontend/` move

Deliverables:
- clean onboarding for backend work
- clear explanation of current backend boundaries
- lower merge risk across frontend, AI/RAG, and backend lanes

## Suggested Backend Architecture

For the current build, use a three-layer backend structure inside the existing Next app:

1. Route layer
- files in `backend/src/...`
- owns HTTP concerns only
- parses params, validates inputs, returns JSON responses

2. Backend service layer
- helper modules that shape route responses and enforce lineage rules
- can live under `frontend/lib/` initially or under a future `backend/src/` if extraction becomes necessary

3. Domain logic and data layer
- existing demo data and retrieval logic
- remains the source of truth for fragments, claims, and report composition

Practical recommendation:
- keep the active backend in `backend/src/`
- keep frontend data access in `frontend/lib/api.ts`
- defer heavier ingestion and worker infrastructure until there is a real need for persistence, ingestion jobs, or external interfaces

## Data and Lineage Requirements

The backend must enforce the following:
- every claim references valid `fragmentIds`
- every fragment belongs to the requested `caseId`
- report citations are materialized from those fragment IDs, not hand-authored separately
- fragment dates remain available for temporal interpretation
- synthetic or de-identified status is preserved in the payload

Recommended validation checks:
- orphaned `fragmentIds` are treated as build-breaking
- duplicate fragment IDs are rejected
- unsupported domains return a clear 400 response
- unknown case IDs return 404 consistently

## API Quality Bar

The backend is ready for demo use when:
- all routes return consistent JSON structures
- all claims are source-backed
- all report citations are programmatically reconstructable
- filter behavior is documented and deterministic
- the frontend can render without hidden coupling to raw `lib` internals

## Testing and Verification Plan

Minimum verification:
- `cd frontend && npm run typecheck`
- `cd frontend && npm run build`
- manual route checks for:
  - valid case ID
  - invalid case ID
  - missing `caseId`
  - valid domain filter
  - invalid domain filter
  - report payload citation integrity

Recommended additional checks:
- snapshot response shapes for the four API routes
- unit tests for payload assembly helpers if helper extraction is added
- consistency check that every claim fragment ID resolves to an existing fragment

## Risks

### 1. Lineage drift

Risk:
- claims and report citations can drift apart if the backend duplicates shaping logic in multiple places

Mitigation:
- centralize report assembly and claim-to-fragment resolution

### 2. Hidden frontend coupling

Risk:
- the UI may start depending directly on `lib` data shape rather than API contracts

Mitigation:
- treat API payloads as the integration boundary and document them

### 3. Premature backend extraction

Risk:
- moving too much into `backend/` now creates churn without product value

Mitigation:
- harden the Next route layer first and extract only when a real runtime boundary appears

### 4. Validation gaps

Risk:
- invalid query values or missing lineage fields can silently degrade the demo

Mitigation:
- add typed parsing, explicit error responses, and consistency checks

## Immediate Next Steps

1. Normalize and document all API response shapes.
2. Add shared helpers for route responses and filter parsing.
3. Add lineage validation for claims and report citations.
4. Verify the frontend consumes only route payloads for backend-owned data delivery.
5. Update repo docs if any backend contract changes are introduced.

## Definition of Backend Done

The backend lane is done for this sprint when:
- the four API routes are stable and predictable
- lineage is preserved end to end
- the demo routes render from backend-delivered payloads cleanly
- local startup is documented and works from `frontend/`
- the repo clearly explains the current backend boundary and future extraction path
