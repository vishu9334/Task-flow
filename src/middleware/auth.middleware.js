import jwt from "jsonwebtoken";
import config from "../config/config.js";
import { ApiError } from "../utils/apiError.js";

class AuthMiddleware {
  static authenticate(req, _res, next) {
    const authorization = req.headers.authorization;
    const token = authorization?.startsWith("Bearer ")
      ? authorization.slice(7)
      : req.cookies?.accessToken || null;

    if (!token) {
      return next(new ApiError(401, "Authentication required", [], "AUTHENTICATION_REQUIRED"));
    }

    try {
      req.user = jwt.verify(token, config.JWT_ACCESS_SECRET);
      return next();
    } catch {
      return next(new ApiError(401, "Invalid or expired access token", [], "INVALID_ACCESS_TOKEN"));
    }
  }
}

const authenticate = (req, res, next) => AuthMiddleware.authenticate(req, res, next);

export { AuthMiddleware, authenticate };