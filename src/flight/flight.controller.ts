import { Controller, Get } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { FlightDto } from "./dto/flight.dto";
import { FlightService } from "./flight.service";

@ApiTags('flight')
@Controller('flight')
export class FlightController {
  constructor(private readonly flightService: FlightService) {}

  @Get()
  @ApiOperation({ summary: 'Retrieve flights' })
  @ApiResponse({
    status: 200,
    description: 'The list of flights has been successfully retrieved.',
    type: [FlightDto],
  })
  async getFlights(): Promise<FlightDto[]> { 
    return await this.flightService.fetchFlights();
  }
}