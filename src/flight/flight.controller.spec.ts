import { Test, TestingModule } from '@nestjs/testing';
import { FlightController } from './flight.controller';
import { FlightService } from './flight.service';

describe('FlightController', () => {
  let controller: FlightController;

  beforeEach(async () => {
    const mockFlightService = {
      fetchFlights: jest.fn().mockResolvedValue([]),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [FlightController],
      providers: [
        {
          provide: FlightService,
          useValue: mockFlightService,
        },
      ],
    }).compile();

    controller = module.get<FlightController>(FlightController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
