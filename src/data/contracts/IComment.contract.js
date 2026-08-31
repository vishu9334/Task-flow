class ICommentRepository{
  async createComment(_commentData) {
    throw new Error("ICommentRepository.createComment must be implemented");
  }

  async softDeleteComment(_commentData) {
    throw new Error("ICommentRepository.softDeleteComment must be implemented");
  }
}

export { ICommentRepository };
