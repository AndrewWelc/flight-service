import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class FlightService {
  private cache: any = {};
  private cacheExpireTime: any = {};

  async fetchFlights() {
    // Check if the data exists in cache and is not expired
    if (this.cache['flights'] && new Date().getTime() < this.cacheExpireTime['flights']) {
      return this.cache['flights'];
    }

    try {
      const source1Promise = axios.get('https://coding-challenge.powerus.de/flight/source1');
      const source2Promise = axios.get('https://coding-challenge.powerus.de/flight/source2');
      const [source1, source2] = await Promise.all([source1Promise, source2Promise]);
      
      // Merge flights from both sources
      const allFlights = [...source1.data.flights, ...source2.data.flights];

      // Remove duplicates based on flight numbers and dates
      const uniqueFlights = this.removeDuplicates(allFlights);
      
      // Cache the data for an hour
      this.cache['flights'] = uniqueFlights;
      this.cacheExpireTime['flights'] = new Date().getTime() + 60 * 60 * 1000; // 1 hour in milliseconds

      return uniqueFlights;
    } catch (error) {
      throw new HttpException('Failed to fetch flight data', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  removeDuplicates(flights) {
    const flightMap = {};
    const uniqueFlights = [];

    flights.forEach(flight => {
      flight.slices.forEach(slice => {
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
