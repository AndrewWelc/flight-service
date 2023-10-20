import { cacheConfig } from "./../config/cache.config";
import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
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
  controllers: [AppController, FlightController],
  providers: [AppService, FlightService],
})
export class AppModule {}
