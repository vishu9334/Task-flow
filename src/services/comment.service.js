import { ApiError } from "../utils/apiError.js";
import { postgresCommentData } from "../data/implimentations/postgres.comment.data.js";
import { postgresTaskData } from "../data/implimentations/postgres.task.data.js";

class CommentService {
  constructor({ commentRepo = postgresCommentData, taskRepo = postgresTaskData } = {}) {
    this.commentRepo = commentRepo;
    this.taskRepo = taskRepo;
  }

  async createComment({ userId, orgId, taskId, content }) {
    if (!userId) {
      throw new ApiError(401, "Authentication required", [], "AUTHENTICATION_REQUIRED");
    }

    if (!taskId) {
      throw new ApiError(400, "Task ID is required", [], "VALIDATION_ERROR");
    }

    if (!content || typeof content !== "string" || content.trim().length === 0) {
      throw new ApiError(400, "Comment content is required", [], "VALIDATION_ERROR");
    }

    await this.#getAccessibleTask(taskId, orgId);

    return this.commentRepo.createComment({
      taskId,
      userId,
      content: content.trim(),
    });
  }

  async deleteComment({ userId, orgId, taskId, commentId }) {
    if (!userId) {
      throw new ApiError(401, "Authentication required", [], "AUTHENTICATION_REQUIRED");
    }

    if (!taskId || !commentId) {
      throw new ApiError(400, "Task ID and comment ID are required", [], "VALIDATION_ERROR");
    }

    await this.#getAccessibleTask(taskId, orgId);

    const deletedComment = await this.commentRepo.softDeleteComment({
      userId,
      taskId,
      commentId,
    });

    if (!deletedComment) {
      throw new ApiError(
        404,
        "Comment not found or you are not allowed to delete it",
        [],
        "COMMENT_NOT_FOUND"
      );
    }

    return deletedComment;
  }

  async #getAccessibleTask(taskId, orgId) {
    if (!orgId) {
      throw new ApiError(403, "Organization context is required", [], "ORGANIZATION_REQUIRED");
    }

    const task = await this.taskRepo.findTaskById(taskId);
    if (!task) {
      throw new ApiError(404, "Task not found", [], "TASK_NOT_FOUND");
    }

    if (task.project?.orgId !== orgId) {
      throw new ApiError(
        403,
        "Access to task belonging to another organization is forbidden",
        [],
        "CROSS_TENANT_ACCESS_FORBIDDEN"
      );
    }

    return task;
  }
}

const commentService = new CommentService();

export { CommentService, commentService };
