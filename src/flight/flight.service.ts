import { CACHE_MANAGER } from "@nestjs/cache-manager";
import {
  Injectable,
  HttpException,
  HttpStatus,
  Inject,
  Logger,
  OnModuleInit,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectModel } from "@nestjs/mongoose";
import axios from "axios";
import axiosRetry from "axios-retry";
import { Cache } from "cache-manager";
import { Model } from "mongoose";
import { FlightDto } from "./dto/flight.dto";
import { GenericFlightSource } from "./sources/genericFlight.source";
import { IFlightSource } from "./interface/IFlightSource.interface";
import { FlightSource, FlightSourceDocument } from "./schema/flight-source.schema";

@Injectable()
export class FlightService implements OnModuleInit {
  private flightSources: IFlightSource[] = [];

  constructor(
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    private configService: ConfigService,
    @InjectModel(FlightSource.name)
    private readonly flightSourceModel: Model<FlightSourceDocument>
  ) {
    axiosRetry(axios, { retries: 3 }); // Retries the request up to 3 times
  }
  private readonly logger = new Logger(FlightService.name);

  async onModuleInit() {
    const sources = await this.flightSourceModel.find().exec();
    this.flightSources = sources.map((doc) => new GenericFlightSource(doc.url));
  }

  async fetchFlights(): Promise<FlightDto[]> {
    const cacheKey = this.configService.get<string>("CACHE_KEY_FLIGHTS");
    const cacheExpiry = Number(
      this.configService.get<string>("CACHE_EXPIRY_TIME")
    );

    this.logger.log("Fetching flights");

    let cachedFlights = await this.cacheManager.get<FlightDto[]>(cacheKey);
    if (cachedFlights) {
      this.logger.log("Flights retrieved from cache");
      return cachedFlights;
    }

    try {
      const flightDataFromAllSources = await Promise.all(
        this.flightSources.map((source) => source.fetchFlights())
      );

      const allFlights = flightDataFromAllSources.flat();
      const uniqueFlights = this.removeDuplicates(allFlights);

      await this.cacheManager.set(cacheKey, uniqueFlights, {
        ttl: cacheExpiry,
      });

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
