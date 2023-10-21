import axios from 'axios';
import { FlightDto } from '../dto/flight.dto';
import { IFlightSource } from '../interface/IFlightSource.interface';

export class GenericFlightSource implements IFlightSource {
  constructor(private url: string) {}

  async fetchFlights(): Promise<FlightDto[]> {
    const response = await axios.get(this.url);
    return response.data.flights;
  }
}
