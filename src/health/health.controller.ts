import { Controller, Get } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import {
  HealthCheck,
  HealthCheckService,
  MemoryHealthIndicator,
  MongooseHealthIndicator,
} from "@nestjs/terminus";

@ApiTags("health")
@Controller("health")
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private memory: MemoryHealthIndicator,
    private mongoose: MongooseHealthIndicator
  ) {}

  @Get()
  @ApiOperation({ summary: "Health check" })
  @HealthCheck()
  check() {
    return this.health.check([
      async () => this.memory.checkHeap("memory_heap", 200 * 1024 * 1024),
      async () => this.memory.checkRSS("memory_rss", 3000 * 1024 * 1024),
      async () => this.mongoose.pingCheck("mongoose"),
    ]);
  }
}
