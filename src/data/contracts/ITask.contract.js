class ITaskRepository {
  async createTask(_taskData) {
    throw new Error("ITaskRepository.createTask must be implemented");
  }

  async findTaskById(_taskId, _options) {
    throw new Error("ITaskRepository.findTaskById must be implemented");
  }

  async findTaskByIdAndOrgId(_taskId, _orgId, _options) {
    throw new Error("ITaskRepository.findTaskByIdAndOrgId must be implemented");
  }

  async findTasksByOrgId(_orgId, _filterAndPaginationOptions) {
    throw new Error("ITaskRepository.findTasksByOrgId must be implemented");
  }

  async countTasksByOrgId(_orgId, _filterOptions) {
    throw new Error("ITaskRepository.countTasksByOrgId must be implemented");
  }

  async updateTask(_taskId, _updateData) {
    throw new Error("ITaskRepository.updateTask must be implemented");
  }

  async softDeleteTask(_taskId, _deletedAt) {
    throw new Error("ITaskRepository.softDeleteTask must be implemented");
  }

  async assignTask(_taskId, _userId) {
    throw new Error("ITaskRepository.assignTask must be implemented");
  }

  async unassignTask(_taskId, _userId) {
    throw new Error("ITaskRepository.unassignTask must be implemented");
  }

  async getDashboardCountsByOrgId(_orgId, _projectId) {
    throw new Error("ITaskRepository.getDashboardCountsByOrgId must be implemented");
  }

  async findMembership(_orgId, _userId) {
    throw new Error("ITaskRepository.findMembership must be implemented");
  }
}

export { ITaskRepository };
