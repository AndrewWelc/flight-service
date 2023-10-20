import { CACHE_MANAGER } from "@nestjs/cache-manager";
import {
  Injectable,
  HttpException,
  HttpStatus,
  Inject,
  Logger,
} from "@nestjs/common";
import axios from "axios";
import { Cache } from "cache-manager";
import { FlightDto } from "./dto/flight.dto";

@Injectable()
export class FlightService {
  private readonly logger = new Logger(FlightService.name);

  constructor(@Inject(CACHE_MANAGER) private readonly cacheManager: Cache) {}

  async fetchFlights(): Promise<FlightDto[]> {
    this.logger.log("Fetching flights");

    const cachedFlights: FlightDto[] = await this.cacheManager.get("flights");
    if (cachedFlights) {
      this.logger.log("Flights retrieved from cache");
      return cachedFlights;
    }

    try {
      const source1Promise = axios.get(
        "https://coding-challenge.powerus.de/flight/source1"
      );
      const source2Promise = axios.get(
        "https://coding-challenge.powerus.de/flight/source2"
      );
      const [source1, source2] = await Promise.all([
        source1Promise,
        source2Promise,
      ]);

      const allFlights = [...source1.data.flights, ...source2.data.flights];
      const uniqueFlights: FlightDto[] = this.removeDuplicates(allFlights);

      await this.cacheManager.set("flights", uniqueFlights, 3600); // Cache for 1 hour

      this.logger.log("Flights fetched and cached");

      return uniqueFlights;
    } catch (error) {
      this.logger.error("Failed to fetch flight data", error.stack);
      throw new HttpException(
        "Failed to fetch flight data",
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  removeDuplicates(flights: FlightDto[]): FlightDto[] {
    const flightMap: { [key: string]: boolean } = {};
    const uniqueFlights: FlightDto[] = [];

    flights.forEach((flight) => {
      flight.slices.forEach((slice) => {
        const identifier = `${slice.flight_number}_${slice.departure_date_time_utc}`;
        if (!flightMap[identifier]) {
          flightMap[identifier] = true;
          uniqueFlights.push(flight);
        }
      });
    });

    return uniqueFlights;
  }
}
