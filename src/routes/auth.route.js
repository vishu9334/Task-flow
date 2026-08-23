import { Router } from "express";
import { authController } from "../controllers/auth.controller.js";
import { authRateLimiter } from "../middleware/rate-limit.middleware.js";
import {
	validateLogin,
	validateLogout,
	validateOtp,
	validateRefresh,
	validateRegister,
} from "../middleware/validation.middleware.js";

const authRouter = Router();
authRouter.use(authRateLimiter);

authRouter.post("/register", validateRegister, authController.register);
authRouter.post("/login", validateLogin, authController.login);
authRouter.post("/refresh", validateRefresh, authController.refresh);
authRouter.post("/logout", validateLogout, authController.logout);
authRouter.post("/verify-otp", validateOtp, authController.verifyOtp);

export { authRouter };
