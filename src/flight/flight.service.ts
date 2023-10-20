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
import { Cache } from "cache-manager";
import { FlightDto } from "./dto/flight.dto";

@Injectable()
export class FlightService {
  private readonly logger = new Logger(FlightService.name);

  constructor(@Inject(CACHE_MANAGER) private readonly cacheManager: Cache, private configService: ConfigService) {}

  async fetchFlights(): Promise<FlightDto[]> {
    const source1Url = this.configService.get<string>('SOURCE1_URL');
    const source2Url = this.configService.get<string>('SOURCE2_URL');
    const cacheKey = this.configService.get<string>('CACHE_KEY_FLIGHTS');
    const cacheExpiry = this.configService.get<string>('CACHE_EXPIRY_TIME');

    this.logger.log("Fetching flights");

    let cachedFlights = await this.cacheManager.get<FlightDto[]>(cacheKey);
    if (cachedFlights) {
      this.logger.log("Flights retrieved from cache");
      return cachedFlights;
    }

    try {
      const source1Promise = axios.get(source1Url);
      const source2Promise = axios.get(source2Url);
      const [source1, source2] = await Promise.all([
        source1Promise,
        source2Promise,
      ]);

      const allFlights: FlightDto[] = [...source1.data.flights, ...source2.data.flights];
      const uniqueFlights: FlightDto[] = this.removeDuplicates(allFlights);

      await this.cacheManager.set(cacheKey, uniqueFlights, { ttl: Number(cacheExpiry) });

      this.logger.log("Flights fetched and cached");
      return uniqueFlights;
    } catch (error) {
      this.logger.error("Failed to fetch flight data", error.stack);
      throw new HttpException("Failed to fetch flight data", HttpStatus.INTERNAL_SERVER_ERROR);
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