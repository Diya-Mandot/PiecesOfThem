# PiecesOfThem Team Sheet

Use this as the working contract for the 3-person hackathon sprint.

## Core Rule

No one touches another person's phase files.

Each person owns a separate set of phases and a separate set of files. If a cross-boundary change is needed, the owner of that boundary makes the change.

Phase 0 is discussion only. It is not a coding phase.

## Person 1: Frontend

Owns all user-facing interface work.

Owned phases:
- Phase 3: Landing Page
- Phase 4: Case Dashboard
- Phase 6: Evidence Brief

Owned files:
- `app/page.tsx`
- `components/landing-page.tsx`
- `app/case/demo-child-a/page.tsx`
- `components/dashboard-shell.tsx`
- `app/report/demo-child-a/page.tsx`
- `components/report-page.tsx`
- `app/globals.css`
- `tailwind.config.ts`

Responsibilities:
- premium visual quality
- responsive layout
- interaction clarity
- visual consistency across the demo path

## Person 2: AI / RAG

Owns the evidence model and intelligence layer.

Owned phases:
- Phase 1: Contracts and Schema
- Phase 2: Demo Data and Retrieval Core
- Phase 7: AI / RAG Enhancement

Owned files:
- `lib/types.ts`
- `lib/view-types.ts`
- `lib/data.ts`
- `lib/logic.ts`

Responsibilities:
- schema definition
- fragment and claim quality
- retrieval logic
- temporal comparison logic
- synthetic evidence derived from safe public patterns

## Person 3: Backend

Owns app delivery, route wiring, and runtime stability.

Owned phases:
- Phase 5: Integration and Lineage Delivery
- Phase 8: Runtime and Delivery Hardening
- Phase 9: Repo and Demo Packaging

Owned files:
- `app/api/cases/[caseId]/route.ts`
- `app/api/fragments/route.ts`
- `app/api/claims/route.ts`
- `app/api/report/[caseId]/route.ts`
- `app/layout.tsx`
- `package.json`
- `README.md`

Responsibilities:
- route stability
- local startup flow
- API delivery
- repo hygiene
- packaging the app for demo and submission

## Phase 0: Verbal Kickoff Only

Before coding starts, all three people agree on:
- the one-sentence product definition
- the single demo path
- the exact fields in `CaseRecord`, `EvidenceFragment`, and `Claim`
- what is explicitly out of scope

No code changes happen during Phase 0.

## Freeze Rules

- After Phase 1, `lib/types.ts` is frozen.
- After Phase 2, the core data shape is frozen.
- Frontend builds against the frozen shape.
- Backend builds APIs against the frozen shape.
- If a new field is needed, only the AI / RAG owner edits the type definitions.
- If an API contract changes, only the Backend owner edits the route files.
- If UI structure changes, only the Frontend owner edits the UI files.

## Working Rules

- No shared file ownership.
- No “quick fixes” in someone else’s lane.
- No auth, uploads, or real database unless the plan breaks.
- Prefer synthetic or de-identified fragments derived from public patterns.
- Keep the demo centered on:
  - `/`
  - `/case/demo-child-a`
  - `/report/demo-child-a`
