# PiecesOfThem

PiecesOfThem is an agentic RAG platform designed to rescue Sanfilippo Syndrome gene therapy from regulatory limbo by converting unstructured patient narratives into clinical-grade real-world evidence ahead of the September 19, 2026 FDA PDUFA date.

## Mission

Children with Sanfilippo Syndrome, often described as "Childhood Alzheimer's," progressively lose speech, memory, recognition, and core aspects of identity. The FDA is reviewing UX111, a potentially life-saving gene therapy, but conventional lab and biomarker data do not fully capture "cognitive stability": the small but meaningful signs that a child is retaining abilities the natural history of the disease predicts they should lose.

PiecesOfThem exists to surface those missing signals. It transforms fragmented parent observations, voice memos, community posts, and journals into structured, traceable evidence that can support regulatory decision-making before the September 2026 deadline.

## Problem Statement

The current evidence gap is not a lack of human data. It is a lack of usable human evidence.

Thousands of relevant observations already exist in unstructured form:
- voice memos from parents and caregivers
- Reddit and Discord posts
- scanned notes and journals
- informal logs of sleep, recognition, language, and behavior

These fragments contain clinically meaningful indicators of retained function, but they are effectively invisible to regulators unless they can be:
- ingested safely
- de-identified appropriately
- normalized into consistent evidence units
- traced back to source material
- synthesized into a format aligned with FDA expectations

PiecesOfThem bridges that gap.

## System Overview

The platform is organized into four layers: ingestion, reasoning, presentation, and regulatory output.

### 1. Ingestion Layer: The Fragments

PiecesOfThem acts as a sovereign intake system for parents, caregivers, and advocacy organizations.

Core capabilities:
- Multimodal ingestion of pediatric voice memos, online support community posts, and scanned written records
- Speech-to-text processing for audio fragments
- OCR and normalization for handwritten or scanned materials
- Metadata capture for timeline, author role, symptom area, and confidence
- Privacy-aware processing and de-identification workflows

Unlike generic RAG systems, the platform does not chunk by arbitrary token or character length. It chunks by life milestone and disease-relevant function, such as:
- language retention
- sleep quality
- name recognition
- emotional recognition
- mobility stability
- routine continuity

These become the foundational "Pieces" used throughout the system.

### 2. Engine: Agentic Temporal RAG

This is the core reasoning layer.

The retrieval system is temporal, not just semantic. It compares baseline observations from earlier periods, such as 2024, with later observations, such as 2026, to detect stability signals: retained functions that would be expected to decline under the natural history of Sanfilippo Syndrome.

Core capabilities:
- Temporal search across longitudinal patient narratives
- Hybrid retrieval using vector similarity plus BM25 keyword search
- Mapping of parent language into regulatory and clinical concepts
- Source-grounded synthesis with claim re-verification
- Bias review for population representation and evidence skew

Specialized agents:

#### The Synthesizer Agent

The Synthesizer translates human observations into structured evidence aligned with regulatory language. For example:
- "He remembered the dog's name" can be mapped to functional cognitive persistence
- "She still recognizes her bedtime routine" can be mapped to retained daily-function continuity

This agent organizes observations into evidence categories that support patient-focused drug evaluation.

#### The Auditor Agent

The Auditor re-checks every generated claim against source fragments and supporting records. Its purpose is to reduce hallucination risk and preserve regulatory trust by ensuring:
- every conclusion is source-backed
- every summary has citation lineage
- unsupported claims are rejected or downgraded

#### The Bias Critic

The Bias Critic flags demographic, geographic, linguistic, and participation imbalances that may distort conclusions. This supports defensible evidence generation and alignment with emerging Good AI Practice expectations.

### 3. Dashboard: The Mosaic UI

The interface is designed as an editorial, minimalist evidence workspace rather than a generic health dashboard.

Visual direction:
- Petal Pink, Sage, and Sand palette
- clean typography with an institutional but empathetic tone
- generous spacing and low-noise layout
- data presentation that feels precise, human, and review-ready

Primary experiences:

#### The Mosaic View

The homepage presents evidence as a mosaic of de-identified "Pieces": a remembered word, a sleep log, a laugh, a recognition event, or a daily routine marker. Selecting a piece reveals:
- where it sits on the child timeline
- what function it supports
- how it contributes to a stability assessment

#### The Stability Chart

Each piece can be located within a clinical timeline showing retained versus lost abilities across time. This allows reviewers to move from human story to structured evidence without losing provenance.

#### The Contrast Toggle

The UI can overlay the observed cohort trajectory against natural history decline. This makes the intended signal legible:
- expected decline under untreated disease
- retained function in the treated or observed cohort

The contrast is designed to make cognitive stability visible and defensible.

### 4. Regulatory Output: The Evidence Package

The end product is not just insight. It is a submission-grade evidence package.

With one action, the platform should generate a high-fidelity dossier suitable for regulatory review, including:
- longitudinal summaries
- visual evidence charts
- stability signal explanations
- cohort-level comparisons
- source-linked citations
- de-identification protections

This dossier is intended to support the September 19, 2026 review deadline and provide regulators with the missing patient-centered evidence that traditional trial outputs fail to show.

## Key Technical Features

### Temporal RAG

The system retrieves evidence across time, not just by topical similarity. This is essential for proving retention rather than merely describing a current state.

### Hybrid Search

Vector search captures semantic similarity and patient-speak. BM25 preserves precision for specific medical terms, symptoms, and named concepts. Together they improve retrieval quality across clinical and informal language.

### Life-Milestone Chunking

Fragments are grouped around meaningful events and functional domains rather than arbitrary token boundaries, improving downstream reasoning and citation quality.

### Citation Lineage

Every chart, claim, and summary must be traceable to de-identified raw evidence. The system should preserve a complete audit trail from final statement back to underlying fragments.

### Privacy and De-Identification

The platform should be designed to align with relevant de-identification and data-governance requirements, including HIPAA-oriented guidance and applicable state-level handling rules where required.

### Regulatory Trust

The platform should optimize for evidence defensibility, not just model fluency. Retrieval quality, verification, provenance, and controlled summarization are core product requirements.

## Product Goal

PiecesOfThem aims to give the FDA the missing pieces of evidence required to evaluate Sanfilippo gene therapy with a fuller view of real patient outcomes.

The objective is to transform scattered human narratives into credible real-world evidence that can help turn a regulatory "maybe" into a justified "yes" for affected children and families before the September 2026 deadline.

## Reference Points

These sources anchor the regulatory and policy framing described above:

- FDA CDER Patient-Focused Drug Development:
  https://www.fda.gov/drugs/development-approval-process-drugs/cder-patient-focused-drug-development
- FDA PFDD guidance series:
  https://www.fda.gov/drugs/development-approval-process-drugs/fda-patient-focused-drug-development-guidance-series-enhancing-incorporation-patients-voice-medical
- HHS de-identification guidance:
  https://www.hhs.gov/hipaa/for-professionals/privacy/special-topics/de-identification/index.html
- Utah Rule R4-004C:
  https://regulations.utah.edu/it/rules/Rule4-004C.php
- UX111 BLA resubmission acceptance and September 19, 2026 PDUFA reporting:
  https://www.biospace.com/press-releases/ultragenyx-announces-u-s-fda-acceptance-of-bla-resubmission-for-ux111-aav-gene-therapy-to-treat-sanfilippo-syndrome-type-a-mps-iiia

## Working Principle

If regulators cannot see the human evidence, they cannot act on it.

PiecesOfThem is built to make those hidden signals visible, structured, auditable, and impossible to ignore.

## Delivery Plan And Ownership

Development is split across three contributors with clear phase boundaries and file ownership to reduce overlap and merge risk.

### Person 1: Frontend-Only Phases

Assigned phases:
- Phase 3: Landing page
- Phase 4: Case dashboard
- Phase 6: Evidence brief

Owned files:
- `frontend/app/page.tsx`
- `frontend/components/landing-page.tsx`
- `frontend/app/case/demo-child-a/page.tsx`
- `frontend/components/dashboard-shell.tsx`
- `frontend/app/report/demo-child-a/page.tsx`
- `frontend/components/report-page.tsx`
- `frontend/app/globals.css`
- `frontend/tailwind.config.ts`

### Person 2: AI / RAG-Only Phases

Assigned phases:
- Phase 1: Contracts and schema
- Phase 2: Demo data and retrieval core
- Phase 7: AI / RAG enhancement

Owned files:
- `shared/types.ts`
- `shared/api.ts`

### Person 3: Backend-Only Phases

Assigned phases:
- Phase 5: Integration and lineage delivery
- Phase 8: Runtime and delivery hardening
- Phase 9: Repo/demo packaging

## Repo Purpose

This repository exists to demonstrate a credible agentic RAG system for synthesizing de-identified patient narratives into longitudinal, citation-backed regulatory evidence for Sanfilippo Syndrome.

The codebase should always optimize for three outcomes:
- evidence clarity
- source traceability
- review-ready presentation

## Working Rules

All contributors and agents should follow these rules:
- Do not invent patient facts, timelines, or outcomes that are not present in source data.
- Do not produce summaries without preserving citation lineage to underlying evidence pieces.
- Do not weaken de-identification or reintroduce personally identifying information for realism.
- Do not optimize for polished prose at the cost of factual grounding.
- Do not edit files outside your owned area unless coordination is explicit.
- Do not break the demo flow across landing page, case dashboard, and report routes.
- Prefer simple, inspectable logic over opaque abstractions.
- Prefer deterministic demo behavior over speculative AI behavior.

## Build Priorities

When tradeoffs appear, prioritize in this order:

1. Provenance and lineage correctness
2. De-identification and safe handling of patient-derived material
3. Temporal reasoning fidelity
4. Demo stability and predictable rendering
5. UI polish and animation
6. Abstraction and extensibility

This is a regulatory-evidence product first and a design artifact second.

## Architecture Map

The repository should be treated as three cooperating layers.

### Frontend Layer

Primary responsibility:
- public landing experience
- case dashboard experience
- evidence brief presentation
- visual encoding of evidence, retention, and contrast against natural history

Primary files:
- `frontend/app/page.tsx`
- `frontend/components/landing-page.tsx`
- `frontend/app/case/demo-child-a/page.tsx`
- `frontend/components/dashboard-shell.tsx`
- `frontend/app/report/demo-child-a/page.tsx`
- `frontend/components/report-page.tsx`
- `frontend/app/globals.css`
- `frontend/tailwind.config.ts`

Frontend guidance:
- The interface should feel editorial, clinical, and calm.
- Visual hierarchy should support evidence review, not marketing noise.
- Every displayed claim should appear grounded in a visible piece of evidence or structured derived metric.

### AI / RAG Layer

Primary responsibility:
- type contracts
- retrieval-ready demo data
- temporal reasoning logic
- evidence scoring, grouping, and synthesis support

Primary files:
- `shared/types.ts`
- `shared/api.ts`

AI / RAG guidance:
- Retrieval logic must preserve time awareness.
- View models should be derived from source-shaped data, not hand-waved UI placeholders.
- Any synthesized statement must be explainable from source fragments and transformation rules.

### Backend / Delivery Layer

Primary responsibility:
- integration wiring
- lineage delivery
- report generation support
- runtime hardening
- demo packaging

Backend guidance:
- Integration code should preserve identifiers and traceability across transformations.
- Delivery paths must make it easy to inspect how a visible report artifact was produced.
- Packaging should favor reproducibility and low-friction demo setup.

Current runtime note:
- the backend API surface lives in `backend/src/`
- the frontend consumes backend data through `frontend/lib/api.ts`
- shared contracts live in `shared/`

## Definition Of Done

A phase or feature is not done unless the following are true:
- the relevant route renders without broken imports or missing data
- the feature respects file ownership and architectural boundaries
- displayed evidence can be traced to source fragments or explicit derived logic
- no claim in the UI implies unsupported clinical certainty
- de-identified demo content remains de-identified throughout the flow
- types remain coherent across raw data, derived logic, and rendered views
- the demo tells a consistent story from intake to dashboard to report

For evidence-specific features, done also means:
- the user can inspect why a conclusion appears
- the conclusion reflects temporal change or stability, not just topical mention
- citation lineage is visible or programmatically recoverable

## Design Constraints

The visual system should follow these constraints:
- Editorial minimalist tone, not startup-generic or consumer-health glossy
- Palette centered on Petal Pink, Sage, Sand, and related neutrals
- Typography should feel institutional and humane
- White space should support reading and comparison
- Charts should emphasize retained function and contrast against expected decline
- Motion should be subtle and purposeful, never decorative
- Mobile and desktop should both remain legible and composed

## Data Rules

The demo data model should follow these rules:
- Each evidence piece should represent a meaningful life milestone, retained function, or disease-relevant observation.
- Time must be first-class metadata.
- Derived insights should distinguish between observed evidence, inferred grouping, and synthesized summary.
- Natural history comparisons must be labeled clearly as comparative context, not direct patient observation.
- Source text should remain accessible enough for audit, while respecting de-identification constraints.

Recommended evidence categories include:
- language retention
- recognition
- sleep quality
- routine continuity
- emotional response
- mobility stability
- caregiver-observed cognitive persistence

## Collaboration Rules

Coordination standards:
- Frontend contributors should not reshape core data contracts unilaterally.
- AI / RAG contributors should not hardcode presentation-specific assumptions into domain logic unless documented in view types.
- Backend contributors should preserve lineage metadata rather than flattening it away during integration.
- If work requires crossing ownership boundaries, document the dependency in the PR or handoff notes before editing.
- Shared vocabulary should remain consistent across UI, logic, and report output.

## Non-Negotiables

The project should never compromise these principles:
- no fabricated evidence
- no broken lineage
- no hidden transformation from source to claim
- no identifiable patient details in demo output
- no design choices that obscure the evidentiary argument
