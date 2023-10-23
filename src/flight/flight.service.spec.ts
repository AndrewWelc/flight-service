import { Test, TestingModule } from "@nestjs/testing";
import { FlightService } from "./flight.service";
import { ConfigService } from "@nestjs/config";
import { getModelToken } from "@nestjs/mongoose";
import { Cache } from "cache-manager";
import { FlightDto } from "./dto/flight.dto";
import { IFlightSource } from "./interface/IFlightSource.interface";
import * as fs from "fs";
import * as path from "path";
import { GenericFlightSource } from "./sources/genericFlight.source";

const mockFlightSourceModel = {
  find: jest.fn().mockReturnThis(),
  exec: jest.fn(),
};

const mockStore = {
  get: jest.fn(),
  set: jest.fn(),
};

const mockCacheManager: Cache = {
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
  reset: jest.fn(),
  wrap: jest.fn(),
  store: mockStore,
};

const mockConfigService = new ConfigService();

const sampleData = [
  { url: "https://coding-challenge.powerus.de/flight/source1" },
  { url: "https://coding-challenge.powerus.de/flight/source2" },
];

const mockFlightSource: IFlightSource = {
  fetchFlights: jest.fn().mockResolvedValue([]) as jest.MockedFunction<
    () => Promise<FlightDto[]>
  >,
};

beforeEach(() => {
  jest.resetAllMocks();
});

let mockFlightDto: FlightDto;
let allFlightsFlattened: FlightDto[];
let uniqueFlights: FlightDto[];

try {
  mockFlightDto = JSON.parse(
    fs.readFileSync(
      path.resolve(__dirname, "__mocks__", "flightData.json"),
      "utf-8"
    )
  );
  allFlightsFlattened = JSON.parse(
    fs.readFileSync(
      path.resolve(__dirname, "__mocks__", "allFlightsFlattened.json"),
      "utf-8"
    )
  );
  uniqueFlights = JSON.parse(
    fs.readFileSync(
      path.resolve(__dirname, "__mocks__", "uniqueFlights.json"),
      "utf-8"
    )
  );
} catch (err) {
  console.error("An error occurred:", err);
}

describe("FlightService", () => {
  let service: FlightService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FlightService,
        {
          provide: getModelToken("FlightSource"),
          useValue: mockFlightSourceModel,
        },
        {
          provide: "CACHE_MANAGER",
          useValue: mockCacheManager,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<FlightService>(FlightService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("onModuleInit", () => {
    it("should initialize flightSources", async () => {
      const expectedFlightSources = sampleData.map(
        (doc) => new GenericFlightSource(doc.url)
      );

      mockFlightSourceModel.exec.mockResolvedValueOnce(sampleData);
      mockFlightSourceModel.find.mockReturnThis();
      await service.onModuleInit();
      expect((service as any).flightSources).toEqual(expectedFlightSources);
    });
  });

  describe("fetchFlights", () => {
    it("should return cached flights if available", async () => {
      (
        mockCacheManager.get as jest.MockedFunction<typeof mockCacheManager.get>
      ).mockResolvedValueOnce([mockFlightDto]);
      const flights = await service.fetchFlights();
      expect(flights).toEqual([mockFlightDto]);
    });

    it("should return an empty array if no flights are cached", async () => {
      (
        mockCacheManager.get as jest.MockedFunction<typeof mockCacheManager.get>
      ).mockResolvedValueOnce(null);
      const flights = await service.fetchFlights();
      expect(flights).toEqual([]);
    });
  });

  describe("cacheFlights", () => {
    it("should cache the flights", async () => {
      await service.cacheFlights([mockFlightDto]);
      expect(mockCacheManager.set).toHaveBeenCalled();
    });
  });

  describe("removeDuplicates", () => {
    it("should remove duplicate flights", () => {
      const result = (service as any).removeDuplicates(allFlightsFlattened);
      expect(result).toEqual(uniqueFlights);
    });
  });

  describe("refreshFlightSources", () => {
    it("should refresh flight sources", async () => {
      const expectedFlightSources = sampleData.map(
        (doc) => new GenericFlightSource(doc.url)
      );

      mockFlightSourceModel.exec.mockResolvedValueOnce(sampleData);
      mockFlightSourceModel.find.mockReturnThis();
      await service.refreshFlightSources();
      expect((service as any).flightSources).toEqual(expectedFlightSources);
    });
  });

  describe("Error Handling", () => {
    it("should handle errors when fetching flight sources", async () => {
      (mockCacheManager.set as jest.Mock).mockRejectedValueOnce(
        new Error("Database Error")
      );

      try {
        mockFlightSourceModel.exec.mockResolvedValueOnce(sampleData);
        mockFlightSourceModel.find.mockReturnThis();
        await service.onModuleInit();
      } catch (e) {
        expect(e.message).toBe("Database Error");
      }
    });

    it("should handle cache set errors", async () => {
      (mockCacheManager.set as jest.Mock).mockRejectedValueOnce(
        new Error("Cache Error")
      );

      await expect(service.cacheFlights([mockFlightDto])).rejects.toThrow(
        "Cache Error"
      );
    });
  });

  describe("Invalid or Malformed Data", () => {
    it("should handle invalid flight data gracefully", async () => {
      const invalidData = {};
      mockFlightSource.fetchFlights = jest
        .fn()
        .mockResolvedValueOnce([invalidData as any]);

      const result = await service.fetchAllFlightsFromSources();
      expect(result).toEqual([]);
    });
  });

  describe("Edge Cases", () => {
    it("should return empty array if no flight sources", async () => {
      (service as any).flightSources = [];
      const result = await service.fetchAllFlightsFromSources();
      expect(result).toEqual([]);
    });
  });

  describe("Refresh Scenarios", () => {
    it("should refresh flight sources when database has changed", async () => {
      const newSampleData = [
        { url: "https://new-sample.com/source1" },
        { url: "https://new-sample.com/source2" },
      ];
      const newFlightSources = newSampleData.map(
        (doc) => new GenericFlightSource(doc.url)
      );

      mockFlightSourceModel.exec.mockResolvedValueOnce(newSampleData);
      mockFlightSourceModel.find.mockReturnThis();

      await service.refreshFlightSources();
      expect((service as any).flightSources).toEqual(newFlightSources);
    });
  });
});
