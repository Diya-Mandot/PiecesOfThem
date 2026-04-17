# Local Ingestion Pipeline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a local-only Python pipeline that boots Postgres with Docker Compose, ingests normalized source seeds, deterministically scrapes and chunks source text into an `ingestion` schema, and runs an LLM extraction pass that stores validated datapoint candidates for later mapping into the app model.

**Architecture:** The pipeline is a standalone Python package under `pipeline/` with a CLI entrypoint and an idempotent SQL bootstrap script. Postgres is the source of truth: raw source metadata, fetched documents, deterministic chunks, extraction runs, and extracted datapoints all live in the `ingestion` schema, while the scraper reads from a checked-in JSON export of the normalized seed catalog rather than parsing TypeScript directly.

**Tech Stack:** Python 3.11+, Docker Compose, PostgreSQL 16, `psycopg`, `requests`, `beautifulsoup4`, `pydantic`, `python-dotenv`, OpenAI Responses API

---

## File Structure

### New files

- `docker-compose.yml`
  - local Postgres service with a named volume and health check
- `.env.example`
  - local environment template for DB and OpenAI configuration
- `data/seed-catalog.json`
  - stable JSON export of the normalized seed catalog for Python ingestion
- `pipeline/__init__.py`
  - package marker
- `pipeline/main.py`
  - CLI entrypoint and subcommand dispatch
- `pipeline/config.py`
  - environment-backed config loading
- `pipeline/db.py`
  - connection helpers and idempotent SQL execution
- `pipeline/bootstrap.py`
  - DB reachability check and Docker Compose startup logic
- `pipeline/seeds.py`
  - load JSON seed catalog and sync records into `ingestion.seed_sources`
- `pipeline/scrape.py`
  - deterministic fetch, text normalization, and `source_documents` writes
- `pipeline/chunking.py`
  - deterministic paragraph-aware chunking and `document_chunks` writes
- `pipeline/extract.py`
  - extraction run orchestration, schema validation, and datapoint inserts
- `pipeline/models.py`
  - Pydantic models for extraction input and output schema
- `pipeline/prompts/extraction_prompt.md`
  - versioned extraction prompt template
- `pipeline/sql/init.sql`
  - ingestion schema and table DDL
- `requirements.txt`
  - Python dependency manifest
- `README.md`
  - updated local setup and pipeline usage docs

### Existing files to modify

- `lib/seed-catalog.ts`
  - confirm fields needed by the JSON export
- `docs/superpowers/specs/2026-04-17-local-ingestion-pipeline-design.md`
  - no functional changes expected; reference only if clarifications become necessary

### Optional test files

- `tests/test_chunking.py`
- `tests/test_scrape_normalization.py`
- `tests/test_seed_sync.py`
- `tests/test_extraction_models.py`

The repo currently has no Python test harness, so we can either add lightweight `pytest` coverage now or keep the hackathon scope to CLI verification. The recommended path below includes a few focused tests because chunking and extraction-schema validation are easy to regress.

## Task 1: Add local runtime scaffolding

**Files:**
- Create: `requirements.txt`
- Create: `.env.example`
- Create: `pipeline/__init__.py`
- Modify: `README.md`

- [ ] **Step 1: Write the failing setup expectation in the plan notes**

We expect the repo to be missing Python dependency and environment scaffolding. The first verification command should fail before files exist.

Run:

```powershell
Test-Path requirements.txt
Test-Path .env.example
Test-Path pipeline/__init__.py
```

Expected:

```text
False
False
False
```

- [ ] **Step 2: Create `requirements.txt`**

```text
psycopg[binary]==3.2.1
requests==2.32.3
beautifulsoup4==4.12.3
pydantic==2.9.2
python-dotenv==1.0.1
openai==1.51.0
pytest==8.3.3
```

- [ ] **Step 3: Create `.env.example`**

```env
POSTGRES_HOST=127.0.0.1
POSTGRES_PORT=5432
POSTGRES_DB=piecesofthem
POSTGRES_USER=pieces
POSTGRES_PASSWORD=pieces
OPENAI_API_KEY=
OPENAI_MODEL=gpt-5.4-mini
PIPELINE_DB_START_TIMEOUT_SECONDS=45
PIPELINE_CHUNK_TARGET_CHARS=2000
PIPELINE_CHUNK_OVERLAP_CHARS=200
PIPELINE_SCRAPER_USER_AGENT=PiecesOfThemHackathonBot/0.1
```

- [ ] **Step 4: Create `pipeline/__init__.py`**

```python
"""Local ingestion pipeline package for PiecesOfThem."""
```

- [ ] **Step 5: Update `README.md` with a short pipeline section**

Add a new section after the existing local development instructions:

```md
## Local ingestion pipeline

The repo also contains a local-only Python ingestion pipeline for hackathon exploration.

### Setup

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
```

### Commands

```bash
python -m pipeline.main ensure-db
python -m pipeline.main init-db
python -m pipeline.main sync-seeds
python -m pipeline.main scrape
python -m pipeline.main extract
python -m pipeline.main run-all
```
```

- [ ] **Step 6: Verify files exist**

Run:

```powershell
Test-Path requirements.txt
Test-Path .env.example
Test-Path pipeline/__init__.py
```

Expected:

```text
True
True
True
```

- [ ] **Step 7: Commit**

```bash
git add requirements.txt .env.example pipeline/__init__.py README.md
git commit -m "feat: add local pipeline scaffolding"
```

## Task 2: Add Docker Compose and ingestion schema SQL

**Files:**
- Create: `docker-compose.yml`
- Create: `pipeline/sql/init.sql`

- [ ] **Step 1: Write the failing schema bootstrap expectation**

Before adding Compose and SQL bootstrap, these files should not exist.

Run:

```powershell
Test-Path docker-compose.yml
Test-Path pipeline/sql/init.sql
```

Expected:

```text
False
False
```

- [ ] **Step 2: Create `docker-compose.yml`**

```yaml
services:
  postgres:
    image: postgres:16
    container_name: piecesofthem-postgres
    restart: unless-stopped
    environment:
      POSTGRES_DB: piecesofthem
      POSTGRES_USER: pieces
      POSTGRES_PASSWORD: pieces
    ports:
      - "5432:5432"
    volumes:
      - piecesofthem_postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U pieces -d piecesofthem"]
      interval: 5s
      timeout: 5s
      retries: 12

volumes:
  piecesofthem_postgres_data:
```

- [ ] **Step 3: Create `pipeline/sql/init.sql`**

```sql
CREATE SCHEMA IF NOT EXISTS ingestion;

CREATE TABLE IF NOT EXISTS ingestion.seed_sources (
  id BIGSERIAL PRIMARY KEY,
  seed_id TEXT NOT NULL UNIQUE,
  kind TEXT NOT NULL,
  label TEXT NOT NULL,
  source_urls JSONB NOT NULL,
  platform TEXT NOT NULL,
  access TEXT NOT NULL,
  subject_label TEXT,
  child_age_signal TEXT NOT NULL,
  disease_subtype TEXT NOT NULL,
  trial_program TEXT,
  intervention_class TEXT,
  source_confidence TEXT NOT NULL,
  named_publicly BOOLEAN NOT NULL,
  confirmed_participation BOOLEAN NOT NULL,
  source_type TEXT NOT NULL,
  author_role TEXT NOT NULL,
  symptom_domains JSONB NOT NULL,
  temporal_signal TEXT NOT NULL,
  extraction_value TEXT NOT NULL,
  scrape_difficulty TEXT NOT NULL,
  consent_risk TEXT NOT NULL,
  comparison_use TEXT,
  evidence_summary TEXT NOT NULL,
  notes TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ingestion.source_documents (
  id BIGSERIAL PRIMARY KEY,
  seed_source_id BIGINT NOT NULL REFERENCES ingestion.seed_sources(id) ON DELETE CASCADE,
  source_url TEXT NOT NULL,
  canonical_url TEXT,
  fetch_status TEXT NOT NULL,
  http_status INTEGER,
  content_type TEXT,
  title TEXT,
  raw_html TEXT,
  clean_text TEXT,
  content_hash TEXT,
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(seed_source_id, source_url, content_hash)
);

CREATE TABLE IF NOT EXISTS ingestion.document_chunks (
  id BIGSERIAL PRIMARY KEY,
  source_document_id BIGINT NOT NULL REFERENCES ingestion.source_documents(id) ON DELETE CASCADE,
  chunk_index INTEGER NOT NULL,
  char_start INTEGER NOT NULL,
  char_end INTEGER NOT NULL,
  token_estimate INTEGER NOT NULL,
  chunk_text TEXT NOT NULL,
  chunk_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(source_document_id, chunk_index)
);

CREATE TABLE IF NOT EXISTS ingestion.extraction_runs (
  id BIGSERIAL PRIMARY KEY,
  source_document_id BIGINT NOT NULL REFERENCES ingestion.source_documents(id) ON DELETE CASCADE,
  extractor_name TEXT NOT NULL,
  model_name TEXT NOT NULL,
  prompt_version TEXT NOT NULL,
  status TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ingestion.extracted_datapoints (
  id BIGSERIAL PRIMARY KEY,
  extraction_run_id BIGINT NOT NULL REFERENCES ingestion.extraction_runs(id) ON DELETE CASCADE,
  source_document_id BIGINT NOT NULL REFERENCES ingestion.source_documents(id) ON DELETE CASCADE,
  chunk_id BIGINT NOT NULL REFERENCES ingestion.document_chunks(id) ON DELETE CASCADE,
  datapoint_type TEXT NOT NULL,
  schema_version TEXT NOT NULL,
  subject_label TEXT,
  disease_subtype TEXT,
  trial_program TEXT,
  value_json JSONB NOT NULL,
  confidence TEXT NOT NULL,
  evidence_quote TEXT NOT NULL,
  char_start INTEGER,
  char_end INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ingestion.extraction_issues (
  id BIGSERIAL PRIMARY KEY,
  extraction_run_id BIGINT REFERENCES ingestion.extraction_runs(id) ON DELETE CASCADE,
  source_document_id BIGINT REFERENCES ingestion.source_documents(id) ON DELETE CASCADE,
  chunk_id BIGINT REFERENCES ingestion.document_chunks(id) ON DELETE CASCADE,
  issue_type TEXT NOT NULL,
  raw_output TEXT,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

- [ ] **Step 4: Verify the files contain the expected top-level markers**

Run:

```powershell
Select-String -Path docker-compose.yml -Pattern "postgres:16"
Select-String -Path pipeline/sql/init.sql -Pattern "CREATE SCHEMA IF NOT EXISTS ingestion;"
```

Expected:

```text
docker-compose.yml:...:    image: postgres:16
pipeline/sql/init.sql:1:CREATE SCHEMA IF NOT EXISTS ingestion;
```

- [ ] **Step 5: Commit**

```bash
git add docker-compose.yml pipeline/sql/init.sql
git commit -m "feat: add postgres compose and ingestion schema"
```

## Task 3: Add config loading and DB helpers

**Files:**
- Create: `pipeline/config.py`
- Create: `pipeline/db.py`

- [ ] **Step 1: Write the failing import check**

Run:

```powershell
python -c "from pipeline.config import PipelineConfig"
```

Expected:

```text
ModuleNotFoundError: No module named 'pipeline.config'
```

- [ ] **Step 2: Create `pipeline/config.py`**

```python
from dataclasses import dataclass
import os

from dotenv import load_dotenv


load_dotenv()


@dataclass(frozen=True)
class PipelineConfig:
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


def load_config() -> PipelineConfig:
    return PipelineConfig(
        postgres_host=os.getenv("POSTGRES_HOST", "127.0.0.1"),
        postgres_port=int(os.getenv("POSTGRES_PORT", "5432")),
        postgres_db=os.getenv("POSTGRES_DB", "piecesofthem"),
        postgres_user=os.getenv("POSTGRES_USER", "pieces"),
        postgres_password=os.getenv("POSTGRES_PASSWORD", "pieces"),
        openai_api_key=os.getenv("OPENAI_API_KEY", ""),
        openai_model=os.getenv("OPENAI_MODEL", "gpt-5.4-mini"),
        db_start_timeout_seconds=int(os.getenv("PIPELINE_DB_START_TIMEOUT_SECONDS", "45")),
        chunk_target_chars=int(os.getenv("PIPELINE_CHUNK_TARGET_CHARS", "2000")),
        chunk_overlap_chars=int(os.getenv("PIPELINE_CHUNK_OVERLAP_CHARS", "200")),
        scraper_user_agent=os.getenv("PIPELINE_SCRAPER_USER_AGENT", "PiecesOfThemHackathonBot/0.1"),
    )
```

- [ ] **Step 3: Create `pipeline/db.py`**

```python
from pathlib import Path

import psycopg

from pipeline.config import PipelineConfig


def build_dsn(config: PipelineConfig) -> str:
    return (
        f"host={config.postgres_host} "
        f"port={config.postgres_port} "
        f"dbname={config.postgres_db} "
        f"user={config.postgres_user} "
        f"password={config.postgres_password}"
    )


def connect(config: PipelineConfig):
    return psycopg.connect(build_dsn(config))


def can_connect(config: PipelineConfig) -> bool:
    try:
        with connect(config) as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT 1")
                cur.fetchone()
        return True
    except Exception:
        return False


def run_sql_file(config: PipelineConfig, sql_path: str) -> None:
    sql = Path(sql_path).read_text(encoding="utf-8")
    with connect(config) as conn:
        with conn.cursor() as cur:
            cur.execute(sql)
        conn.commit()
```

- [ ] **Step 4: Verify imports succeed**

Run:

```powershell
python -c "from pipeline.config import PipelineConfig, load_config; from pipeline.db import build_dsn; print('ok')"
```

Expected:

```text
ok
```

- [ ] **Step 5: Commit**

```bash
git add pipeline/config.py pipeline/db.py
git commit -m "feat: add pipeline config and db helpers"
```

## Task 4: Add DB bootstrap with Docker Compose startup

**Files:**
- Create: `pipeline/bootstrap.py`

- [ ] **Step 1: Write the failing import check**

Run:

```powershell
python -c "from pipeline.bootstrap import ensure_database"
```

Expected:

```text
ModuleNotFoundError: No module named 'pipeline.bootstrap'
```

- [ ] **Step 2: Create `pipeline/bootstrap.py`**

```python
import subprocess
import time

from pipeline.config import PipelineConfig
from pipeline.db import can_connect


def ensure_database(config: PipelineConfig) -> None:
    if can_connect(config):
        return

    subprocess.run(["docker", "compose", "up", "-d", "postgres"], check=True)

    deadline = time.time() + config.db_start_timeout_seconds
    while time.time() < deadline:
        if can_connect(config):
            return
        time.sleep(2)

    raise RuntimeError("Postgres did not become reachable before timeout.")
```

- [ ] **Step 3: Verify import succeeds**

Run:

```powershell
python -c "from pipeline.bootstrap import ensure_database; print('ok')"
```

Expected:

```text
ok
```

- [ ] **Step 4: Commit**

```bash
git add pipeline/bootstrap.py
git commit -m "feat: add database bootstrap logic"
```

## Task 5: Export the normalized seed catalog to JSON

**Files:**
- Create: `data/seed-catalog.json`
- Modify: `lib/seed-catalog.ts`

- [ ] **Step 1: Write the failing file existence check**

Run:

```powershell
Test-Path data/seed-catalog.json
```

Expected:

```text
False
```

- [ ] **Step 2: Create `data/seed-catalog.json`**

Use the current `seedCatalog` records from `lib/seed-catalog.ts` and serialize them into a checked-in JSON array.

The file must begin like this:

```json
[
  {
    "id": "PSS-001",
    "kind": "public-source",
    "label": "Every Family Has a Story",
    "sourceUrls": [
      "https://curesanfilippofoundation.org/meet-the-families/every-family-has-a-story/"
    ],
    "platform": "Cure Sanfilippo Foundation"
  }
]
```

Include all current public-source and trial-participant records from `seedCatalog`.

- [ ] **Step 3: Add a short note in `lib/seed-catalog.ts`**

Add this comment at the top:

```ts
// Keep data/seed-catalog.json in sync with this catalog for the local Python ingestion pipeline.
```

- [ ] **Step 4: Verify the JSON file parses**

Run:

```powershell
python -c "import json, pathlib; data = json.loads(pathlib.Path('data/seed-catalog.json').read_text(encoding='utf-8')); print(len(data) > 0)"
```

Expected:

```text
True
```

- [ ] **Step 5: Commit**

```bash
git add data/seed-catalog.json lib/seed-catalog.ts
git commit -m "feat: add json seed catalog export"
```

## Task 6: Add seed sync into `ingestion.seed_sources`

**Files:**
- Create: `pipeline/seeds.py`

- [ ] **Step 1: Write the failing import check**

Run:

```powershell
python -c "from pipeline.seeds import load_seed_catalog"
```

Expected:

```text
ModuleNotFoundError: No module named 'pipeline.seeds'
```

- [ ] **Step 2: Create `pipeline/seeds.py`**

```python
import json
from pathlib import Path

from psycopg.types.json import Jsonb

from pipeline.config import PipelineConfig
from pipeline.db import connect


def load_seed_catalog() -> list[dict]:
    return json.loads(Path("data/seed-catalog.json").read_text(encoding="utf-8"))


def sync_seed_catalog(config: PipelineConfig) -> int:
    seeds = load_seed_catalog()
    with connect(config) as conn:
        with conn.cursor() as cur:
            for seed in seeds:
                cur.execute(
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
        conn.commit()
    return len(seeds)
```

- [ ] **Step 3: Verify JSON loading works before DB wiring**

Run:

```powershell
python -c "from pipeline.seeds import load_seed_catalog; print(type(load_seed_catalog()).__name__)"
```

Expected:

```text
list
```

- [ ] **Step 4: Commit**

```bash
git add pipeline/seeds.py
git commit -m "feat: add seed catalog sync"
```

## Task 7: Add deterministic scraping and normalization

**Files:**
- Create: `pipeline/scrape.py`
- Create: `tests/test_scrape_normalization.py`

- [ ] **Step 1: Write the failing normalization test**

```python
from pipeline.scrape import normalize_html_to_text


def test_normalize_html_to_text_removes_script_and_nav():
    html = """
    <html>
      <head><title>Example</title><script>bad()</script></head>
      <body>
        <nav>Menu</nav>
        <main><p>Hello world.</p><p>Second paragraph.</p></main>
      </body>
    </html>
    """
    title, text = normalize_html_to_text(html)
    assert title == "Example"
    assert "Menu" not in text
    assert "bad()" not in text
    assert "Hello world." in text
    assert "Second paragraph." in text
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
pytest tests/test_scrape_normalization.py::test_normalize_html_to_text_removes_script_and_nav -v
```

Expected:

```text
FAIL ... ModuleNotFoundError or ImportError
```

- [ ] **Step 3: Create `pipeline/scrape.py` with minimal implementation**

```python
import hashlib
from urllib.parse import urlparse

import requests
from bs4 import BeautifulSoup

from pipeline.config import PipelineConfig
from pipeline.db import connect


def normalize_html_to_text(html: str) -> tuple[str | None, str]:
    soup = BeautifulSoup(html, "html.parser")
    for tag_name in ["script", "style", "noscript", "nav", "footer"]:
        for tag in soup.find_all(tag_name):
            tag.decompose()

    title = soup.title.string.strip() if soup.title and soup.title.string else None
    paragraphs = [node.get_text(" ", strip=True) for node in soup.find_all(["p", "h1", "h2", "h3", "li"])]
    text = "\n\n".join(part for part in paragraphs if part)
    return title, text


def compute_content_hash(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def fetch_url(config: PipelineConfig, url: str) -> requests.Response:
    headers = {"User-Agent": config.scraper_user_agent}
    return requests.get(url, headers=headers, timeout=20)


def scrape_seed_sources(config: PipelineConfig) -> int:
    inserted = 0
    with connect(config) as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT id, source_urls FROM ingestion.seed_sources ORDER BY id")
            rows = cur.fetchall()

            for seed_source_id, source_urls in rows:
                for source_url in source_urls:
                    response = fetch_url(config, source_url)
                    title, clean_text = normalize_html_to_text(response.text)
                    content_hash = compute_content_hash(clean_text)
                    cur.execute(
                        """
                        INSERT INTO ingestion.source_documents (
                          seed_source_id, source_url, canonical_url, fetch_status, http_status,
                          content_type, title, raw_html, clean_text, content_hash
                        )
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                        ON CONFLICT DO NOTHING
                        """,
                        (
                            seed_source_id,
                            source_url,
                            str(response.url),
                            "success",
                            response.status_code,
                            response.headers.get("Content-Type"),
                            title,
                            response.text,
                            clean_text,
                            content_hash,
                        ),
                    )
                    inserted += cur.rowcount
        conn.commit()
    return inserted
```

- [ ] **Step 4: Add `tests/test_scrape_normalization.py`**

Use the exact test from Step 1.

- [ ] **Step 5: Run test to verify it passes**

Run:

```bash
pytest tests/test_scrape_normalization.py::test_normalize_html_to_text_removes_script_and_nav -v
```

Expected:

```text
PASS
```

- [ ] **Step 6: Commit**

```bash
git add pipeline/scrape.py tests/test_scrape_normalization.py
git commit -m "feat: add deterministic scraping and normalization"
```

## Task 8: Add deterministic chunking

**Files:**
- Create: `pipeline/chunking.py`
- Create: `tests/test_chunking.py`

- [ ] **Step 1: Write the failing chunking test**

```python
from pipeline.chunking import build_chunks


def test_build_chunks_preserves_order_and_overlap():
    text = ("Paragraph one.\n\n" * 40) + ("Paragraph two.\n\n" * 40)
    chunks = build_chunks(text, target_chars=200, overlap_chars=20)
    assert len(chunks) >= 2
    assert chunks[0]["char_start"] == 0
    assert chunks[1]["char_start"] < chunks[0]["char_end"]
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
pytest tests/test_chunking.py::test_build_chunks_preserves_order_and_overlap -v
```

Expected:

```text
FAIL ... ModuleNotFoundError or ImportError
```

- [ ] **Step 3: Create `pipeline/chunking.py`**

```python
import hashlib


def estimate_tokens(text: str) -> int:
    return max(1, len(text) // 4)


def build_chunks(text: str, target_chars: int, overlap_chars: int) -> list[dict]:
    chunks: list[dict] = []
    start = 0
    while start < len(text):
      end = min(len(text), start + target_chars)
      chunk_text = text[start:end]
      chunks.append(
          {
              "chunk_index": len(chunks),
              "char_start": start,
              "char_end": end,
              "token_estimate": estimate_tokens(chunk_text),
              "chunk_text": chunk_text,
              "chunk_hash": hashlib.sha256(chunk_text.encode("utf-8")).hexdigest(),
          }
      )
      if end == len(text):
          break
      start = max(0, end - overlap_chars)
    return chunks
```

- [ ] **Step 4: Add `tests/test_chunking.py`**

Use the exact test from Step 1.

- [ ] **Step 5: Add DB write helper to `pipeline/chunking.py`**

Append:

```python
from pipeline.config import PipelineConfig
from pipeline.db import connect


def chunk_pending_documents(config: PipelineConfig) -> int:
    inserted = 0
    with connect(config) as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT sd.id, sd.clean_text
                FROM ingestion.source_documents sd
                WHERE sd.clean_text IS NOT NULL
                  AND NOT EXISTS (
                    SELECT 1
                    FROM ingestion.document_chunks dc
                    WHERE dc.source_document_id = sd.id
                  )
                ORDER BY sd.id
                """
            )
            rows = cur.fetchall()
            for source_document_id, clean_text in rows:
                for chunk in build_chunks(clean_text, target_chars=config.chunk_target_chars, overlap_chars=config.chunk_overlap_chars):
                    cur.execute(
                        """
                        INSERT INTO ingestion.document_chunks (
                          source_document_id, chunk_index, char_start, char_end,
                          token_estimate, chunk_text, chunk_hash
                        )
                        VALUES (%s, %s, %s, %s, %s, %s, %s)
                        ON CONFLICT DO NOTHING
                        """,
                        (
                            source_document_id,
                            chunk["chunk_index"],
                            chunk["char_start"],
                            chunk["char_end"],
                            chunk["token_estimate"],
                            chunk["chunk_text"],
                            chunk["chunk_hash"],
                        ),
                    )
                    inserted += cur.rowcount
        conn.commit()
    return inserted
```

- [ ] **Step 6: Run test to verify it passes**

Run:

```bash
pytest tests/test_chunking.py::test_build_chunks_preserves_order_and_overlap -v
```

Expected:

```text
PASS
```

- [ ] **Step 7: Commit**

```bash
git add pipeline/chunking.py tests/test_chunking.py
git commit -m "feat: add deterministic chunking"
```

## Task 9: Add extraction schema models and prompt

**Files:**
- Create: `pipeline/models.py`
- Create: `pipeline/prompts/extraction_prompt.md`
- Create: `tests/test_extraction_models.py`

- [ ] **Step 1: Write the failing model validation test**

```python
from pipeline.models import ExtractionResponse


def test_extraction_response_validates_datapoints():
    payload = {
        "datapoints": [
            {
                "datapoint_type": "trial_participation",
                "subject_label": "Eliza O'Neill",
                "disease_subtype": "MPS IIIA",
                "trial_program": "UX111-ABO-102",
                "confidence": "high",
                "evidence_quote": "Eliza was treated.",
                "value": {"participation_status": "confirmed", "named_publicly": True},
            }
        ]
    }
    result = ExtractionResponse.model_validate(payload)
    assert result.datapoints[0].datapoint_type == "trial_participation"
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
pytest tests/test_extraction_models.py::test_extraction_response_validates_datapoints -v
```

Expected:

```text
FAIL ... ModuleNotFoundError or ImportError
```

- [ ] **Step 3: Create `pipeline/models.py`**

```python
from typing import Any, Literal

from pydantic import BaseModel, Field


class ExtractedDatapoint(BaseModel):
    datapoint_type: Literal[
        "child_identity",
        "caregiver_role",
        "disease_subtype",
        "trial_participation",
        "functional_signal",
        "temporal_marker",
        "outcome_claim",
    ]
    subject_label: str | None = None
    disease_subtype: str | None = None
    trial_program: str | None = None
    confidence: Literal["low", "medium", "high"]
    evidence_quote: str = Field(min_length=1)
    value: dict[str, Any]


class ExtractionResponse(BaseModel):
    datapoints: list[ExtractedDatapoint]
```

- [ ] **Step 4: Create `pipeline/prompts/extraction_prompt.md`**

```md
You are extracting structured Sanfilippo evidence candidates from public source text.

Rules:
- Return strict JSON only.
- Use only information present in the supplied chunk.
- Do not infer names or trial participation if the chunk does not state them.
- Keep evidence_quote verbatim from the chunk.
- Prefer no datapoint over a speculative datapoint.

Return:
{
  "datapoints": [
    {
      "datapoint_type": "trial_participation",
      "subject_label": "Eliza O'Neill",
      "disease_subtype": "MPS IIIA",
      "trial_program": "UX111-ABO-102",
      "confidence": "high",
      "evidence_quote": "exact quote here",
      "value": {
        "participation_status": "confirmed",
        "named_publicly": true
      }
    }
  ]
}
```

- [ ] **Step 5: Add `tests/test_extraction_models.py`**

Use the exact test from Step 1.

- [ ] **Step 6: Run test to verify it passes**

Run:

```bash
pytest tests/test_extraction_models.py::test_extraction_response_validates_datapoints -v
```

Expected:

```text
PASS
```

- [ ] **Step 7: Commit**

```bash
git add pipeline/models.py pipeline/prompts/extraction_prompt.md tests/test_extraction_models.py
git commit -m "feat: add extraction schema models"
```

## Task 10: Add LLM extraction orchestration

**Files:**
- Create: `pipeline/extract.py`

- [ ] **Step 1: Write the failing import check**

Run:

```powershell
python -c "from pipeline.extract import run_extraction"
```

Expected:

```text
ModuleNotFoundError: No module named 'pipeline.extract'
```

- [ ] **Step 2: Create `pipeline/extract.py`**

```python
from pathlib import Path
import json

from openai import OpenAI

from pipeline.config import PipelineConfig
from pipeline.db import connect
from pipeline.models import ExtractionResponse


PROMPT_VERSION = "2026-04-17-v1"


def build_prompt(chunk_text: str) -> str:
    template = Path("pipeline/prompts/extraction_prompt.md").read_text(encoding="utf-8")
    return f"{template}\n\nChunk:\n{chunk_text}"


def run_extraction(config: PipelineConfig) -> int:
    client = OpenAI(api_key=config.openai_api_key)
    inserted = 0

    with connect(config) as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT dc.id, dc.source_document_id, dc.chunk_text
                FROM ingestion.document_chunks dc
                WHERE NOT EXISTS (
                  SELECT 1
                  FROM ingestion.extracted_datapoints ed
                  WHERE ed.chunk_id = dc.id
                )
                ORDER BY dc.id
                """
            )
            rows = cur.fetchall()

            for chunk_id, source_document_id, chunk_text in rows:
                cur.execute(
                    """
                    INSERT INTO ingestion.extraction_runs (
                      source_document_id, extractor_name, model_name, prompt_version, status
                    ) VALUES (%s, %s, %s, %s, %s)
                    RETURNING id
                    """,
                    (source_document_id, "openai-responses", config.openai_model, PROMPT_VERSION, "started"),
                )
                extraction_run_id = cur.fetchone()[0]

                try:
                    response = client.responses.create(
                        model=config.openai_model,
                        input=build_prompt(chunk_text),
                    )
                    payload = json.loads(response.output_text)
                    result = ExtractionResponse.model_validate(payload)

                    for datapoint in result.datapoints:
                        cur.execute(
                            """
                            INSERT INTO ingestion.extracted_datapoints (
                              extraction_run_id, source_document_id, chunk_id, datapoint_type,
                              schema_version, subject_label, disease_subtype, trial_program,
                              value_json, confidence, evidence_quote
                            )
                            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                            """,
                            (
                                extraction_run_id,
                                source_document_id,
                                chunk_id,
                                datapoint.datapoint_type,
                                PROMPT_VERSION,
                                datapoint.subject_label,
                                datapoint.disease_subtype,
                                datapoint.trial_program,
                                json.dumps(datapoint.value),
                                datapoint.confidence,
                                datapoint.evidence_quote,
                            ),
                        )
                        inserted += 1

                    cur.execute(
                        """
                        UPDATE ingestion.extraction_runs
                        SET status = 'completed', completed_at = NOW()
                        WHERE id = %s
                        """,
                        (extraction_run_id,),
                    )
                except Exception as exc:
                    cur.execute(
                        """
                        UPDATE ingestion.extraction_runs
                        SET status = 'failed', completed_at = NOW(), error_message = %s
                        WHERE id = %s
                        """,
                        (str(exc), extraction_run_id),
                    )
                    cur.execute(
                        """
                        INSERT INTO ingestion.extraction_issues (
                          extraction_run_id, source_document_id, chunk_id, issue_type, message
                        )
                        VALUES (%s, %s, %s, %s, %s)
                        """,
                        (extraction_run_id, source_document_id, chunk_id, "extraction_error", str(exc)),
                    )
        conn.commit()

    return inserted
```

- [ ] **Step 3: Verify import succeeds**

Run:

```powershell
python -c "from pipeline.extract import PROMPT_VERSION; print(PROMPT_VERSION)"
```

Expected:

```text
2026-04-17-v1
```

- [ ] **Step 4: Commit**

```bash
git add pipeline/extract.py
git commit -m "feat: add extraction orchestration"
```

## Task 11: Add CLI entrypoint and wire the pipeline stages

**Files:**
- Create: `pipeline/main.py`

- [ ] **Step 1: Write the failing module run check**

Run:

```powershell
python -m pipeline.main
```

Expected:

```text
No module named pipeline.main
```

- [ ] **Step 2: Create `pipeline/main.py`**

```python
import argparse

from pipeline.bootstrap import ensure_database
from pipeline.chunking import chunk_pending_documents
from pipeline.config import load_config
from pipeline.db import run_sql_file
from pipeline.extract import run_extraction
from pipeline.scrape import scrape_seed_sources
from pipeline.seeds import sync_seed_catalog


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="PiecesOfThem local ingestion pipeline")
    parser.add_argument(
        "command",
        choices=["ensure-db", "init-db", "sync-seeds", "scrape", "extract", "run-all"],
    )
    return parser


def main() -> None:
    parser = build_parser()
    args = parser.parse_args()
    config = load_config()

    if args.command == "ensure-db":
        ensure_database(config)
        print("database-ready")
        return

    if args.command == "init-db":
        run_sql_file(config, "pipeline/sql/init.sql")
        print("schema-ready")
        return

    if args.command == "sync-seeds":
        count = sync_seed_catalog(config)
        print(f"seed-count={count}")
        return

    if args.command == "scrape":
        count = scrape_seed_sources(config)
        print(f"scraped={count}")
        return

    if args.command == "extract":
        count = run_extraction(config)
        print(f"datapoints={count}")
        return

    if args.command == "run-all":
        ensure_database(config)
        run_sql_file(config, "pipeline/sql/init.sql")
        sync_seed_catalog(config)
        scrape_seed_sources(config)
        chunk_pending_documents(config)
        datapoints = run_extraction(config)
        print(f"run-all-complete datapoints={datapoints}")
        return


if __name__ == "__main__":
    main()
```

- [ ] **Step 3: Verify CLI help works**

Run:

```powershell
python -m pipeline.main --help
```

Expected:

```text
usage: ...
```

- [ ] **Step 4: Commit**

```bash
git add pipeline/main.py
git commit -m "feat: add pipeline cli"
```

## Task 12: End-to-end local verification

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Install dependencies**

Run:

```bash
pip install -r requirements.txt
```

Expected:

```text
Successfully installed ...
```

- [ ] **Step 2: Bring the database up through the pipeline**

Run:

```bash
python -m pipeline.main ensure-db
```

Expected:

```text
database-ready
```

- [ ] **Step 3: Initialize schema**

Run:

```bash
python -m pipeline.main init-db
```

Expected:

```text
schema-ready
```

- [ ] **Step 4: Sync seeds**

Run:

```bash
python -m pipeline.main sync-seeds
```

Expected:

```text
seed-count=...
```

- [ ] **Step 5: Run scraper**

Run:

```bash
python -m pipeline.main scrape
```

Expected:

```text
scraped=...
```

- [ ] **Step 6: Run chunking by calling `run-all` once extraction is configured**

Run:

```bash
python -m pipeline.main run-all
```

Expected:

```text
run-all-complete datapoints=...
```

- [ ] **Step 7: Spot-check row counts**

Run:

```sql
SELECT COUNT(*) FROM ingestion.seed_sources;
SELECT COUNT(*) FROM ingestion.source_documents;
SELECT COUNT(*) FROM ingestion.document_chunks;
SELECT COUNT(*) FROM ingestion.extraction_runs;
SELECT COUNT(*) FROM ingestion.extracted_datapoints;
```

Expected:

- non-zero counts for `seed_sources`
- non-zero counts for `source_documents`
- non-zero counts for `document_chunks`
- extraction counts depend on OpenAI API availability

- [ ] **Step 8: Update `README.md` with verification notes if command names or setup details changed during implementation**

Use this exact note if needed:

```md
If `python -m pipeline.main extract` fails, confirm that `OPENAI_API_KEY` is set in `.env` and that the selected model is accessible from your account.
```

- [ ] **Step 9: Commit**

```bash
git add README.md
git commit -m "docs: finalize pipeline usage notes"
```

## Self-Review

### Spec coverage

- Docker Compose Postgres startup: covered in Tasks 2, 4, and 11
- Dedicated ingestion schema: covered in Task 2
- Deterministic scraper: covered in Task 7
- Deterministic chunking: covered in Task 8
- Seed sync from normalized catalog: covered in Tasks 5 and 6
- Agentic LLM extraction into ingestion tables: covered in Tasks 9 and 10
- End-to-end CLI flow: covered in Task 11
- Verification workflow: covered in Task 12

No uncovered spec sections remain.

### Placeholder scan

- No `TODO`, `TBD`, or “implement later” placeholders remain.
- Each code-writing step contains concrete code blocks.
- Each verification step has an exact command and expected result.

### Type consistency

- JSON export uses the `seedCatalog` field names consumed by `pipeline/seeds.py`.
- `ExtractionResponse` and `ExtractedDatapoint` names match the extraction orchestrator imports.
- CLI command names are consistent across the plan and README updates.
