import { prisma } from "./prisma.js";

class Database {
  constructor(client) {
    this.client = client;
  }

  async connect() {
    try {
      await this.client.$connect();
      console.log("PostgreSQL connected successfully");
    } catch (error) {
      console.error("PostgreSQL connection failed:", error.message);
      throw error;
    }
  }

  async disconnect() {
    await this.client.$disconnect();
  }
}

const database = new Database(prisma);
const connectDB = () => database.connect();

export { Database, database, connectDB };
