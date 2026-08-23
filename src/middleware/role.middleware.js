import { ApiError } from "../utils/apiError.js";

const requireRoles = (...allowedRoles) => (req, _res, next) => {
  const role = req.membership?.role || req.user?.role;

  if (!allowedRoles.includes(role)) {
    return next(new ApiError(403, "Insufficient permissions", [], "FORBIDDEN"));
  }

  return next();
};

export { requireRoles };