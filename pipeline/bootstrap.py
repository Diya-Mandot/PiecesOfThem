"""Bootstrap helpers for starting local pipeline dependencies."""

from __future__ import annotations

import subprocess
import time
from dataclasses import replace
from pathlib import Path

from .config import PipelineConfig
from .db import can_connect


def ensure_database(config: PipelineConfig) -> None:
    """Ensure the configured PostgreSQL database is reachable."""

    probe_config = replace(config, db_start_timeout_seconds=1)
    repo_root = Path(__file__).resolve().parent.parent

    if can_connect(probe_config):
        return

    subprocess.run(
        ["docker", "compose", "up", "-d", "postgres"],
        check=True,
        cwd=repo_root,
    )

    deadline = time.monotonic() + config.db_start_timeout_seconds
    while time.monotonic() < deadline:
        if can_connect(probe_config):
            return
        time.sleep(2)

    raise RuntimeError(
        "Timed out waiting for PostgreSQL to become reachable after starting "
        "docker compose service 'postgres'."
    )
