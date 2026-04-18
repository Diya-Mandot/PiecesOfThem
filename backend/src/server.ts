import { createApp } from "./app.js";
import { backendConfig } from "./config.js";

async function start() {
  const app = await createApp();

  try {
    await app.listen({ port: backendConfig.port, host: backendConfig.host });
    console.log(`PiecesOfThem backend listening on http://${backendConfig.host}:${backendConfig.port}`);
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
}

void start();
