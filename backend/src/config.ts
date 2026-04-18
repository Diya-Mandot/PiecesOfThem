import { config as loadEnv } from "dotenv";
import { resolve } from "node:path";

// Load the backend-local env file first, then fall back to the repo-root .env used by the pipeline/frontend.
loadEnv({ path: resolve(process.cwd(), ".env") });
loadEnv({ path: resolve(process.cwd(), "../.env"), override: false });

/** Resolve a required environment variable while still allowing a local default for development. */
function requireEnv(name: string, fallback?: string) {
  const value = process.env[name] ?? fallback;

  if (!value) {
    throw new Error(`Missing required environment variable ${name}`);
  }

  return value;
}

/** Centralized runtime configuration for the Fastify server and Postgres connection pool. */
export const backendConfig = {
  host: process.env.HOST ?? "127.0.0.1",
  port: Number(process.env.PORT ?? "4000"),
  postgres: {
    host: requireEnv("POSTGRES_HOST", "127.0.0.1"),
    port: Number(process.env.POSTGRES_PORT ?? "5432"),
    database: requireEnv("POSTGRES_DB", "piecesofthem"),
    user: requireEnv("POSTGRES_USER", "pieces"),
    password: requireEnv("POSTGRES_PASSWORD", "pieces"),
  },
};
