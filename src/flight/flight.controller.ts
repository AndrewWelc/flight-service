import { Controller, Get } from '@nestjs/common';
import { FlightService } from './flight.service';

@Controller('flight')
export class FlightController {
  constructor(private readonly flightService: FlightService) {}

  @Get()
  async getFlights() {
    return await this.flightService.fetchFlights();
  }
}
