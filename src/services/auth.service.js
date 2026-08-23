import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import config from "../config/config.js";
import { postgresAuthData } from "../data/implimentations/postgres.auth.data.js";
import { redisConnection } from "../config/redis.js";
import { emailQueue } from "../queue/email.queue.js";
import { generateOtp } from "../config/OTP.js";
import { ApiError } from "../utils/apiError.js";

const publicUserFields = {
	id: true,
	firstName: true,
	lastName: true,
	username: true,
	email: true,
	role: true,
	isActive: true,
	isVerified: true,
	createdAt: true,
};

class AuthService {
	constructor({ repository = postgresAuthData, settings = config } = {}) {
		this.repository = repository;
		this.config = settings;
	}

	async register({
		firstName,
		lastName,
		username,
		email,
		password,
	}) {
		email = email.trim().toLowerCase();
		if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
			throw new ApiError(400, "Invalid email format", [], "INVALID_EMAIL");
		}
		const resolvedUsername = username?.trim() || email.split("@")[0];
		const existingUser = await this.repository.findUserByEmail(email);

		if (existingUser) {
			throw new ApiError(409, "Email is already registered", [], "EMAIL_EXISTS");
		}

		const existingUsername = await this.repository.findUserByUsername(resolvedUsername);
		if (existingUsername) {
			throw new ApiError(409, "Username is already registered", [], "USERNAME_EXISTS");
		}

		const passwordHash = await bcrypt.hash(password, this.config.BCRYPT_SALT_ROUNDS);
		const userData = {
			firstName,
			lastName,
			username: resolvedUsername,
			email,
			passwordHash,
		};

		const verificationOtp = generateOtp();
		await redisConnection.set(
			`pending-registration:${email}`,
			JSON.stringify(userData),
			"EX",
			this.config.REGISTRATION_TTL_SECONDS,
		);
		await redisConnection.set(
			`otp:${email}`,
			verificationOtp,
			"EX",
			this.config.REGISTRATION_TTL_SECONDS,
		);
		await emailQueue.add("send-otp", {
			type: "OTP",
			toEmail: email,
			otp: verificationOtp,
		});

		return {
			user: {
				firstName: userData.firstName,
				lastName: userData.lastName,
				username: userData.username,
				email: userData.email,
				isVerified: false,
			},
			organization: null,
			isVerified: false,
		};
	}

	async login({ email, password }) {
		const normalizedEmail = email ? email.trim().toLowerCase() : "";
		const user = await this.repository.findUserByEmail(normalizedEmail);

		if (!user || !user.isActive || !user.isVerified) {
			throw new ApiError(401, "Invalid email or password", [], "INVALID_CREDENTIALS");
		}

		const passwordMatches = await bcrypt.compare(password, user.passwordHash);

		if (!passwordMatches) {
			throw new ApiError(401, "Invalid email or password", [], "INVALID_CREDENTIALS");
		}

		const memberships = await this.repository.findMembershipByUserId(user.id);
		const organization = memberships[0]?.organization;

		return this.#createAuthResponse(user, organization);
	}

	async verifyOtp({ email, otp }) {
		if (!email || !otp) {
			throw new ApiError(400, "Email and OTP are required", [], "OTP_REQUIRED");
		}

		const storedOtp = await redisConnection.get(`otp:${email}`);
		if (!storedOtp || String(storedOtp) !== String(otp)) {
			throw new ApiError(400, "Invalid or expired OTP", [], "INVALID_OTP");
		}

		const pendingRegistration = await redisConnection.get(`pending-registration:${email}`);
		if (!pendingRegistration) {
			throw new ApiError(400, "Registration has expired", [], "REGISTRATION_EXPIRED");
		}

		let userData;
		try {
			userData = typeof pendingRegistration === "string"
				? JSON.parse(pendingRegistration)
				: pendingRegistration;
		} catch {
			throw new ApiError(400, "Invalid registration data", [], "INVALID_REGISTRATION");
		}

		const existingUser = await this.repository.findUserByEmail(email);
		if (existingUser) {
			throw new ApiError(409, "Email is already registered", [], "EMAIL_EXISTS");
		}

		const existingUsername = await this.repository.findUserByUsername(userData.username);
		if (existingUsername) {
			throw new ApiError(409, "Username is already registered", [], "USERNAME_EXISTS");
		}

		const verifiedUser = await this.repository.createUser({
			...userData,
			isVerified: true,
		});

		await redisConnection.del(`otp:${email}`);
		await redisConnection.del(`pending-registration:${email}`);

		return this.#createAuthResponse(verifiedUser, null);
	}

	async refresh(refreshToken) {
		if (!refreshToken) {
			throw new ApiError(401, "Refresh token is required");
		}

		const tokenHash = this.#hashToken(refreshToken);
		const storedToken = await this.repository.findRefreshToken(tokenHash);

		if (!storedToken || storedToken.revokedAt || new Date(storedToken.expiresAt) <= new Date()) {
			throw new ApiError(401, "Invalid or expired refresh token");
		}

		const memberships = await this.repository.findMembershipByUserId(storedToken.userId);
		const organization = memberships[0]?.organization;
		const accessToken = this.#signAccessToken(storedToken.user, organization);
		const nextRefreshToken = crypto.randomBytes(48).toString("hex");
		const nextRefreshTokenHash = this.#hashToken(nextRefreshToken);
		const nextExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

		try {
			await this.repository.rotateRefreshToken(
				storedToken.id,
				{
					userId: storedToken.userId,
					tokenHash: nextRefreshTokenHash,
					expiresAt: nextExpiresAt,
				},
				new Date(),
			);
		} catch {
			throw new ApiError(401, "Invalid refresh token", [], "INVALID_REFRESH_TOKEN");
		}

		return {
			accessToken,
			refreshToken: nextRefreshToken,
		};
	}

	async logout(refreshToken) {
		if (!refreshToken) {
			return { success: true };
		}

		const storedToken = await this.repository.findRefreshToken(this.#hashToken(refreshToken));

		if (storedToken && !storedToken.revokedAt) {
			await this.repository.revokeRefreshToken(storedToken.id, new Date());
		}

		return { success: true };
	}

	async #createAuthResponse(user, organization) {
		const accessToken = this.#signAccessToken(user, organization);
		const refreshToken = crypto.randomBytes(48).toString("hex");
		const refreshTokenHash = this.#hashToken(refreshToken);
		const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

		await this.repository.createRefreshToken({
			userId: user.id,
			tokenHash: refreshTokenHash,
			expiresAt,
		});

		return {
			user: this.#sanitizeUser(user),
			organization: organization || null,
			accessToken,
			refreshToken,
		};
	}

	#signAccessToken(user, organization) {
		return jwt.sign(
			{
				sub: user.id,
				role: user.role,
				organizationId: organization?.id || null,
			},
			this.config.JWT_ACCESS_SECRET,
			{ expiresIn: this.config.JWT_ACCESS_EXPIRES_IN },
		);
	}

	#hashToken(token) {
		return crypto.createHash("sha256").update(token).digest("hex");
	}

	#sanitizeUser(user) {
		return Object.fromEntries(
			Object.entries(user).filter(([field]) => publicUserFields[field]),
		);
	}
}

const authService = new AuthService();

export { AuthService, authService };
