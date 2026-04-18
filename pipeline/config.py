"""Configuration loading for the ingestion pipeline."""

from __future__ import annotations

import os
from dataclasses import dataclass


@dataclass(frozen=True, slots=True)
class PipelineConfig:
    """Typed settings used by the pipeline."""

    postgres_host: str
    postgres_port: int
    postgres_db: str
    postgres_user: str
    postgres_password: str
    openai_api_key: str
    openai_model: str
    db_start_timeout_seconds: int
    chunk_target_chars: int
    chunk_overlap_chars: int
    scraper_user_agent: str


def _env_int(name: str, default: str) -> int:
    return int(os.getenv(name, default))


def _load_environment() -> None:
    from dotenv import load_dotenv

    load_dotenv(override=True)


def load_config() -> PipelineConfig:
    """Load pipeline configuration from environment variables."""

    _load_environment()

    return PipelineConfig(
        postgres_host=os.getenv("POSTGRES_HOST", "127.0.0.1"),
        postgres_port=_env_int("POSTGRES_PORT", "5432"),
        postgres_db=os.getenv("POSTGRES_DB", "piecesofthem"),
        postgres_user=os.getenv("POSTGRES_USER", "pieces"),
        postgres_password=os.getenv("POSTGRES_PASSWORD", "pieces"),
        openai_api_key=os.getenv("OPENAI_API_KEY", ""),
        openai_model=os.getenv("OPENAI_MODEL", "gpt-5.4-mini"),
        db_start_timeout_seconds=_env_int("PIPELINE_DB_START_TIMEOUT_SECONDS", "45"),
        chunk_target_chars=_env_int("PIPELINE_CHUNK_TARGET_CHARS", "2000"),
        chunk_overlap_chars=_env_int("PIPELINE_CHUNK_OVERLAP_CHARS", "200"),
        scraper_user_agent=os.getenv(
            "PIPELINE_SCRAPER_USER_AGENT",
            "PiecesOfThemHackathonBot/0.1",
        ),
    )
