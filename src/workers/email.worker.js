import { Queue, Worker } from "bullmq";
import { redisConnection } from "../config/redis.js";
import { mailService } from "../services/mail.service.js";

const EMAIL_QUEUE_NAME = "email-notifications";
const DEAD_LETTER_QUEUE_NAME = "email-notifications-dead-letter";

const deadLetterQueue = new Queue(DEAD_LETTER_QUEUE_NAME, {
  connection: redisConnection.duplicate(),
});

const processEmailJob = async (job) => {
  const { type, toEmail, userName, taskTitle, otp } = job.data;

  await job.updateProgress(25);

  switch (type) {
    case "OTP":
      if (!toEmail || !otp) {
        throw new Error("OTP email job requires toEmail and otp");
      }
      await mailService.sendOtpEmail(toEmail, otp);
      break;

    case "TASK_ASSIGNED":
    case "TASK_UNASSIGNED":
      if (!toEmail || !taskTitle) {
        throw new Error("Task email job requires toEmail and taskTitle");
      }
      await mailService.sendTaskAssignmentEmail({
        toEmail,
        userName: userName || "there",
        taskTitle,
        assigned: type === "TASK_ASSIGNED",
      });
      break;

    default:
      throw new Error(`Unsupported email job type: ${type}`);
  }

  await job.updateProgress(100);
  return { type, sentTo: toEmail };
};

const emailWorker = new Worker(EMAIL_QUEUE_NAME, processEmailJob, {
  connection: redisConnection.duplicate(),
});

emailWorker.on("completed", (job) => {
  console.log(`Email job ${job.id} completed`);
});

emailWorker.on("failed", async (job, error) => {
  console.error(`Email job ${job?.id} failed:`, error.message);

  if (job && job.attemptsMade >= (job.opts.attempts || 1)) {
    await deadLetterQueue.add("failed-email", {
      originalJobId: job.id,
      originalName: job.name,
      data: job.data,
      error: error.message,
      failedAt: new Date().toISOString(),
    });
  }
});

emailWorker.on("error", (error) => {
  console.error("Email worker error:", error.message);
});

export {
  EMAIL_QUEUE_NAME,
  DEAD_LETTER_QUEUE_NAME,
  deadLetterQueue,
  emailWorker,
  processEmailJob,
};