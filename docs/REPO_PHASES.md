# PiecesOfThem Repo Phases

This file divides the repo into separate, non-overlapping phases. Each phase has exactly one owner.

## Phase 0: Verbal Kickoff
Owner: Shared discussion only

Purpose:
- lock the product framing
- lock the demo flow
- lock what is in scope

Output:
- no code
- only agreements

## Phase 1: Contracts and Schema
Owner: AI / RAG

Files:
- `lib/types.ts`
- `lib/view-types.ts`

Purpose:
- define `CaseRecord`, `EvidenceFragment`, and `Claim`
- freeze the data contract for the rest of the sprint

Done when:
- the schema is stable
- the rest of the team can build against it without guessing

## Phase 2: Demo Data and Retrieval Core
Owner: AI / RAG

Files:
- `lib/data.ts`
- `lib/logic.ts`

Purpose:
- create the demo case
- implement retrieval and temporal comparison logic
- ensure claims map to exact fragments

Done when:
- every claim has supporting fragment IDs
- the data is coherent from 2024 to 2026

## Phase 3: Landing Page
Owner: Frontend

Files:
- `app/page.tsx`
- `components/landing-page.tsx`
- `app/globals.css`
- `tailwind.config.ts`

Purpose:
- create a strong first impression
- establish the visual language
- move the user clearly into the case demo

Done when:
- the landing page is polished and understandable in one screen

## Phase 4: Case Dashboard
Owner: Frontend

Files:
- `app/case/demo-child-a/page.tsx`
- `components/dashboard-shell.tsx`

Purpose:
- build the main interactive demo screen
- present fragments, timeline, claims, and lineage clearly

Done when:
- the dashboard is readable, interactive, and demo-ready

## Phase 5: Integration and Lineage Delivery
Owner: Backend

Files:
- `app/api/cases/[caseId]/route.ts`
- `app/api/fragments/route.ts`
- `app/api/claims/route.ts`
- `app/api/report/[caseId]/route.ts`

Purpose:
- expose stable route responses
- deliver the data and claim pipeline to the frontend
- preserve citation linkage in API output

Done when:
- routes return the expected data cleanly
- the UI can rely on stable responses

## Phase 6: Evidence Brief
Owner: Frontend

Files:
- `app/report/demo-child-a/page.tsx`
- `components/report-page.tsx`

Purpose:
- create a polished report artifact
- make the report usable as a standalone demo surface

Done when:
- the evidence brief looks presentation-ready

## Phase 7: AI / RAG Enhancement
Owner: AI / RAG

Files:
- `lib/data.ts`
- `lib/logic.ts`

Purpose:
- improve retrieval quality
- improve summary logic
- strengthen deterministic evidence synthesis

Done when:
- claims and supporting evidence feel credible and sharp

## Phase 8: Runtime and Delivery Hardening
Owner: Backend

Files:
- `app/layout.tsx`
- `package.json`
- `README.md`

Purpose:
- stabilize local startup
- keep the repo runnable
- document setup and demo routes clearly

Done when:
- the app runs cleanly
- startup instructions are clear

## Phase 9: Repo and Demo Packaging
Owner: Backend

Files:
- `README.md`
- demo packaging and repo-level instructions

Purpose:
- prepare the repo for handoff, judging, and submission
- make the demo path obvious

Done when:
- the repo is understandable to an outsider
- the demo instructions are easy to follow

## Owner Summary

- Frontend owns Phases 3, 4, and 6
- AI / RAG owns Phases 1, 2, and 7
- Backend owns Phases 5, 8, and 9

No one edits another person’s phase files.
