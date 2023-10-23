import { CACHE_MANAGER } from "@nestjs/common/cache/cache.constants";
import { Injectable, Inject, Logger, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectModel } from "@nestjs/mongoose";
import { Cache } from "cache-manager";
import { Model } from "mongoose";
import { FlightDto } from "./dto/flight.dto";
import { GenericFlightSource } from "./sources/genericFlight.source";
import { IFlightSource } from "./interface/IFlightSource.interface";
import {
  FlightSource,
  FlightSourceDocument,
} from "./schema/flight-source.schema";

@Injectable()
export class FlightService implements OnModuleInit {
  private flightSources: IFlightSource[] = [];
  private readonly logger = new Logger(FlightService.name);

  constructor(
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    private configService: ConfigService,
    @InjectModel(FlightSource.name)
    private readonly flightSourceModel: Model<FlightSourceDocument>
  ) {}

  async onModuleInit() {
    // Initialize flight sources upon module initialization
    const sources = await this.flightSourceModel.find().exec();
    this.flightSources = sources.map((doc) => new GenericFlightSource(doc.url));
  }

  /**
   * Fetch cached flight data.
   */
  async fetchFlights(): Promise<FlightDto[]> {
    const cacheKey = this.configService.get<string>("CACHE_KEY_FLIGHTS");
    const flights = await this.cacheManager.get<FlightDto[]>(cacheKey);

    if (!flights) {
      this.logger.warn("No flights available in cache");
      return [];
    }
    return flights;
  }

  /**
   * Fetch all flights from various sources, remove duplicates and return.
   */
  async fetchAllFlightsFromSources(): Promise<FlightDto[]> {
    const flightDataFromAllSources = await Promise.all(
      this.flightSources.map((source) => source.fetchFlights())
    );
    const allFlights = flightDataFromAllSources.flat();
    return this.removeDuplicates(allFlights);
  }

  /**
   * Cache the provided flight data.
   */
  async cacheFlights(flights: FlightDto[]) {
    const cacheKey = this.configService.get<string>("CACHE_KEY_FLIGHTS");
    const cacheExpiry = Number(
      this.configService.get<string>("CACHE_EXPIRY_TIME")
    );
    await this.cacheManager.set(cacheKey, flights, { ttl: cacheExpiry });
  }

  /**
   * Remove duplicate flights based on unique identifiers.
   */
  private removeDuplicates(flights: FlightDto[]): FlightDto[] {
    const flightIdentifiers = new Set<string>();
    const uniqueFlights: FlightDto[] = [];

    flights.forEach((flight) => {
      let isUniqueFlight = false;
      for (const slice of flight.slices) {
        const identifier = `${slice.flight_number}_${slice.departure_date_time_utc}`;
        if (!flightIdentifiers.has(identifier)) {
          flightIdentifiers.add(identifier);
          isUniqueFlight = true;
        }
      }
      if (isUniqueFlight) {
        uniqueFlights.push(flight);
      }
    });

    return uniqueFlights;
  }

  /**
   * Refreshes the flight sources from the database.
   */
  async refreshFlightSources() {
    const sources = await this.flightSourceModel.find().exec();
    this.flightSources = sources.map((doc) => new GenericFlightSource(doc.url));
    this.logger.log("Refreshed flight sources");
  }
}
