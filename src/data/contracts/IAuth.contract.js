class IAuthRepository {
  async findUserByEmail(_email) {
    throw new Error('IAuthRepository.findUserByEmail must be implemented');
  }

  async findUserByUsername(_username) {
    throw new Error('IAuthRepository.findUserByUsername must be implemented');
  }

  async findUserById(_userId) {
    throw new Error('IAuthRepository.findUserById must be implemented');
  }

  async createUser(_userData) {
    throw new Error('IAuthRepository.createUser must be implemented');
  }

  async createOrganization(_organizationData) {
    throw new Error('IAuthRepository.createOrganization must be implemented');
  }

  async createOrganizationMember(_memberData) {
    throw new Error('IAuthRepository.createOrganizationMember must be implemented');
  }

  async findMembershipByUserId(_userId) {
    throw new Error('IAuthRepository.findMembershipByUserId must be implemented');
  }

  async createRefreshToken(_tokenData) {
    throw new Error('IAuthRepository.createRefreshToken must be implemented');
  }

  async findRefreshToken(_tokenHash) {
    throw new Error('IAuthRepository.findRefreshToken must be implemented');
  }

  async rotateRefreshToken(_oldTokenId, _newTokenData, _revokedAt) {
    throw new Error('IAuthRepository.rotateRefreshToken must be implemented');
  }

  async revokeRefreshToken(_tokenId, _revokedAt) {
    throw new Error('IAuthRepository.revokeRefreshToken must be implemented');
  }

  async revokeAllUserRefreshTokens(_userId, _revokedAt) {
    throw new Error('IAuthRepository.revokeAllUserRefreshTokens must be implemented');
  }

  async registerUserWithOrganization(_data) {
    throw new Error('IAuthRepository.registerUserWithOrganization must be implemented');
  }
  
  async markUserVerified(_userId) {
    throw new Error('IAuthRepository.markUserVerified must be implemented');
  }
}

export { IAuthRepository };
