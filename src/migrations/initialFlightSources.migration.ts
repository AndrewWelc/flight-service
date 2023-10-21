import { Connection } from "mongoose";
import * as dotenv from "dotenv";
import { Logger } from "@nestjs/common";
import { FlightSourceDocument } from "../flight/schema/flight-source.schema";

dotenv.config();

const source1Url = process.env.SOURCE1_URL;
const source2Url = process.env.SOURCE2_URL;

const initialFlightSources: Partial<FlightSourceDocument>[] = [
  {
    name: "Source 1",
    url: source1Url,
  },
  {
    name: "Source 2",
    url: source2Url,
  },
];

export const runInitialFlightSourcesMigration = async (
  dbConnection: Connection,
  logger: Logger
) => {
  const flightSourceCollection = dbConnection.db.collection("flightsources");

  for (const source of initialFlightSources) {
    logger.log(`Looking for source ${source.name}`);
    const existingSource = await flightSourceCollection.findOne({
      url: source.url,
    });

    if (!existingSource) {
      await flightSourceCollection.insertOne(source);
      logger.log(`Source ${source.name} successfully added`);
    } else {
      logger.log(`Source ${source.name} already exists, skipping`);
    }
  }
};
