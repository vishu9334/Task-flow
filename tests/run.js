import { after } from "node:test";
import { redisConnection } from "../src/config/redis.js";
import { prisma } from "../src/data/prisma.js";

// Import all test suites
await import("./unit/auth.test.js");
await import("./unit/task.test.js");
await import("./unit/pagination.test.js");
await import("./integration/auth.test.js");
await import("./integration/cross-tenant.test.js");
await import("./integration/task.test.js");

after(async () => {
  try {
    await prisma.$disconnect();
    redisConnection.disconnect();
  } catch (_e) {}
});
