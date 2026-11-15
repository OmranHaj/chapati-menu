import "reflect-metadata";
import expressApp from "./app";
import { NestFactory } from "@nestjs/core";
import { ExpressAdapter } from "@nestjs/platform-express";
import { AppModule } from "./app.module";
import { ApiExceptionFilter } from "./lib/exception-filter";
import { logger } from "./lib/logger";
import { pool } from "@workspace/db";
import { serveFrontend } from "./lib/serve-frontend";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule, new ExpressAdapter(expressApp), {
    bodyParser: false,
    logger: {
      log: (message: unknown) => logger.info(message),
      error: (message: unknown) => logger.error(message),
      warn: (message: unknown) => logger.warn(message),
      debug: (message: unknown) => logger.debug(message),
      verbose: (message: unknown) => logger.trace(message),
    },
  });
  app.setGlobalPrefix("api");
  app.useGlobalFilters(new ApiExceptionFilter());
  serveFrontend(expressApp);
  await app.init();
  await app.listen(port, "0.0.0.0");
  logger.info({ port }, "NestJS API listening");
  const shutdown = async () => {
    await app.close();
    await pool.end();
    process.exit(0);
  };
  process.once("SIGTERM", () => { void shutdown(); });
  process.once("SIGINT", () => { void shutdown(); });
}

bootstrap().catch((err: unknown) => {
  logger.error({ err }, "Unable to start NestJS");
  process.exit(1);
});
