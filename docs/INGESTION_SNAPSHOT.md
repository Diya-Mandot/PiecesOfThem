# Ingestion Snapshot

This repo now includes a shareable SQL snapshot of the populated local ingestion database.

## Files

- `data/snapshots/ingestion_snapshot.sql`
- `data/snapshots/ingestion_snapshot.meta.json`

## What it contains

The snapshot is a data-only export of the `ingestion` schema from the local `piecesofthem` PostgreSQL database.

Current snapshot counts:

- `seed_sources`: 17
- `source_documents`: 24
- `document_chunks`: 80
- `extraction_runs`: 27
- `extracted_datapoints`: 187
- `extraction_issues`: 18

## Import steps

1. Create the expected local PostgreSQL role and database if needed.

```bash
psql -d postgres -c "DO \$\$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'pieces') THEN CREATE ROLE pieces LOGIN PASSWORD 'pieces'; END IF; END \$\$;"
psql -d postgres -tc "SELECT 1 FROM pg_database WHERE datname = 'piecesofthem'" | grep -q 1 || \
  psql -d postgres -c "CREATE DATABASE piecesofthem OWNER pieces;"
```

2. Initialize the ingestion schema.

```bash
psql -d piecesofthem -f pipeline/sql/init.sql
```

3. Import the snapshot.

```bash
psql -d piecesofthem -f data/snapshots/ingestion_snapshot.sql
```

4. Start the backend against the local database.

```bash
cd backend
POSTGRES_HOST=127.0.0.1 \
POSTGRES_PORT=5432 \
POSTGRES_DB=piecesofthem \
POSTGRES_USER=pieces \
POSTGRES_PASSWORD=pieces \
npm run dev
```

## Notes

- The snapshot is shareable through git because it is exported SQL, not a live local database.
- The frontend still supports a synthetic fallback for `demo-child-a`, but once the backend is pointed at an imported snapshot it can use real projected ingestion data.
- This snapshot does not include Docker state or local Postgres configuration; it only includes SQL data.
