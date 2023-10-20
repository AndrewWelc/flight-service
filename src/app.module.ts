import { cacheConfig } from "./../config/cache.config";
import { Module } from "@nestjs/common";
import { FlightService } from "./flight/flight.service";
import { FlightController } from "./flight/flight.controller";
import { ConfigModule } from "@nestjs/config";
import { CacheModule } from "@nestjs/cache-manager";
import type { RedisClientOptions } from "redis";

@Module({
  imports: [
    CacheModule.register<RedisClientOptions>(cacheConfig),
    ConfigModule.forRoot({ envFilePath: ".env", isGlobal: true }),
  ],
  controllers: [FlightController],
  providers: [FlightService],
})
export class AppModule {}
