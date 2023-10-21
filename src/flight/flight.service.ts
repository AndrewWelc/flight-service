import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Injectable, Inject, Logger, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectModel } from "@nestjs/mongoose";
import axios from "axios";
import axiosRetry from "axios-retry";
import { Cache } from "cache-manager";
import { Model } from "mongoose";
import { FlightDto } from "./dto/flight.dto";
import { GenericFlightSource } from "./sources/genericFlight.source";
import { IFlightSource } from "./interface/IFlightSource.interface";
import {
  FlightSource,
  FlightSourceDocument,
} from "./schema/flight-source.schema";
import * as CircuitBreaker from "opossum";

@Injectable()
export class FlightService implements OnModuleInit {
  private flightSources: IFlightSource[] = [];
  
  // Circuit breaker to handle failed external requests
  private readonly breaker: CircuitBreaker;

  constructor(
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    private configService: ConfigService,
    @InjectModel(FlightSource.name)
    private readonly flightSourceModel: Model<FlightSourceDocument>
  ) {
    // Configure axios retry settings
    axiosRetry(axios, {
      retries: 2,
      retryDelay: axiosRetry.exponentialDelay,
    });

    // Initialize the circuit breaker with configurations from environment
    const timeout = Number(this.configService.get("BREAKER_TIMEOUT"));
    const errorThresholdPercentage = Number(
      this.configService.get("ERROR_THRESHOLD_PERCENTAGE")
    );
    const resetTimeout = Number(this.configService.get("RESET_TIMEOUT"));

    this.breaker = new CircuitBreaker(this.fetchAllFlightsFromSources, {
      timeout,
      errorThresholdPercentage,
      resetTimeout,
    });
    // Set fallback function for the circuit breaker
    this.breaker.fallback(() => this.fetchFlightsFromCache());
  }

  private readonly logger = new Logger(FlightService.name);

  async onModuleInit() {
    // Initialize flight sources upon module initialization
    const sources = await this.flightSourceModel.find().exec();
    this.flightSources = sources.map((doc) => new GenericFlightSource(doc.url));
  }

  async fetchFlights(): Promise<FlightDto[]> {
    const cacheKey = this.configService.get<string>("CACHE_KEY_FLIGHTS");
    const cacheExpiry = Number(this.configService.get<string>("CACHE_EXPIRY_TIME"));

    this.logger.log("Fetching flights");
    const flights = (await this.breaker.fire()) as FlightDto[];

    // Cache the fetched flights
    await this.cacheManager.set(cacheKey, flights, { ttl: cacheExpiry });
    this.logger.log("Flights fetched and cached");

    return flights;
  }

  // Fetch all flights from various sources and flatten them
  private async fetchAllFlightsFromSources(): Promise<FlightDto[]> {
    const flightDataFromAllSources = await Promise.all(
      this.flightSources.map((source) => source.fetchFlights())
    );
    const allFlights = flightDataFromAllSources.flat();
    return this.removeDuplicates(allFlights);
  }

  // Retrieve cached flights if the circuit breaker activates the fallback
  private async fetchFlightsFromCache(): Promise<FlightDto[]> {
    const cacheKey = this.configService.get<string>("CACHE_KEY_FLIGHTS");
    const cachedFlights = await this.cacheManager.get<FlightDto[]>(cacheKey);
    if (cachedFlights) {
      return cachedFlights;
    }
    throw new Error("No flights in fallback cache");
  }

  // Remove duplicate flights based on unique identifiers
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
}
