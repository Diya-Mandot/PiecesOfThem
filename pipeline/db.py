"""Database helpers for the ingestion pipeline."""

from __future__ import annotations

from pathlib import Path
from typing import TYPE_CHECKING, Any

from .config import PipelineConfig

if TYPE_CHECKING:
    import psycopg


def build_dsn(config: PipelineConfig) -> str:
    """Build a libpq-style DSN for the configured PostgreSQL instance."""

    import psycopg

    return psycopg.conninfo.make_conninfo(
        host=config.postgres_host,
        port=config.postgres_port,
        dbname=config.postgres_db,
        user=config.postgres_user,
        password=config.postgres_password,
    )


def connect(config: PipelineConfig):
    """Create a psycopg connection for the configured database."""

    import psycopg

    return psycopg.connect(
        host=config.postgres_host,
        port=config.postgres_port,
        dbname=config.postgres_db,
        user=config.postgres_user,
        password=config.postgres_password,
        connect_timeout=config.db_start_timeout_seconds,
    )


def can_connect(config: PipelineConfig) -> bool:
    """Return whether the database accepts a simple query."""

    import psycopg

    try:
        with connect(config) as connection:
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
                cursor.fetchone()
    except psycopg.Error:
        return False
    return True


def run_sql_file(config: PipelineConfig, sql_path: str | Path) -> None:
    """Execute the SQL file at *sql_path* and commit the transaction."""

    sql_file = Path(sql_path)
    with connect(config) as connection:
        with connection.cursor() as cursor:
            cursor.execute(sql_file.read_text(encoding="utf-8"))
        connection.commit()
