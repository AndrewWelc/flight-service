import { FlightDto } from "../dto/flight.dto";

export interface IFlightSource {
  fetchFlights(): Promise<FlightDto[]>;
}
