# PiecesOfThem

PiecesOfThem is an agentic evidence workbench for turning Sanfilippo lived-experience data into reviewer-friendly, citation-backed clinical evidence.

## Repo layout

- `frontend/`: Next.js UI app and typed frontend data-access layer
- `backend/`: Fastify TypeScript API and backend service layer
- `shared/`: contracts shared by frontend and backend
- `pipeline/`: Python ingestion, scraping, chunking, and extraction pipeline
- `data/`: checked-in seed inputs for pipeline ingestion
- `docs/`: team coordination, plans, and API documentation

## Current architecture

- `frontend/` is UI-only
- `backend/` owns the active HTTP API surface
- `shared/` holds contracts used by both apps
- `pipeline/` is responsible for populating the ingestion schema in PostgreSQL
- backend read-model endpoints project ingestion-table data into frontend-friendly payloads

## Team setup

This repo is split into three strict ownership lanes. No one should edit another person's phase files without coordination.

### Frontend
- Branch: `feat/frontend-ui`
- Start with: Phase 3, then Phase 4, then Phase 6
- Owns:
  - `frontend/app/page.tsx`
  - `frontend/components/landing-page.tsx`
  - `frontend/app/case/demo-child-a/page.tsx`
  - `frontend/components/dashboard-shell.tsx`
  - `frontend/components/report-page.tsx`
  - `frontend/app/report/demo-child-a/page.tsx`
  - `frontend/app/globals.css`
  - `frontend/tailwind.config.ts`

### AI / RAG
- Branch: `feat/ai-rag-core`
- Start with: Phase 1, then Phase 2, then Phase 7
- Owns:
  - `shared/types.ts`
  - `shared/api.ts`
  - pipeline-side extraction/schema logic as coordinated

### Backend
- Branch: `feat/backend-delivery`
- Start with: Phase 5, then Phase 8, then Phase 9
- Owns:
  - `backend/src/server.ts`
  - `backend/src/routes.ts`
  - `backend/src/service.ts`
  - `backend/src/ingestion/`
  - `backend/package.json`
  - `backend/README.md`
  - root integration docs

## Local development

Start the backend:

```bash
cd backend
npm install
npm run dev
```

In another terminal, start the frontend:

```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

Set in `frontend/.env.local`:

```text
BACKEND_BASE_URL=http://127.0.0.1:4000
```

If you are also running a local machine-level Postgres instance, keep the pipeline/container database on `5433` to avoid colliding with the default local `5432`.

## Local ingestion pipeline

The repo also contains a local Python ingestion pipeline for PostgreSQL-backed source ingestion and extraction.

Setup:

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

## Included surfaces

- `/` editorial landing page
- `/case/demo-child-a` evidence workbench
- `/report/demo-child-a` report-style evidence brief

## Included backend routes

- `GET /api/cases/:caseId`
- `GET /api/fragments?caseId=...`
- `POST /api/claims`
- `GET /api/report/:caseId`
- `GET /api/chart/trajectory/:caseId`
- `GET /api/ingestion/seed-sources`
- `GET /api/ingestion/source-documents`
- `GET /api/ingestion/document-chunks`
- `GET /api/ingestion/extraction-runs`
- `GET /api/ingestion/extracted-datapoints`
- `GET /api/ingestion/extraction-issues`
- `GET /health`

## Data handling

- The backend expects real ingestion data to be present in PostgreSQL.
- The app is review support only and does not provide diagnosis, treatment guidance, or approval recommendations.
- Production handling still requires de-identification review, encryption, auditability, and access controls.

## Key docs

- [docs/API_DOCUMENTATION.md](/c:/Users/risha/PiecesOfThem/docs/API_DOCUMENTATION.md:1)
- [docs/TEAM_SHEET.md](/c:/Users/risha/PiecesOfThem/docs/TEAM_SHEET.md:1)
- [docs/REPO_PHASES.md](/c:/Users/risha/PiecesOfThem/docs/REPO_PHASES.md:1)
- [docs/BRANCH_PLAN.md](/c:/Users/risha/PiecesOfThem/docs/BRANCH_PLAN.md:1)
