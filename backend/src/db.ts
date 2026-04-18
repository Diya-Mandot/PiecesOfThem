import { Pool, types } from "pg";

import { backendConfig } from "./config.js";

// Parse bigint columns as numbers because the API contracts and frontend expect numeric IDs/counts.
types.setTypeParser(20, (value: string) => Number(value));

/** Create the shared Postgres pool used by both projection and ingestion routes. */
export function createPool() {
  return new Pool({
    host: backendConfig.postgres.host,
    port: backendConfig.postgres.port,
    database: backendConfig.postgres.database,
    user: backendConfig.postgres.user,
    password: backendConfig.postgres.password,
    max: 10,
    idleTimeoutMillis: 30_000,
  });
}

/** Fail fast during boot if the configured database is not reachable. */
export async function pingDatabase(pool: Pool) {
  await pool.query("select 1");
}
