import { Resend } from 'resend';
import { format } from 'date-fns';

interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
}

class EmailService {
  private resend: Resend | null;
  private fromEmail: string;
  private appName: string;
  private isEnabled: boolean;

  constructor() {
    const apiKey = process.env.RESEND_API_KEY;
    
    if (!apiKey) {
      console.warn('⚠️  RESEND_API_KEY not found. Email notifications will be disabled.');
      this.resend = null;
      this.isEnabled = false;
    } else {
      this.resend = new Resend(apiKey);
      this.isEnabled = true;
      console.log('✅ Email service initialized with Resend');
    }
    
    this.fromEmail = process.env.FROM_EMAIL || 'noreply@yourcompany.com';
    this.appName = process.env.APP_NAME || 'HRMS System';
  }

  private getFromAddress(): string {
    return `${this.appName} <${this.fromEmail}>`;
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    if (!this.isEnabled || !this.resend) {
      console.log('📧 Email service disabled - would have sent:', options.subject);
      return true; // Return true to not break the flow
    }

    try {
      const { data, error } = await this.resend.emails.send({
        from: options.from || this.getFromAddress(),
        to: Array.isArray(options.to) ? options.to : [options.to],
        subject: options.subject,
        html: options.html,
        text: options.text,
      });

      if (error) {
        console.error('Resend API error:', error);
        return false;
      }

      console.log('Email sent successfully:', data?.id);
      return true;
    } catch (error) {
      console.error('Email sending failed:', error);
      return false;
    }
  }

  private createEmailTemplate(title: string, content: string, actionButton?: { text: string; url: string }): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${title}</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f6f8fa;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center;">
              <h1 style="margin: 0; font-size: 28px; font-weight: 600;">${this.appName}</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9; font-size: 16px;">Human Resource Management System</p>
            </div>
            
            <div style="padding: 40px 30px;">
              <h2 style="color: #2d3748; margin: 0 0 20px 0; font-size: 24px; font-weight: 600;">${title}</h2>
              ${content}
              
              ${actionButton ? `
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${actionButton.url}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; padding: 12px 30px; border-radius: 6px; font-weight: 600; font-size: 16px;">${actionButton.text}</a>
                </div>
              ` : ''}
            </div>
            
            <div style="background-color: #f8f9fa; padding: 20px 30px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0; color: #718096; font-size: 14px;">
                This is an automated message from ${this.appName}. Please do not reply to this email.
              </p>
              <p style="margin: 10px 0 0 0; color: #a0aec0; font-size: 12px;">
                © ${new Date().getFullYear()} ${this.appName}. All rights reserved.
              </p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  async sendLeaveRequestNotification(
    managerEmail: string,
    employeeName: string,
    employeeId: string,
    leaveType: string,
    fromDate: string,
    toDate: string,
    workingDays: number,
    reason: string,
    requestId?: string
  ): Promise<boolean> {
    const leaveTypeColors: Record<string, string> = {
      'VACATION': '#3182ce',
      'SICK': '#e53e3e',
      'CASUAL': '#38a169',
      'ACADEMIC': '#805ad5',
      'WFH': '#2b6cb0',
      'COMP_OFF': '#d69e2e'
    };

    const color = leaveTypeColors[leaveType] || '#4a5568';

    const content = `
      <p style="color: #4a5568; font-size: 16px; line-height: 1.6; margin-bottom: 25px;">
        A new leave request has been submitted and requires your approval.
      </p>
      
      <div style="background-color: #f7fafc; border-left: 4px solid ${color}; border-radius: 0 6px 6px 0; padding: 20px; margin: 25px 0;">
        <div style="display: grid; gap: 15px;">
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap;">
            <span style="color: #2d3748; font-weight: 600;">Employee:</span>
            <span style="color: #4a5568;">${employeeName} (${employeeId})</span>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap;">
            <span style="color: #2d3748; font-weight: 600;">Leave Type:</span>
            <span style="background-color: ${color}; color: white; padding: 4px 12px; border-radius: 20px; font-size: 14px; font-weight: 500;">${leaveType}</span>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap;">
            <span style="color: #2d3748; font-weight: 600;">Duration:</span>
            <span style="color: #4a5568;">${fromDate} to ${toDate}</span>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap;">
            <span style="color: #2d3748; font-weight: 600;">Working Days:</span>
            <span style="color: #e53e3e; font-weight: 600;">${workingDays} day${workingDays !== 1 ? 's' : ''}</span>
          </div>
          <div style="border-top: 1px solid #e2e8f0; padding-top: 15px; margin-top: 5px;">
            <div style="color: #2d3748; font-weight: 600; margin-bottom: 8px;">Reason:</div>
            <div style="color: #4a5568; font-style: italic; line-height: 1.5;">"${reason}"</div>
          </div>
        </div>
      </div>
      
      <p style="color: #4a5568; font-size: 16px; line-height: 1.6; margin-top: 25px;">
        Please review this request and provide your decision through the HRMS portal.
      </p>
    `;

    const actionButton = requestId && process.env.CLIENT_URL ? {
      text: 'Review Request',
      url: `${process.env.CLIENT_URL}/leaves`
    } : undefined;

    const html = this.createEmailTemplate(
      'New Leave Request Pending Approval',
      content,
      actionButton
    );

    return this.sendEmail({
      to: managerEmail,
      subject: `🗓️ Leave Request from ${employeeName} - ${leaveType}`,
      html
    });
  }

  async sendLeaveStatusUpdate(
    employeeEmail: string,
    employeeName: string,
    status: 'APPROVED' | 'REJECTED' | 'CANCELLED',
    leaveType: string,
    fromDate: string,
    toDate: string,
    workingDays: number,
    comment?: string,
    approverName?: string
  ): Promise<boolean> {
    const statusConfig = {
      APPROVED: {
        color: '#38a169',
        icon: '✅',
        message: 'Your leave request has been approved!'
      },
      REJECTED: {
        color: '#e53e3e',
        icon: '❌',
        message: 'Your leave request has been rejected.'
      },
      CANCELLED: {
        color: '#ed8936',
        icon: '🚫',
        message: 'Your leave request has been cancelled.'
      }
    };

    const config = statusConfig[status];

    const content = `
      <p style="color: #4a5568; font-size: 16px; line-height: 1.6; margin-bottom: 25px;">
        Hello ${employeeName},
      </p>
      
      <div style="text-align: center; margin: 30px 0;">
        <div style="display: inline-block; background-color: ${config.color}; color: white; padding: 15px 30px; border-radius: 8px; font-size: 18px; font-weight: 600;">
          ${config.icon} ${config.message}
        </div>
      </div>
      
      <div style="background-color: #f7fafc; border-radius: 6px; padding: 20px; margin: 25px 0;">
        <div style="display: grid; gap: 15px;">
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap;">
            <span style="color: #2d3748; font-weight: 600;">Leave Type:</span>
            <span style="color: #4a5568;">${leaveType}</span>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap;">
            <span style="color: #2d3748; font-weight: 600;">Duration:</span>
            <span style="color: #4a5568;">${fromDate} to ${toDate}</span>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap;">
            <span style="color: #2d3748; font-weight: 600;">Working Days:</span>
            <span style="color: #4a5568;">${workingDays} day${workingDays !== 1 ? 's' : ''}</span>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap;">
            <span style="color: #2d3748; font-weight: 600;">Status:</span>
            <span style="color: ${config.color}; font-weight: 600;">${status}</span>
          </div>
          ${approverName ? `
            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap;">
              <span style="color: #2d3748; font-weight: 600;">Updated By:</span>
              <span style="color: #4a5568;">${approverName}</span>
            </div>
          ` : ''}
          ${comment ? `
            <div style="border-top: 1px solid #e2e8f0; padding-top: 15px; margin-top: 5px;">
              <div style="color: #2d3748; font-weight: 600; margin-bottom: 8px;">Comment:</div>
              <div style="color: #4a5568; font-style: italic; line-height: 1.5;">"${comment}"</div>
            </div>
          ` : ''}
        </div>
      </div>
      
      ${status === 'APPROVED' ? `
        <p style="color: #38a169; font-size: 16px; line-height: 1.6; margin-top: 25px; text-align: center; font-weight: 500;">
          Enjoy your time off! 🎉
        </p>
      ` : status === 'REJECTED' ? `
        <p style="color: #4a5568; font-size: 16px; line-height: 1.6; margin-top: 25px;">
          If you have any questions about this decision, please contact your manager or HR department.
        </p>
      ` : ''}
    `;

    const actionButton = process.env.CLIENT_URL ? {
      text: 'View Leave History',
      url: `${process.env.CLIENT_URL}/leaves`
    } : undefined;

    const html = this.createEmailTemplate(
      `Leave Request ${status}`,
      content,
      actionButton
    );

    return this.sendEmail({
      to: employeeEmail,
      subject: `${config.icon} Leave Request ${status} - ${leaveType}`,
      html
    });
  }

  async sendWelcomeEmail(
    userEmail: string,
    userName: string,
    tempPassword: string,
    employeeId: string,
    department: string
  ): Promise<boolean> {
    const content = `
      <p style="color: #4a5568; font-size: 18px; line-height: 1.6; margin-bottom: 25px;">
        Welcome to ${this.appName}, <strong>${userName}</strong>! 🎉
      </p>
      
      <p style="color: #4a5568; font-size: 16px; line-height: 1.6; margin-bottom: 25px;">
        Your account has been successfully created. Here are your login credentials:
      </p>
      
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px; padding: 25px; margin: 25px 0; color: white;">
        <div style="display: grid; gap: 15px;">
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap;">
            <span style="font-weight: 600; opacity: 0.9;">Employee ID:</span>
            <span style="font-weight: 600; font-size: 16px;">${employeeId}</span>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap;">
            <span style="font-weight: 600; opacity: 0.9;">Email:</span>
            <span style="font-weight: 600; font-size: 16px;">${userEmail}</span>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap;">
            <span style="font-weight: 600; opacity: 0.9;">Temporary Password:</span>
            <span style="background-color: rgba(255,255,255,0.2); padding: 8px 12px; border-radius: 4px; font-family: monospace; font-size: 16px; font-weight: 600;">${tempPassword}</span>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap;">
            <span style="font-weight: 600; opacity: 0.9;">Department:</span>
            <span style="font-weight: 600; font-size: 16px;">${department}</span>
          </div>
        </div>
      </div>
      
      <div style="background-color: #fff5f5; border: 1px solid #fed7d7; border-radius: 6px; padding: 15px; margin: 25px 0;">
        <div style="color: #c53030; font-weight: 600; margin-bottom: 8px;">🔒 Security Notice:</div>
        <div style="color: #742a2a; font-size: 14px; line-height: 1.5;">
          Please change your password immediately after your first login for security purposes.
        </div>
      </div>
      
      <p style="color: #4a5568; font-size: 16px; line-height: 1.6; margin-top: 25px;">
        You can now access the system to manage your leave requests, view your profile, and more.
      </p>
    `;

    const actionButton = process.env.CLIENT_URL ? {
      text: 'Login to HRMS',
      url: `${process.env.CLIENT_URL}/login`
    } : undefined;

    const html = this.createEmailTemplate(
      'Welcome to HRMS!',
      content,
      actionButton
    );

    return this.sendEmail({
      to: userEmail,
      subject: `🎉 Welcome to ${this.appName} - Account Created`,
      html
    });
  }

  async sendPasswordResetEmail(
    userEmail: string,
    userName: string,
    resetToken: string
  ): Promise<boolean> {
    const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;
    
    const content = `
      <p style="color: #4a5568; font-size: 16px; line-height: 1.6; margin-bottom: 25px;">
        Hello ${userName},
      </p>
      
      <p style="color: #4a5568; font-size: 16px; line-height: 1.6; margin-bottom: 25px;">
        We received a request to reset your password. Click the button below to create a new password:
      </p>
      
      <div style="background-color: #fff5f5; border: 1px solid #fed7d7; border-radius: 6px; padding: 15px; margin: 25px 0;">
        <div style="color: #c53030; font-weight: 600; margin-bottom: 8px;">⏰ This link expires in 1 hour</div>
        <div style="color: #742a2a; font-size: 14px; line-height: 1.5;">
          For security reasons, this password reset link will expire in 1 hour.
        </div>
      </div>
      
      <p style="color: #4a5568; font-size: 16px; line-height: 1.6; margin-top: 25px;">
        If you didn't request this password reset, please ignore this email or contact IT support if you have concerns.
      </p>
    `;

    const html = this.createEmailTemplate(
      'Password Reset Request',
      content,
      {
        text: 'Reset My Password',
        url: resetUrl
      }
    );

    return this.sendEmail({
      to: userEmail,
      subject: '🔐 Password Reset Request - HRMS',
      html
    });
  }
}

export const emailService = new EmailService();
