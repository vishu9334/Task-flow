class IProjectRepository {
  async createProject(_projectData) {
    throw new Error('IProjectRepository.createProject must be implemented');
  }

  async findProjectById(_projectId, _options) {
    throw new Error('IProjectRepository.findProjectById must be implemented');
  }

  async findProjectByIdAndOrgId(_projectId, _orgId, _options) {
    throw new Error('IProjectRepository.findProjectByIdAndOrgId must be implemented');
  }

  async findProjectsByOrgId(_orgId, _paginationOptions) {
    throw new Error('IProjectRepository.findProjectsByOrgId must be implemented');
  }

  async countProjectsByOrgId(_orgId, _filterOptions) {
    throw new Error('IProjectRepository.countProjectsByOrgId must be implemented');
  }

  async updateProject(_projectId, _updateData) {
    throw new Error('IProjectRepository.updateProject must be implemented');
  }

  async countActiveTasksByProjectId(_projectId) {
    throw new Error('IProjectRepository.countActiveTasksByProjectId must be implemented');
  }

  async softDeleteProject(_projectId, _deletedAt) {
    throw new Error('IProjectRepository.softDeleteProject must be implemented');
  }
}

export { IProjectRepository };
