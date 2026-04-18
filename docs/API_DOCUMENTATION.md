# PiecesOfThem API Documentation

This document describes the current backend API implemented in `backend/`.

Base local URL:

```text
http://127.0.0.1:4000
```

Current API purpose:
- project real ingestion data into frontend-facing read models
- preserve citation lineage between claims and fragments
- expose case, fragment, claim, and report payloads over HTTP
- expose ingestion-schema-aligned admin records from both canonical evidence tables and legacy pipeline tables

## General Notes

- All responses are JSON.
- Error responses use this shape:

```json
{
  "error": "Message here"
}
```

- Current demo case ID:

```text
demo-child-a
```

- Current valid `SignalDomain` values:
  - `vocabulary`
  - `recognition`
  - `sleep`
  - `behavior`
  - `motor`

## API Surface Summary

The backend currently exposes two API layers:

1. App read-model endpoints
- used by the frontend demo
- shaped for the dashboard and evidence brief
- projected from canonical evidence tables:
  - `ingestion.evidence_fragments`
  - `ingestion.claims`
  - `ingestion.claim_fragments`

2. Ingestion/admin endpoints
- shaped to match the ingestion schema coming from the pipeline work
- intended for debugging, inspection, and reduced drift between backend contracts and the database model
- include canonical evidence tables and legacy pipeline tables

## Health Check

### `GET /health`

What it does:
- verifies that the backend server is running

Example:

```bash
curl http://127.0.0.1:4000/health
```

Response:

```json
{
  "status": "ok"
}
```

## Get Case

### `GET /api/cases/:caseId`

What it does:
- returns the case record and top-level metrics for a case
- this is used to initialize case-level context in the frontend

Path params:
- `caseId`: required case identifier

Example:

```bash
curl http://127.0.0.1:4000/api/cases/demo-child-a
```

Success response:

```json
{
  "caseRecord": {
    "id": "demo-child-a",
    "label": "Case A-17",
    "disease": "Sanfilippo Syndrome Type A",
    "therapy": "UX111 observational evidence brief",
    "observationStart": "2024-03-08",
    "observationEnd": "2026-02-11",
    "summary": "A de-identified observational case assembled from caregiver-style fragments to demonstrate how lived experience can surface functional stability signals over time.",
    "dataHandling": "Demo records are synthetic or de-identified and rendered locally to avoid restricted-data handling in the hackathon build.",
    "reviewWindow": "FDA resubmission accepted April 2, 2026. PDUFA date September 19, 2026."
  },
  "metrics": {
    "fragmentCount": 13,
    "claimCount": 3,
    "sourceTypes": [
      "Parent Journal",
      "Voice Memo",
      "Clinic Summary",
      "Forum Observation",
      "Caregiver Transcript"
    ]
  }
}
```

Error cases:
- `404` if the case is unknown

Example error:

```json
{
  "error": "Case not found"
}
```

## Get Fragments

### `GET /api/fragments`

What it does:
- returns evidence fragments for a case
- supports filtering by domain, year, and free-text query
- fragments are scored and sorted server-side

Query params:
- `caseId`: required
- `domain`: optional `SignalDomain`
- `year`: optional 4-digit year like `2024`
- `query`: optional free-text search term

Example:

```bash
curl "http://127.0.0.1:4000/api/fragments?caseId=demo-child-a&domain=vocabulary&year=2026"
```

Success response shape:

```json
{
  "fragments": [
    {
      "id": "FRG-2026-024",
      "caseId": "demo-child-a",
      "date": "2026-01-28",
      "sourceType": "Caregiver Transcript",
      "modality": "audio-transcript",
      "title": "Kitchen transcript",
      "excerpt": "Used six familiar nouns across a five-minute transcript with no observed reduction from last spring's home recordings.",
      "tags": ["vocabulary", "noun count", "comparison"],
      "signalDomain": "vocabulary",
      "deidentified": true,
      "confidence": "high",
      "rawRef": "Transcript / January 2026 / Segment 02"
    }
  ]
}
```

Error cases:
- `400` if `caseId` is missing
- `400` if `domain` is invalid
- `400` if `year` is not a 4-digit year
- `404` if the case is unknown

Example invalid domain error:

```json
{
  "error": "Invalid domain"
}
```

## Get Claims

### `POST /api/claims`

What it does:
- returns claims for a case
- can optionally filter claims by domain
- each claim preserves `fragmentIds` so lineage stays intact

Request body:

```json
{
  "caseId": "demo-child-a",
  "domain": "recognition"
}
```

Fields:
- `caseId`: required
- `domain`: optional `SignalDomain`

Example:

```bash
curl -X POST http://127.0.0.1:4000/api/claims \
  -H "Content-Type: application/json" \
  -d "{\"caseId\":\"demo-child-a\"}"
```

Success response shape:

```json
{
  "claims": [
    {
      "id": "CLM-VOCAB-STABLE",
      "caseId": "demo-child-a",
      "statement": "Expressive vocabulary appears preserved across the 2024 to early 2026 observation window, with repeated use of familiar nouns and short phrases in home settings.",
      "domain": "vocabulary",
      "trend": "stable",
      "confidence": "high",
      "fragmentIds": [
        "FRG-2024-031",
        "FRG-2024-067",
        "FRG-2025-051",
        "FRG-2026-024"
      ]
    }
  ]
}
```

Error cases:
- `400` if `caseId` is missing
- `400` if `domain` is invalid
- `404` if the case is unknown

Example missing case ID error:

```json
{
  "error": "Missing caseId"
}
```

## Get Report

### `GET /api/report/:caseId`

What it does:
- returns the full report payload for a case
- includes case metadata, report metrics, claims, and resolved citations
- this is the main report-generation API used by the frontend evidence brief

Path params:
- `caseId`: required case identifier

Example:

```bash
curl http://127.0.0.1:4000/api/report/demo-child-a
```

Success response shape:

```json
{
  "id": "demo-child-a",
  "label": "Case A-17",
  "disease": "Sanfilippo Syndrome Type A",
  "therapy": "UX111 observational evidence brief",
  "observationStart": "2024-03-08",
  "observationEnd": "2026-02-11",
  "summary": "A de-identified observational case assembled from caregiver-style fragments to demonstrate how lived experience can surface functional stability signals over time.",
  "dataHandling": "Demo records are synthetic or de-identified and rendered locally to avoid restricted-data handling in the hackathon build.",
  "reviewWindow": "FDA resubmission accepted April 2, 2026. PDUFA date September 19, 2026.",
  "metrics": {
    "fragmentCount": 13,
    "claimCount": 3,
    "modalities": 5,
    "domains": 4
  },
  "claims": [
    {
      "id": "CLM-RECOGNITION-STABLE",
      "caseId": "demo-child-a",
      "statement": "Recognition of primary caregivers and familiar voices remains intact across clinic and home evidence sources.",
      "domain": "recognition",
      "trend": "stable",
      "confidence": "high",
      "fragmentIds": [
        "FRG-2024-114",
        "FRG-2025-018",
        "FRG-2026-013",
        "FRG-2026-041"
      ],
      "citations": [
        {
          "id": "FRG-2024-114",
          "caseId": "demo-child-a",
          "date": "2024-08-03",
          "sourceType": "Clinic Summary",
          "modality": "summary",
          "title": "Neurodevelopment follow-up",
          "excerpt": "Family reports recognition of primary caregivers remains intact. Child initiates eye contact and responds to own nickname consistently.",
          "tags": ["recognition", "caregiver", "social"],
          "signalDomain": "recognition",
          "deidentified": true,
          "confidence": "high",
          "rawRef": "Clinic summary / August 2024"
        }
      ]
    }
  ]
}
```

Error cases:
- `404` if the report or case is unknown

Example error:

```json
{
  "error": "Report not found"
}
```

## Ingestion/Admin API

These endpoints mirror the ingestion schema rather than the frontend read model.

Canonical evidence coverage:
- `ingestion.evidence_fragments`
- `ingestion.claims`
- `ingestion.claim_fragments`

Legacy/debugging coverage:
- `ingestion.seed_sources`
- `ingestion.source_documents`
- `ingestion.document_chunks`
- `ingestion.extraction_runs`
- `ingestion.extracted_datapoints`
- `ingestion.extraction_issues`

Important:
- the product-facing app no longer projects from `ingestion.extracted_datapoints`
- `ingestion.extracted_datapoints` remains a transitional/debugging surface
- canonical product evidence now comes from `ingestion.evidence_fragments` and `ingestion.claims`

### `GET /api/ingestion/evidence-fragments`

What it does:
- returns canonical evidence-fragment records
- preserves chunk lineage through `chunk_ids`
- supports filtering by source document, case, domain, confidence, treatment status, and trial program

Supported query params:
- `source_document_id`
- `case_id`
- `signal_domain`
- `confidence`
- `treatment_status`
- `trial_program`

Example:

```bash
curl "http://127.0.0.1:4000/api/ingestion/evidence-fragments?case_id=PSS-003"
```

Success response shape:

```json
{
  "evidence_fragments": [
    {
      "id": 4,
      "external_id": "FRG-1",
      "case_id": "PSS-003",
      "source_document_id": 20,
      "fragment_date": "2025-11-27",
      "source_type": "Parent Journal",
      "modality": "text",
      "title": "Language signal described by caregiver",
      "excerpt": "He still says a few familiar words and sings along when prompted.",
      "tags_json": ["vocabulary", "retained language"],
      "signal_domain": "vocabulary",
      "confidence": "high",
      "raw_ref": "https://example.test/story#chunk-3",
      "treatment_status": "unknown",
      "treatment_basis": "seed_provenance",
      "trial_program": null,
      "intervention_class": null,
      "chunk_ids": [3],
      "created_at": "2026-04-18T00:00:00.000Z"
    }
  ],
  "total_count": 1
}
```

### `GET /api/ingestion/evidence-fragments/:id`

What it does:
- returns one canonical evidence-fragment record by numeric `id`

Error cases:
- `400` if the id is invalid
- `404` if the evidence fragment is unknown

### `GET /api/ingestion/claims`

What it does:
- returns canonical claim records
- preserves fragment lineage through embedded `fragment_ids`
- supports filtering by case, domain, trend, confidence, treatment status, and trial program

Supported query params:
- `case_id`
- `signal_domain`
- `trend`
- `confidence`
- `treatment_status`
- `trial_program`

Example:

```bash
curl "http://127.0.0.1:4000/api/ingestion/claims?case_id=PSS-003"
```

Success response shape:

```json
{
  "claims": [
    {
      "id": 5,
      "external_id": "CLM-1",
      "case_id": "PSS-003",
      "statement": "Language appears retained in family-reported observations.",
      "signal_domain": "vocabulary",
      "trend": "stable",
      "confidence": "high",
      "treatment_status": "unknown",
      "trial_program": null,
      "fragment_ids": ["FRG-1", "FRG-2"],
      "created_at": "2026-04-18T00:00:00.000Z"
    }
  ],
  "total_count": 1
}
```

### `GET /api/ingestion/claims/:id`

What it does:
- returns one canonical claim record by numeric `id`

Error cases:
- `400` if the id is invalid
- `404` if the claim is unknown

### `GET /api/ingestion/seed-sources`

What it does:
- returns seed-source records using field names aligned to the database schema
- mirrors the `ingestion.seed_sources` table shape
- reads from PostgreSQL

Supported query params:
- `kind`
- `disease_subtype`
- `trial_program`
- `comparison_use`
- `named_publicly`
- `confirmed_participation`

Boolean filters must be:
- `true`
- `false`

Example:

```bash
curl "http://127.0.0.1:4000/api/ingestion/seed-sources?kind=trial-participant&confirmed_participation=true"
```

Success response shape:

```json
{
  "seed_sources": [
    {
      "id": null,
      "seed_id": "TPS-001",
      "kind": "trial-participant",
      "label": "Eliza O'Neill",
      "source_urls": [
        "https://dnascience.plos.org/2016/05/19/eliza-gets-her-gene-therapy/"
      ],
      "platform": "multi-source",
      "access": "public",
      "subject_label": "Eliza O'Neill",
      "child_age_signal": "child",
      "disease_subtype": "MPS IIIA",
      "trial_program": "UX111-ABO-102",
      "intervention_class": "gene-therapy",
      "source_confidence": "confirmed",
      "named_publicly": true,
      "confirmed_participation": true,
      "source_type": "trial-linked-public-story",
      "author_role": "mixed",
      "symptom_domains": [
        "speech-language",
        "mobility",
        "diagnosis-journey",
        "sleep"
      ],
      "temporal_signal": "longitudinal",
      "extraction_value": "high",
      "scrape_difficulty": "medium",
      "consent_risk": "medium",
      "comparison_use": "primary",
      "evidence_summary": "Public sources explicitly identify Eliza O'Neill as the first child treated in the Phase 1/2 Abeona trial that became ABO-102 and later UX111.",
      "notes": "Best named public UX111-linked child for narrative extraction, longitudinal milestone mapping, and baseline-versus-follow-up comparisons.",
      "created_at": null,
      "updated_at": null
    }
  ],
  "total_count": 6
}
```

### `GET /api/ingestion/seed-sources/:seedId`

What it does:
- returns one seed-source record by `seed_id`
- preserves the ingestion-schema-aligned field names

Example:

```bash
curl http://127.0.0.1:4000/api/ingestion/seed-sources/TPS-001
```

Success response shape:

```json
{
  "seed_source": {
    "id": null,
    "seed_id": "TPS-001",
    "kind": "trial-participant",
    "label": "Eliza O'Neill",
    "source_urls": [
      "https://dnascience.plos.org/2016/05/19/eliza-gets-her-gene-therapy/"
    ],
    "platform": "multi-source",
    "access": "public",
    "subject_label": "Eliza O'Neill",
    "child_age_signal": "child",
    "disease_subtype": "MPS IIIA",
    "trial_program": "UX111-ABO-102",
    "intervention_class": "gene-therapy",
    "source_confidence": "confirmed",
    "named_publicly": true,
    "confirmed_participation": true,
    "source_type": "trial-linked-public-story",
    "author_role": "mixed",
    "symptom_domains": [
      "speech-language",
      "mobility",
      "diagnosis-journey",
      "sleep"
    ],
    "temporal_signal": "longitudinal",
    "extraction_value": "high",
    "scrape_difficulty": "medium",
    "consent_risk": "medium",
    "comparison_use": "primary",
    "evidence_summary": "Public sources explicitly identify Eliza O'Neill as the first child treated in the Phase 1/2 Abeona trial that became ABO-102 and later UX111.",
    "notes": "Best named public UX111-linked child for narrative extraction, longitudinal milestone mapping, and baseline-versus-follow-up comparisons.",
    "created_at": null,
    "updated_at": null
  }
}
```

Error cases:
- `404` if the seed source is unknown

Example error:

```json
{
  "error": "Seed source not found"
}
```

## Core Data Objects

### `CaseRecord`

Represents top-level case metadata.

Fields:
- `id`
- `label`
- `disease`
- `therapy`
- `observationStart`
- `observationEnd`
- `summary`
- `dataHandling`
- `reviewWindow`

### `EvidenceFragment`

Represents one source-backed evidence unit.

Fields:
- `id`
- `caseId`
- `date`
- `sourceType`
- `modality`
- `title`
- `excerpt`
- `tags`
- `signalDomain`
- `deidentified`
- `confidence`
- `rawRef`

### `Claim`

Represents a synthesized conclusion backed by fragment lineage.

Fields:
- `id`
- `caseId`
- `statement`
- `domain`
- `trend`
- `confidence`
- `fragmentIds`

### `SeedSourceRecord`

Represents the API shape aligned to `ingestion.seed_sources`.

Fields:
- `id`
- `seed_id`
- `kind`
- `label`
- `source_urls`
- `platform`
- `access`
- `subject_label`
- `child_age_signal`
- `disease_subtype`
- `trial_program`
- `intervention_class`
- `source_confidence`
- `named_publicly`
- `confirmed_participation`
- `source_type`
- `author_role`
- `symptom_domains`
- `temporal_signal`
- `extraction_value`
- `scrape_difficulty`
- `consent_risk`
- `comparison_use`
- `evidence_summary`
- `notes`
- `created_at`
- `updated_at`

### Other ingestion records

The ingestion/admin API also returns schema-aligned records for:
- `SourceDocumentRecord`
- `DocumentChunkRecord`
- `ExtractionRunRecord`
- `EvidenceFragmentRecord`
- `ClaimRecord`
- `ExtractedDatapointRecord` (legacy/debugging)
- `ExtractionIssueRecord`

## Current Frontend Usage

The frontend currently uses the backend like this:
- case dashboard page fetches case, fragments, and claims
- case dashboard page also fetches chart trajectory data
- report page fetches report payload
- dashboard filtering remains client-side after initial hydration

Current frontend client:
- `frontend/lib/api.ts`

## Local Usage Summary

Start backend:

```bash
cd backend
npm install
npm run dev
```

Start frontend:

```bash
cd frontend
npm install
copy .env.example .env.local
```

Set in `frontend/.env.local`:

```text
BACKEND_BASE_URL=http://127.0.0.1:4000
```

Then run:

```bash
npm run dev
```

Important:
- the backend no longer seeds synthetic fixture data
- case/report/read-model endpoints will only return data once the ingestion tables contain real rows for the projected case IDs
