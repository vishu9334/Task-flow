class IOrganizationRepository {
  async createOrganization(_organizationData) {
    throw new Error("IOrganizationRepository.createOrganization must be implemented");
  }

  async findOrganizationById(_id) {
    throw new Error("IOrganizationRepository.findOrganizationById must be implemented");
  }

  async findOrganizationBySlug(_slug) {
    throw new Error("IOrganizationRepository.findOrganizationBySlug must be implemented");
  }

  async findOrganizationsByMemberId(_memberId) {
    throw new Error("IOrganizationRepository.findOrganizationsByMemberId must be implemented");
  }

  async addMember(_memberData) {
    throw new Error("IOrganizationRepository.addMember must be implemented");
  }

  async findMembersByOrgId(_orgId) {
    throw new Error("IOrganizationRepository.findMembersByOrgId must be implemented");
  }

  async findMembership(_orgId, _memberId) {
    throw new Error("IOrganizationRepository.findMembership must be implemented");
  }
}

export { IOrganizationRepository };
