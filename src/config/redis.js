import Redis from "ioredis";
import config from "./config.js";

const redisUrl = config.REDIS_URL;

const redisConnection = new Redis(redisUrl, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  ...(redisUrl.startsWith("rediss://") && {
    tls: {},
  }),
});

export { redisConnection };