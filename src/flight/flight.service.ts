import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Injectable, HttpException, HttpStatus, Inject, Logger } from "@nestjs/common";
import axios from "axios";
import { Cache } from "cache-manager";

@Injectable()
export class FlightService {
  private readonly logger = new Logger(FlightService.name);

  constructor(@Inject(CACHE_MANAGER) private readonly cacheManager: Cache) {}

  async fetchFlights() {
    this.logger.log("Fetching flights");

    let cachedFlights = await this.cacheManager.get("flights");
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
      const uniqueFlights = this.removeDuplicates(allFlights);

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

  removeDuplicates(flights) {
    const flightMap = {};
    const uniqueFlights = [];

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
