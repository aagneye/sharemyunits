class NotificationService {
  /**
   * Sends email notification
   */
  async sendEmail(to: string, subject: string, body: string) {
    // TODO: Integrate with email service (SendGrid, AWS SES, etc.)
    console.log(`[EMAIL] To: ${to}, Subject: ${subject}`);
    console.log(`[EMAIL] Body: ${body}`);
  }

  /**
   * Sends VM provisioned notification
   */
  async notifyVMProvisioned(params: {
    email: string;
    vmIP: string;
    sshKeyDownloadUrl: string;
  }) {
    await this.sendEmail(
      params.email,
      'Your GPU VM is Ready',
      `Your VM has been provisioned!\n\nIP Address: ${params.vmIP}\nSSH Key: ${params.sshKeyDownloadUrl}`
    );
  }

  /**
   * Sends rental expiry notification
   */
  async notifyRentalExpiring(params: { email: string; rentalId: string; hoursRemaining: number }) {
    await this.sendEmail(
      params.email,
      'GPU Rental Expiring Soon',
      `Your rental ${params.rentalId} will expire in ${params.hoursRemaining} hours.`
    );
  }
}

export const notificationService = new NotificationService();
