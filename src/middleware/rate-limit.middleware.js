import rateLimit from "express-rate-limit";
import config from "../config/config.js";

const authRateLimiter = rateLimit({
  windowMs: config.AUTH_RATE_WINDOW_MS,
  limit: config.AUTH_RATE_LIMIT,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  handler: (_req, res) => {
    return res.status(429).json({
      error: "Too many authentication requests",
      code: "AUTH_RATE_LIMIT_EXCEEDED",
      details: {},
    });
  },
});

export { authRateLimiter };
