import { authService } from "../services/auth.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/apiResponse.js";
import {
  clearAuthCookies,
  setAuthCookies,
  withoutTokens,
} from "../utils/authCookies.js";

class AuthController {
  constructor(service = authService) {
    this.service = service;

    this.register = asyncHandler(this.register.bind(this));
    this.login = asyncHandler(this.login.bind(this));
    this.refresh = asyncHandler(this.refresh.bind(this));
    this.logout = asyncHandler(this.logout.bind(this));
    this.verifyOtp = asyncHandler(this.verifyOtp.bind(this));
  }

  async register(req, res) {
    const result = await this.service.register(req.body);

    return res
      .status(201)
      .json(new ApiResponse(201, result, "Registration successful"));
  }

  async login(req, res) {
    const result = await this.service.login(req.body);
    setAuthCookies(res, result, this.service.config.NODE_ENV === "production");

    return res
      .status(200)
      .json(new ApiResponse(200, withoutTokens(result), "Login successful"));
  }

  async refresh(req, res) {
    const refreshToken = req.cookies?.refreshToken || req.body.refreshToken;
    const result = await this.service.refresh(refreshToken);
    setAuthCookies(res, result, this.service.config.NODE_ENV === "production");

    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Access token refreshed"));
  }

  async logout(req, res) {
    const refreshToken = req.cookies?.refreshToken || req.body.refreshToken;
    const result = await this.service.logout(refreshToken);
    
   // Here  clearAuthCookies(res); of res is object and where logic write in the impliment that place have object to extract cookie like res.clearCookie.
    clearAuthCookies(res);

    return res
      .status(200)
      .json(new ApiResponse(200, result, "Logout successful"));
  }

  async verifyOtp(req, res) {
    const result = await this.service.verifyOtp(req.body);
    setAuthCookies(res, result, this.service.config.NODE_ENV === "production");

    return res
      .status(200)
      .json(new ApiResponse(200, withoutTokens(result), "Email verified successfully"));
  }
}

const authController = new AuthController();

export { AuthController, authController };
