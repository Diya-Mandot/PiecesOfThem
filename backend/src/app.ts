import Fastify from "fastify";

import { createPool, pingDatabase } from "./db.js";
import { IngestionRepository } from "./ingestion/repository.js";
import { registerIngestionRoutes } from "./ingestion/routes.js";
import { IngestionService } from "./ingestion/service.js";
import { ProjectionRepository } from "./projection-repository.js";
import { registerRoutes } from "./routes.js";
import { EvidenceService } from "./service.js";

/** Build the Fastify app with both product-facing evidence routes and ingestion/admin routes. */
export async function createApp() {
  const app = Fastify({ logger: false });
  const pool = createPool();
  await pingDatabase(pool);

  const service = new EvidenceService(new ProjectionRepository(pool));
  const ingestionService = new IngestionService(new IngestionRepository(pool));

  app.get("/health", async () => ({ status: "ok" }));

  await registerRoutes(app, service);
  await registerIngestionRoutes(app, ingestionService);
  app.addHook("onClose", async () => {
    await pool.end();
  });

  return app;
}
