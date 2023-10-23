import axios from "axios";
import axiosRetry from "axios-retry";
import * as CircuitBreaker from "opossum";
import { ConfigService } from "@nestjs/config";

export const configureAxios = () => {
  axiosRetry(axios, {
    retries: 2,
    retryDelay: axiosRetry.exponentialDelay,
  });
};

export const configureCircuitBreaker = <
  TI extends unknown[] = unknown[],
  TR = unknown
>(
  configService: ConfigService,
  targetFunction: (...args: TI) => Promise<TR>
): CircuitBreaker<TI, TR> => {
  const timeout = Number(configService.get("BREAKER_TIMEOUT"));
  const errorThresholdPercentage = Number(
    configService.get("ERROR_THRESHOLD_PERCENTAGE")
  );
  const resetTimeout = Number(configService.get("RESET_TIMEOUT"));

  const breaker = new CircuitBreaker<TI, TR>(targetFunction, {
    timeout,
    errorThresholdPercentage,
    resetTimeout,
  });

  return breaker;
};
