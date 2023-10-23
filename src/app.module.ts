import { cacheConfig } from "./../config/cache.config";
import { Module } from "@nestjs/common";
import { FlightService } from "./flight/flight.service";
import { FlightController } from "./flight/flight.controller";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { CacheModule } from "@nestjs/cache-manager";
import type { RedisClientOptions } from "redis";
import { MongooseModule } from "@nestjs/mongoose";
import {
  FlightSource,
  FlightSourceSchema,
} from "./flight/schema/flight-source.schema";
import { ScheduleModule } from "@nestjs/schedule";
import { FlightCronService } from "./flight/flight.cron";

@Module({
  imports: [
    CacheModule.register<RedisClientOptions>(cacheConfig),
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({ envFilePath: ".env", isGlobal: true }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => {
        if (config.get<string>("MONGO_CERT_PATH")) {
          return {
            uri: config.get<string>("MONGO_CONNECTION"),
            tls: true,
            tlsCertificateKeyFile: config.get<string>("MONGO_CERT_PATH"),
            authMechanism: "MONGODB-X509",
            dbName: config.get<string>("MONGO_DB"),
          };
        } else {
          return {
            uri: config.get<string>("MONGO_CONNECTION"),
            dbName: config.get<string>("MONGO_DB"),
          };
        }
      },
    }),
    MongooseModule.forFeature([
      { name: FlightSource.name, schema: FlightSourceSchema },
    ]),
  ],
  controllers: [FlightController],
  providers: [FlightService, FlightCronService],
})
export class AppModule {}
