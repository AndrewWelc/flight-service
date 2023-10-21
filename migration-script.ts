import { runInitialFlightSourcesMigration } from "./src/migrations/initialFlightSources.migration";
import { mongodbConnect } from "./src/common/utils";
import { Logger } from "@nestjs/common";

async function main() {
  const logger = new Logger();
  const dbConnection = await mongodbConnect();
  await runInitialFlightSourcesMigration(dbConnection, logger);
  logger.log("Database migration successfully initialized");
}

main().then(() => process.exit(0));
