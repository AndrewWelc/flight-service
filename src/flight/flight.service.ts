import { CACHE_MANAGER } from "@nestjs/cache-manager";
import {
  Injectable,
  HttpException,
  HttpStatus,
  Inject,
  Logger,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import axios from "axios";
import axiosRetry from "axios-retry";
import { Cache } from "cache-manager";
import { FlightDto } from "./dto/flight.dto";
import { IFlightService } from "./interface/IFlightService";

@Injectable()
export class FlightService implements IFlightService {
  private readonly logger = new Logger(FlightService.name);

  constructor(
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    private configService: ConfigService
  ) {
    axiosRetry(axios, { retries: 3 }); // Retries the request up to 3 times
  }

  async fetchFlights(): Promise<FlightDto[]> {
    const source1Url = this.configService.get<string>("SOURCE1_URL");
    const source2Url = this.configService.get<string>("SOURCE2_URL");
    const cacheKey = this.configService.get<string>("CACHE_KEY_FLIGHTS");
    const cacheExpiry = Number(this.configService.get<string>("CACHE_EXPIRY_TIME"));

    this.logger.log("Fetching flights");

    try {
      const [source1, source2] = await Promise.all([
        axios.get(source1Url, { timeout: 500 }),
        axios.get(source2Url, { timeout: 500 }),
      ]);

      const allFlights: FlightDto[] = [
        ...source1.data.flights,
        ...source2.data.flights,
      ];
      const uniqueFlights = this.removeDuplicates(allFlights);

      await this.cacheManager.set(cacheKey, uniqueFlights, { ttl: cacheExpiry });

      this.logger.log("Flights fetched and cached");
      return uniqueFlights;
    } catch (error) {
      this.logger.error("Failed to fetch flight data", error.stack);

      const cachedFlights = await this.cacheManager.get<FlightDto[]>(cacheKey);
      if (cachedFlights) {
        this.logger.log("Serving from fallback cache");
        return cachedFlights;
      }

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