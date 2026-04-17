"""Command-line entrypoint for the local ingestion pipeline."""

from __future__ import annotations

import argparse
from pathlib import Path

from pipeline.bootstrap import ensure_database
from pipeline.chunking import chunk_pending_documents
from pipeline.config import load_config
from pipeline.db import run_sql_file
from pipeline.seeds import sync_seed_catalog

INIT_SQL_PATH = Path(__file__).resolve().parent / "sql" / "init.sql"


def build_parser() -> argparse.ArgumentParser:
    """Build the CLI parser for pipeline commands."""

    parser = argparse.ArgumentParser(
        description="PiecesOfThem local ingestion pipeline"
    )
    parser.add_argument(
        "command",
        choices=[
            "ensure-db",
            "init-db",
            "sync-seeds",
            "scrape",
            "extract",
            "run-all",
        ],
    )
    return parser


def main() -> None:
    """Dispatch the requested pipeline command."""

    parser = build_parser()
    args = parser.parse_args()
    config = load_config()

    if args.command == "ensure-db":
        ensure_database(config)
        print("database-ready")
        return

    if args.command == "init-db":
        run_sql_file(config, INIT_SQL_PATH)
        print("schema-ready")
        return

    if args.command == "sync-seeds":
        count = sync_seed_catalog(config)
        print(f"seed-count={count}")
        return

    if args.command == "scrape":
        from pipeline.scrape import scrape_seed_sources

        count = scrape_seed_sources(config)
        print(f"scraped={count}")
        return

    if args.command == "extract":
        from pipeline.extract import run_extraction

        chunk_pending_documents(config)
        count = run_extraction(config)
        print(f"datapoints={count}")
        return

    if args.command == "run-all":
        from pipeline.extract import run_extraction
        from pipeline.scrape import scrape_seed_sources

        ensure_database(config)
        run_sql_file(config, INIT_SQL_PATH)
        sync_seed_catalog(config)
        scrape_seed_sources(config)
        chunk_pending_documents(config)
        datapoints = run_extraction(config)
        print(f"run-all-complete datapoints={datapoints}")
        return


if __name__ == "__main__":
    main()
