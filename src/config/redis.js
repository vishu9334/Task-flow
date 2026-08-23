import Redis from "ioredis";
import config from "./config.js";

const redisUrl = config.REDIS_URL;

const redisConnection = new Redis(redisUrl, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  lazyConnect: false,
  ...(redisUrl.startsWith("rediss://") && {
    tls: {
      rejectUnauthorized: false,
    },
  }),
});

redisConnection.on("error", (err) => {
  console.warn(`[REDIS CONNECTION WARNING] ${err.message}. Ensure valid REDIS_URL is configured.`);
});

export { redisConnection };