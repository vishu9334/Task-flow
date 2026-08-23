import prismaPackage from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import config from "../config/config.js";

const { PrismaClient } = prismaPackage;

const adapter = new PrismaPg({
  connectionString: config.POSTGRES_URI,
});

export const prisma = new PrismaClient({
  adapter,
});
