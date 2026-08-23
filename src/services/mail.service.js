import { BrevoClient } from "@getbrevo/brevo";
import config from "../config/config.js";

class MailService {
  constructor(brevoClient = null) {
    this.brevo =
      brevoClient ||
      (config.BREVO_API_KEY && config.BREVO_API_KEY !== "mock"
        ? new BrevoClient({ apiKey: config.BREVO_API_KEY })
        : null);
  }

  async sendOtpEmail(toEmail, otp) {
    console.log(`[EMAIL] Preparing OTP email to: ${toEmail}`);

    if (!this.brevo || config.NODE_ENV === "test" || config.BREVO_API_KEY === "mock") {
      console.log(`[MOCK EMAIL SENT] OTP to ${toEmail}: ${otp}`);
      return { messageId: `mock-otp-${Date.now()}`, mock: true };
    }

    try {
      const response = await this.brevo.transactionalEmails.sendTransacEmail({
        sender: {
          name: config.BREVO_FROM_NAME,
          email: config.BREVO_FROM_EMAIL,
        },
        to: [{ email: toEmail }],
        subject: "Your OTP Code",
        htmlContent: `
          <h2>Email Verification</h2>
          <p>Your OTP is: <strong>${otp}</strong></p>
          <p>Valid for 10 minutes. Do not share this with anyone.</p>
        `,
      });

      console.log("OTP email sent successfully via Brevo to:", toEmail);
      return response;
    } catch (error) {
      console.error(
        "Brevo email sending failed:",
        error?.body || error?.response?.body || error?.message || error
      );
      throw error;
    }
  }

  async sendTaskAssignmentEmail({ toEmail, userName, taskTitle, assigned }) {
    const action = assigned ? "assigned" : "unassigned";
    console.log(`[EMAIL] Preparing Task ${action} email to: ${toEmail}`);

    if (!this.brevo || config.NODE_ENV === "test" || config.BREVO_API_KEY === "mock") {
      console.log(`[MOCK EMAIL SENT] Task ${action} to ${toEmail} for task "${taskTitle}"`);
      return { messageId: `mock-task-${Date.now()}`, mock: true };
    }

    try {
      return await this.brevo.transactionalEmails.sendTransacEmail({
        sender: {
          name: config.BREVO_FROM_NAME,
          email: config.BREVO_FROM_EMAIL,
        },
        to: [{ email: toEmail }],
        subject: `Task ${action}: ${taskTitle}`,
        htmlContent: `
          <p>Hello ${userName},</p>
          <p>You have been ${action} for the task: <strong>${taskTitle}</strong>.</p>
        `,
      });
    } catch (error) {
      console.error(
        "Brevo task email failed:",
        error?.body || error?.response?.body || error?.message || error
      );
      throw error;
    }
  }
}

const mailService = new MailService();

export { MailService, mailService };
