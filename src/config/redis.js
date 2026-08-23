import Redis from "ioredis";
import config from "./config.js";

const redisUrl = config.REDIS_URL;

const redisOptions = {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  retryStrategy: (times) => Math.min(times * 200, 3000),
  ...(redisUrl.startsWith("rediss://") && {
    tls: {
      rejectUnauthorized: false,
    },
  }),
};

const redisConnection = new Redis(redisUrl, redisOptions);

redisConnection.on("error", (err) => {
  console.warn(`[REDIS CONNECTION WARNING] ${err.message}.`);
});

export { redisConnection, redisOptions };