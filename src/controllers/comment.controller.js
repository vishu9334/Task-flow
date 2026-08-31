import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { commentService } from "../services/comment.service.js";

class CommentController {
  constructor(service = commentService) {
    this.service = service;
    this.createComment = asyncHandler(this.createComment.bind(this));
    this.deleteComment = asyncHandler(this.deleteComment.bind(this));
  }

  async createComment(req, res) {
    const result = await this.service.createComment({
      // authenticate middleware reads the JWT from either the cookie or Bearer header.
      userId: req.user.sub,
      orgId: req.organizationId,
      taskId: req.params.id,
      content: req.body.content,
    });

    return res
      .status(201)
      .json(new ApiResponse(201, result, "Comment created successfully"));
  }

  async deleteComment(req, res) {
    const result = await this.service.deleteComment({
      // Never accept userId from req.body for a delete operation.
      userId: req.user.sub,
      orgId: req.organizationId,
      taskId: req.params.id,
      commentId: req.params.commentId,
    });

    return res
      .status(200)
      .json(new ApiResponse(200, result, "Comment deleted successfully"));
  }
}

const commentController = new CommentController();

export { CommentController, commentController };
