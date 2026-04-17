# PiecesOfThem

PiecesOfThem is a premium frontend prototype for assembling de-identified lived-experience fragments into a reviewer-friendly evidence ledger for Sanfilippo syndrome.

## Repo layout

- `frontend/`: Next.js app, API routes, demo data, and UI
- `backend/`: reserved backend workspace for extracted services, delivery helpers, or future runtime separation
- `docs/`: team coordination and phase planning

## Team setup

This repo is split into three strict ownership lanes. No one should edit another person's phase files.

### Frontend
- Branch: `feat/frontend-ui`
- Start with: Phase 3, then Phase 4, then Phase 6
- Owns:
  - `frontend/app/page.tsx`
  - `frontend/components/landing-page.tsx`
  - `frontend/app/case/demo-child-a/page.tsx`
  - `frontend/components/dashboard-shell.tsx`
  - `frontend/app/report/demo-child-a/page.tsx`
  - `frontend/components/report-page.tsx`
  - `frontend/app/globals.css`
  - `frontend/tailwind.config.ts`

### AI / RAG
- Branch: `feat/ai-rag-core`
- Start with: Phase 1, then Phase 2, then Phase 7
- Owns:
  - `frontend/lib/types.ts`
  - `frontend/lib/view-types.ts`
  - `frontend/lib/data.ts`
  - `frontend/lib/logic.ts`

### Backend
- Branch: `feat/backend-delivery`
- Start with: Phase 5, then Phase 8, then Phase 9
- Owns:
  - `frontend/app/api/cases/[caseId]/route.ts`
  - `frontend/app/api/fragments/route.ts`
  - `frontend/app/api/claims/route.ts`
  - `frontend/app/api/report/[caseId]/route.ts`
  - `frontend/app/layout.tsx`
  - `frontend/package.json`
  - `README.md`

### Team rules
- Phase 0 is discussion only.
- `frontend/lib/types.ts` is frozen after the AI / RAG lane defines it.
- No auth, uploads, or real database unless the current plan breaks.
- Keep the demo centered on:
  - `/`
  - `/case/demo-child-a`
  - `/report/demo-child-a`

## Local development

```bash
cd frontend
npm install
npm run dev
```

## Local ingestion pipeline

```bash
cp .env.example .env
pip install -r requirements.txt
```

Planned pipeline commands for later tasks:

```bash
python -m pipeline.main ensure-db
python -m pipeline.main init-db
python -m pipeline.main sync-seeds
python -m pipeline.main scrape
python -m pipeline.main extract
python -m pipeline.main run-all
```

## Included demo surfaces

- `/` editorial landing page
- `/case/demo-child-a` evidence dashboard
- `/report/demo-child-a` report-style evidence brief

## Included API routes

- `GET /api/cases/demo-child-a`
- `GET /api/fragments?caseId=demo-child-a`
- `POST /api/claims`
- `GET /api/report/demo-child-a`

## Data handling

The hackathon build uses synthetic or de-identified local evidence fragments. It is for review support only and does not provide diagnosis, treatment, or approval recommendations.

## Coordination docs

- `docs/TEAM_SHEET.md`
- `docs/REPO_PHASES.md`
- `docs/BRANCH_PLAN.md`
