import {
  configureAxios,
  configureCircuitBreaker,
} from "./../utils/flightApi.utils";
import { Injectable, Logger, OnApplicationBootstrap } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Cron } from "@nestjs/schedule";
import { FlightService } from "./flight.service";
import * as CircuitBreaker from "opossum";

@Injectable()
export class FlightCronService implements OnApplicationBootstrap {
  private readonly logger = new Logger(FlightCronService.name);

  // Circuit breaker to handle failed external requests
  private breaker: CircuitBreaker;

  constructor(
    private flightService: FlightService,
    private configService: ConfigService
  ) {
    // Configure axios for retries
    configureAxios();

    // Initialize the circuit breaker
    this.breaker = configureCircuitBreaker(
      configService,
      this.fetchAndCacheFlights.bind(this)
    );

    // Set fallback function for the circuit breaker
    this.breaker.fallback(this.fetchFlightsFromCache.bind(this));
  }

  /**
   * This method is called when the application starts. It initializes flight data.
   */
  async onApplicationBootstrap() {
    await this.breaker.fire();
  }

  /**
   * This cron job runs every 55 minutes to fetch and cache flights.
   */
  @Cron("0 */55 * * * *")
  async handleCron() {
    try {
      // Execute the circuit breaker
      await this.breaker.fire();
    } catch (error) {
      this.logger.error("Error in breaker.fire():", error);
      // Handle fallback here if needed
    }
  }

  /**
   * Fetches flight data from various sources and caches it.
   * It handles its own errors, logging them and allowing the process to continue.
   */
  private async fetchAndCacheFlights() {
    try {
      const flights = await this.flightService.fetchAllFlightsFromSources();
      await this.flightService.cacheFlights(flights);
      this.logger.log("Fetched and cached flights");
    } catch (error) {
      this.logger.error("Error fetching and caching flights", error);
    }
  }

  /**
   * This method acts as a fallback for the circuit breaker.
   * When the breaker is open, this method will try to fetch cached flights
   * instead of making a network request.
   */
  private async fetchFlightsFromCache() {
    const flights = await this.flightService.fetchFlights();
    if (!flights || flights.length === 0) {
      this.logger.warn("No flights in fallback cache");
    }
  }
}
