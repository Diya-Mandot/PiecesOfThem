"""Seed catalog loading and database synchronization helpers."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from .config import PipelineConfig
from .db import connect

_SEED_CATALOG_PATH = Path(__file__).resolve().parent.parent / "data" / "seed-catalog.json"


def load_seed_catalog() -> list[dict[str, Any]]:
    """Load and parse the checked-in normalized seed catalog."""

    return json.loads(_SEED_CATALOG_PATH.read_text(encoding="utf-8"))


def sync_seed_catalog(config: PipelineConfig) -> int:
    """Synchronize all seed records into ``ingestion.seed_sources``."""

    from psycopg.types.json import Jsonb

    seeds = load_seed_catalog()
    seed_ids = [seed["id"] for seed in seeds]

    with connect(config) as connection:
        with connection.cursor() as cursor:
            for seed in seeds:
                cursor.execute(
                    """
                    INSERT INTO ingestion.seed_sources (
                      seed_id, kind, label, source_urls, platform, access, subject_label,
                      child_age_signal, disease_subtype, trial_program, intervention_class,
                      source_confidence, named_publicly, confirmed_participation, source_type,
                      author_role, symptom_domains, temporal_signal, extraction_value,
                      scrape_difficulty, consent_risk, comparison_use, evidence_summary, notes
                    )
                    VALUES (
                      %(id)s, %(kind)s, %(label)s, %(sourceUrls)s, %(platform)s, %(access)s, %(subjectLabel)s,
                      %(childAgeSignal)s, %(diseaseSubtype)s, %(trialProgram)s, %(interventionClass)s,
                      %(sourceConfidence)s, %(namedPublicly)s, %(confirmedParticipation)s, %(sourceType)s,
                      %(authorRole)s, %(symptomDomains)s, %(temporalSignal)s, %(extractionValue)s,
                      %(scrapeDifficulty)s, %(consentRisk)s, %(comparisonUse)s, %(evidenceSummary)s, %(notes)s
                    )
                    ON CONFLICT (seed_id) DO UPDATE SET
                      kind = EXCLUDED.kind,
                      label = EXCLUDED.label,
                      source_urls = EXCLUDED.source_urls,
                      platform = EXCLUDED.platform,
                      access = EXCLUDED.access,
                      subject_label = EXCLUDED.subject_label,
                      child_age_signal = EXCLUDED.child_age_signal,
                      disease_subtype = EXCLUDED.disease_subtype,
                      trial_program = EXCLUDED.trial_program,
                      intervention_class = EXCLUDED.intervention_class,
                      source_confidence = EXCLUDED.source_confidence,
                      named_publicly = EXCLUDED.named_publicly,
                      confirmed_participation = EXCLUDED.confirmed_participation,
                      source_type = EXCLUDED.source_type,
                      author_role = EXCLUDED.author_role,
                      symptom_domains = EXCLUDED.symptom_domains,
                      temporal_signal = EXCLUDED.temporal_signal,
                      extraction_value = EXCLUDED.extraction_value,
                      scrape_difficulty = EXCLUDED.scrape_difficulty,
                      consent_risk = EXCLUDED.consent_risk,
                      comparison_use = EXCLUDED.comparison_use,
                      evidence_summary = EXCLUDED.evidence_summary,
                      notes = EXCLUDED.notes,
                      updated_at = NOW()
                    """,
                    {
                        **seed,
                        "sourceUrls": Jsonb(seed["sourceUrls"]),
                        "symptomDomains": Jsonb(seed["symptomDomains"]),
                    },
                )
            cursor.execute(
                """
                DELETE FROM ingestion.seed_sources
                WHERE seed_id <> ALL(%s)
                """,
                (seed_ids,),
            )
        connection.commit()

    return len(seeds)
