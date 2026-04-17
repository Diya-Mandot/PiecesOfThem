# PiecesOfThem

PiecesOfThem is a premium frontend prototype for assembling de-identified lived-experience fragments into a reviewer-friendly evidence ledger for Sanfilippo syndrome.

## Team setup

This repo is split into three strict ownership lanes. No one should edit another person's phase files.

### Frontend
- Branch: `feat/frontend-ui`
- Start with: Phase 3, then Phase 4, then Phase 6
- Owns:
  - `app/page.tsx`
  - `components/landing-page.tsx`
  - `app/case/demo-child-a/page.tsx`
  - `components/dashboard-shell.tsx`
  - `app/report/demo-child-a/page.tsx`
  - `components/report-page.tsx`
  - `app/globals.css`
  - `tailwind.config.ts`

### AI / RAG
- Branch: `feat/ai-rag-core`
- Start with: Phase 1, then Phase 2, then Phase 7
- Owns:
  - `lib/types.ts`
  - `lib/view-types.ts`
  - `lib/data.ts`
  - `lib/logic.ts`

### Backend
- Branch: `feat/backend-delivery`
- Start with: Phase 5, then Phase 8, then Phase 9
- Owns:
  - `app/api/cases/[caseId]/route.ts`
  - `app/api/fragments/route.ts`
  - `app/api/claims/route.ts`
  - `app/api/report/[caseId]/route.ts`
  - `app/layout.tsx`
  - `package.json`
  - `README.md`

### Team rules
- Phase 0 is discussion only.
- `lib/types.ts` is frozen after the AI / RAG lane defines it.
- No auth, uploads, or real database unless the current plan breaks.
- Keep the demo centered on:
  - `/`
  - `/case/demo-child-a`
  - `/report/demo-child-a`

## Local development

```bash
npm install
npm run dev
```

## Local ingestion pipeline

```bash
cp .env.example .env
pip install -r requirements.txt
```

Commands:

```bash
python -m pipeline.main ensure-db
python -m pipeline.main init-db
python -m pipeline.main sync-seeds
python -m pipeline.main scrape
python -m pipeline.main extract
python -m pipeline.main run-all
```

If `python -m pipeline.main extract` fails, confirm that `OPENAI_API_KEY` is set in `.env` and that the selected model is accessible from your account.

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
