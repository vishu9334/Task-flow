import { IAuthRepository } from "../contracts/IAuth.contract.js";
import { prisma } from "../prisma.js";

class PostgresAuthData extends IAuthRepository {
	constructor(client = prisma) {
		super();
		this.client = client;
	}

	async findUserByEmail(email) {
		return this.client.user.findUnique({
			where: { email },
		});
	}

	async findUserByUsername(username) {
		return this.client.user.findUnique({
			where: { username },
		});
	}

	async findUserById(memberId) {
		return this.client.user.findUnique({
			where: { id: memberId },
		});
	}

	async createUser(userData) {
		return this.client.user.create({
			data: userData,
		});
	}

	async createOrganization(organizationData) {
		return this.client.organization.create({
			data: organizationData,
		});
	}

	async createOrganizationMember(memberData) {
		return this.client.organizationMember.create({
			data: memberData,
		});
	}

	async findMembershipByMemberId(memberId) {
		return this.client.organizationMember.findMany({
			where: { userId: memberId },
			include: {
				organization: true,
			},
		});
	}

	async createRefreshToken(tokenData) {
		return this.client.refreshToken.create({
			data: tokenData,
		});
	}

	async findRefreshToken(tokenHash) {
		return this.client.refreshToken.findUnique({
			where: { tokenHash },
			include: { user: true },
		});
	}

	async rotateRefreshToken(oldTokenId, newTokenData, revokedAt = new Date()) {
		return this.client.$transaction(async (transaction) => {
			const revoked = await transaction.refreshToken.updateMany({
				where: { id: oldTokenId, revokedAt: null },
				data: { revokedAt },
			});

			if (revoked.count !== 1) {
				throw new Error("Refresh token has already been revoked");
			}

			return transaction.refreshToken.create({
				data: newTokenData,
			});
		});
	}

	async revokeRefreshToken(tokenId, revokedAt = new Date()) {
		return this.client.refreshToken.update({
			where: { id: tokenId },
			data: { revokedAt },
		});
	}

	async revokeAllUserRefreshTokens(memberId, revokedAt = new Date()) {
		return this.client.refreshToken.updateMany({
			where: {
				userId: memberId,
				revokedAt: null,
			},
			data: { revokedAt },
		});
	}

	async registerUserWithOrganization({ userData, organizationData, memberData }) {
		return this.client.$transaction(async (transaction) => {
			const user = await transaction.user.create({
				data: userData,
			});

			const organization = await transaction.organization.create({
				data: {
					...organizationData,
					userId: user.id,
				},
			});

			const member = await transaction.organizationMember.create({
				data: {
					...memberData,
					userId: user.id,
					organizationId: organization.id,
				},
			});

			return { user, organization, member };
		});
	}

	async markUserVerified(memberId) {
		return this.client.user.update({
			where: { id: memberId },
			data: { isVerified: true },
		});
	}
}

const postgresAuthData = new PostgresAuthData();

export { PostgresAuthData, postgresAuthData };
