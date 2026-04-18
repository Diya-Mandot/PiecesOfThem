import { Pool, types } from "pg";

import { backendConfig } from "./config.js";

types.setTypeParser(20, (value: string) => Number(value));

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

export async function pingDatabase(pool: Pool) {
  await pool.query("select 1");
}
