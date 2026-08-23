import { BrevoClient } from "@getbrevo/brevo";
import config from "../config/config.js";

class MailService {
  constructor(brevoClient = new BrevoClient({ apiKey: config.BREVO_API_KEY })) {
    this.brevo = brevoClient;
  }

  async sendOtpEmail(toEmail, otp) {
    try {
      console.log("Sending OTP email to:", toEmail);

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

      console.log("OTP email sent successfully to:", toEmail);
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

    return this.brevo.transactionalEmails.sendTransacEmail({
      sender: {
        name: config.BREVO_FROM_NAME,
        email: config.BREVO_FROM_EMAIL,
      },
      to: [{ email: toEmail }],
      subject: `Task ${action}: ${taskTitle}`,
      htmlContent: `
        <p>Hello ${userName},</p>
        <p>You have been ${action} from the task: <strong>${taskTitle}</strong>.</p>
      `,
    });
  }
}

const mailService = new MailService();

export { MailService, mailService };
