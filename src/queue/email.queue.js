import { Queue } from "bullmq";
import config from "../config/config.js";
import { redisConnection } from "../config/redis.js";

const emailQueue = new Queue("email-notifications", {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 1000,
    },
    removeOnComplete: true,
  },
});

console.log(`Email queue configured for ${config.REDIS_URL}`);

export { emailQueue };