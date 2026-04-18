# Backend

This is the active backend runtime for PiecesOfThem.

Current responsibilities:
- own the API surface
- project canonical evidence-table rows into case, fragment, claim, chart, and report read models
- preserve citation lineage
- provide the future home for ingestion, scraping, and RAG orchestration

## Local development

```bash
cd backend
npm install
npm run dev
```

Default local address:
- `http://127.0.0.1:4000`

Current routes:
- `GET /api/cases/:caseId`
- `GET /api/fragments?caseId=...`
- `POST /api/claims`
- `GET /api/report/:caseId`
- `GET /api/chart/trajectory/:caseId`
- `GET /api/ingestion/seed-sources`
- `GET /api/ingestion/source-documents`
- `GET /api/ingestion/document-chunks`
- `GET /api/ingestion/extraction-runs`
- `GET /api/ingestion/evidence-fragments`
- `GET /api/ingestion/evidence-fragments/:id`
- `GET /api/ingestion/claims`
- `GET /api/ingestion/claims/:id`
- `GET /api/ingestion/extracted-datapoints`
- `GET /api/ingestion/extraction-issues`
- `GET /health`

Note:
- this backend no longer loads synthetic fixtures
- it expects the ingestion schema tables in PostgreSQL to be populated by the real pipeline
- product-facing routes are projected from `ingestion.evidence_fragments`, `ingestion.claims`, and `ingestion.claim_fragments`
- `ingestion.extracted_datapoints` remains available through ingestion/admin endpoints as a legacy debugging surface
