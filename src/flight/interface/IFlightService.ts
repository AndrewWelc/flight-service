import { FlightDto } from "../dto/flight.dto";

export interface IFlightService {
    fetchFlights(): Promise<FlightDto[]>;
  }