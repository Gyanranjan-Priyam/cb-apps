import { emitSocketEvent, emitSocketEventToRooms } from "@/lib/socket";
import { sendEmail } from "@/lib/mailer";

export class NotificationService {
  /**
   * Broadcast a realtime socket notification to a user or channel
   */
  static async sendRealtimeNotification(params: {
    userId?: string;
    room?: string;
    title: string;
    message: string;
    type?: string;
    data?: any;
  }) {
    const payload = {
      type: params.type || "notification",
      title: params.title,
      message: params.message,
      data: params.data || {},
      timestamp: new Date().toISOString(),
    };

    if (params.room) {
      await emitSocketEvent(params.room, "notification", payload);
    }

    if (params.userId) {
      const userRooms = [`user-${params.userId}`, `user:${params.userId}`];
      await emitSocketEventToRooms(userRooms, "notification", payload);
    }

    return payload;
  }

  /**
   * Send email notification using system mailer
   */
  static async sendEmailNotification(params: {
    to: string | string[];
    subject: string;
    htmlContent: string;
  }) {
    const recipients = Array.isArray(params.to) ? params.to : [params.to];

    const results = await Promise.allSettled(
      recipients.map((email) =>
        sendEmail({
          to: email,
          subject: params.subject,
          html: params.htmlContent,
        })
      )
    );

    return results;
  }

  /**
   * Dispatch multi-channel notification (Email + Realtime Socket)
   */
  static async dispatchNotification(params: {
    userId?: string;
    email?: string;
    title: string;
    message: string;
    htmlEmail?: string;
    type?: string;
    data?: any;
  }) {
    const tasks: Promise<any>[] = [];

    if (params.userId) {
      tasks.push(
        this.sendRealtimeNotification({
          userId: params.userId,
          title: params.title,
          message: params.message,
          type: params.type,
          data: params.data,
        })
      );
    }

    if (params.email) {
      tasks.push(
        this.sendEmailNotification({
          to: params.email,
          subject: params.title,
          htmlContent: params.htmlEmail || `<p>${params.message}</p>`,
        })
      );
    }

    return Promise.allSettled(tasks);
  }
}
