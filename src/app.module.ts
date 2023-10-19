import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { FlightService } from './flight/flight.service';
import { FlightController } from './flight/flight.controller';

@Module({
  imports: [],
  controllers: [AppController, FlightController],
  providers: [AppService, FlightService],
})
export class AppModule {}
