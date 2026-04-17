# Seed Catalog

This file documents the normalized seed ingestion schema that combines:

- general public discovery sources
- trial-linked participant sources

## Purpose

The app now has one normalized catalog shape for upstream ingestion experiments, while still preserving:

- whether a record is a general public source or a trial-linked participant
- whether trial participation is confirmed
- whether a child is publicly named
- whether the source is aggregate-only or anonymized

## Data location

Normalized records live in [lib/seed-catalog.ts](/D:/Repos/PiecesOfThem/lib/seed-catalog.ts).

## Key fields

- `kind`
- `label`
- `sourceUrls`
- `subjectLabel`
- `diseaseSubtype`
- `trialProgram`
- `interventionClass`
- `sourceConfidence`
- `namedPublicly`
- `confirmedParticipation`
- `symptomDomains`
- `temporalSignal`
- `consentRisk`
- `comparisonUse`
- `evidenceSummary`

## Guidance

- Use `kind="public-source"` for discovery and source-mining workflows.
- Use `kind="trial-participant"` for comparison logic against treatment-linked narratives.
- Never treat `aggregate-only` or `likely-anonymized` records as named individuals in UI or reporting.
