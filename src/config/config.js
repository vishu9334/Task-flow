import dotenv from "dotenv";
dotenv.config();

class AppConfig {
  constructor(env = process.env) {
    this.POSTGRES_URI = env.DATABASE_URL;
    this.PORT = Number(env.PORT || 4000);
    this.REDIS_URL = env.REDIS_URL || "redis://localhost:6379";
    this.BREVO_API_KEY = env.BREVO_API_KEY;
    this.BREVO_FROM_NAME = env.BREVO_FROM_NAME || "TaskFlow";
    this.BREVO_FROM_EMAIL = env.BREVO_FROM_EMAIL;
    this.JWT_ACCESS_SECRET = env.JWT_ACCESS_SECRET;
    this.JWT_REFRESH_SECRET = env.JWT_REFRESH_SECRET;
    this.JWT_ACCESS_EXPIRES_IN = env.JWT_ACCESS_EXPIRES_IN || "15m";
    this.JWT_REFRESH_EXPIRES_IN = env.JWT_REFRESH_EXPIRES_IN || "7d";
    this.BCRYPT_SALT_ROUNDS = Number(env.BCRYPT_SALT_ROUNDS || 12);
    this.AUTH_RATE_LIMIT = Number(env.AUTH_RATE_LIMIT || 10);
    this.AUTH_RATE_WINDOW_MS = Number(env.AUTH_RATE_WINDOW_MS || 60000);
    this.REGISTRATION_TTL_SECONDS = Number(env.REGISTRATION_TTL_SECONDS || 120);
    this.QUEUE_PORT = Number(env.QUEUE_PORT)
    this.NODE_ENV = env.NODE_ENV || "development";
  }

  validate() {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const requiredValues = {
      DATABASE_URL: this.POSTGRES_URI,
      JWT_ACCESS_SECRET: this.JWT_ACCESS_SECRET,
      JWT_REFRESH_SECRET: this.JWT_REFRESH_SECRET,
      BREVO_API_KEY: this.BREVO_API_KEY,
      BREVO_FROM_EMAIL: this.BREVO_FROM_EMAIL,
    };

    for (const [name, value] of Object.entries(requiredValues)) {
      if (!value) {
        throw new Error(`${name} is required`);
      }
    }

    if (!Number.isInteger(this.PORT) || this.PORT < 1 || this.PORT > 65535) {
      throw new Error("PORT must be a valid TCP port");
    }

    if (!this.REDIS_URL) {
      throw new Error("REDIS_URL is required");
    }

    if (!emailPattern.test(this.BREVO_FROM_EMAIL)) {
      throw new Error("BREVO_FROM_EMAIL must be a valid email address");
    }

    if (!Number.isInteger(this.BCRYPT_SALT_ROUNDS) || this.BCRYPT_SALT_ROUNDS < 12) {
      throw new Error("BCRYPT_SALT_ROUNDS must be an integer of at least 12");
    }

    if (!Number.isInteger(this.AUTH_RATE_LIMIT) || this.AUTH_RATE_LIMIT < 1) {
      throw new Error("AUTH_RATE_LIMIT must be a positive integer");
    }

    if (!Number.isInteger(this.AUTH_RATE_WINDOW_MS) || this.AUTH_RATE_WINDOW_MS < 1000) {
      throw new Error("AUTH_RATE_WINDOW_MS must be at least 1000 milliseconds");
    }

    if (!Number.isInteger(this.REGISTRATION_TTL_SECONDS) || this.REGISTRATION_TTL_SECONDS < 60) {
      throw new Error("REGISTRATION_TTL_SECONDS must be at least 60 seconds");
    }

    return this;
  }
}

const config = new AppConfig().validate();

export { AppConfig, config };
export default config;
