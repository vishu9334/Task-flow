import { ApiError } from "../utils/apiError.js";

const validateRequired = (fields) => (req, _res, next) => {
  const missingFields = fields.filter((field) => {
    const value = req.body?.[field];
    return value === undefined || value === null || value === "";
  });

  if (missingFields.length) {
    return next(new ApiError(400, "Required fields are missing", [], "VALIDATION_ERROR", { missingFields }));
  }

  return next();
};

const validateRegister = validateRequired([
  "firstName",
  "lastName",
  "email",
  "password",
]);

const validateLogin = validateRequired(["email", "password"]);

const validateTokenRequest = (req, _res, next) => {
  if (req.body?.refreshToken || req.cookies?.refreshToken) {
    return next();
  }

  return next(new ApiError(400, "Refresh token is required", [], "VALIDATION_ERROR"));
};

const validateRefresh = validateTokenRequest;
const validateLogout = validateTokenRequest;

const validateOtp = validateRequired(["email", "otp"]);

export {
  validateRegister,
  validateLogin,
  validateRefresh,
  validateLogout,
  validateOtp,
};