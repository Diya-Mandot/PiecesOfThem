# PiecesOfThem

PiecesOfThem is a premium frontend prototype for assembling de-identified lived-experience fragments into a reviewer-friendly evidence ledger for Sanfilippo syndrome.

## Local development

```bash
npm install
npm run dev
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
