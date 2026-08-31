import { prisma } from "../prisma.js";
import { ICommentRepository } from "../contracts/IComment.contract.js";

class PostgresCommentData extends ICommentRepository {
  constructor(client = prisma) {
    super();
    this.client = client;
  }

  async createComment({ taskId, userId, content }) {
    return this.client.comment.create({
      data: {
        taskId,
        userId,
        content,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
            email: true,
          },
        },
      },
    });
  }

  async softDeleteComment({ userId, taskId, commentId }) {
    return this.client.$transaction(async (transaction) => {
      const comment = await transaction.comment.findFirst({
        where: {
          id: commentId,
          taskId,
          userId,
          deletedAt: null,
        },
      });

      if (!comment) {
        return null;
      }

      await transaction.comment.update({
        where: { id: comment.id },
        data: { deletedAt: new Date() },
      });

      // Return the original comment data while keeping its database row recoverable.
      return comment;
    });
  }
}

const postgresCommentData = new PostgresCommentData();

export { PostgresCommentData, postgresCommentData };
