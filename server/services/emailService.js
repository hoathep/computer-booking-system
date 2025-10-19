import nodemailer from 'nodemailer';
import { db } from '../database/init.js';

class EmailService {
  constructor() {
    this.transporter = null;
    this.smtpConfig = null;
  }

  async loadSMTPConfig() {
    try {
      const settingsRow = db.prepare(`SELECT value FROM settings WHERE key = 'smtpConfig'`).get();
      if (settingsRow?.value) {
        this.smtpConfig = JSON.parse(settingsRow.value);
        this.transporter = nodemailer.createTransporter({
          host: this.smtpConfig.host,
          port: this.smtpConfig.port,
          secure: this.smtpConfig.secure,
          auth: {
            user: this.smtpConfig.authUser,
            pass: this.smtpConfig.authPass
          }
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to load SMTP config:', error);
      return false;
    }
  }

  async getTemplate(templateName) {
    try {
      const template = db.prepare(`
        SELECT id, name, subject, body, variables, is_active
        FROM email_templates
        WHERE name = ? AND is_active = 1
      `).get(templateName);
      
      if (!template) {
        throw new Error(`Template '${templateName}' not found or inactive`);
      }
      
      return {
        ...template,
        variables: template.variables ? JSON.parse(template.variables) : []
      };
    } catch (error) {
      console.error('Failed to get template:', error);
      throw error;
    }
  }

  replaceVariables(text, variables) {
    let result = text;
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{{${key}}}`, 'g');
      result = result.replace(regex, value || '');
    }
    return result;
  }

  async sendEmail(to, templateName, variables = {}) {
    try {
      // Load SMTP config if not already loaded
      if (!this.transporter) {
        const configLoaded = await this.loadSMTPConfig();
        if (!configLoaded) {
          throw new Error('SMTP not configured');
        }
      }

      // Get template
      const template = await this.getTemplate(templateName);
      
      // Replace variables in subject and body
      const subject = this.replaceVariables(template.subject, variables);
      const body = this.replaceVariables(template.body, variables);
      
      // Send email
      const mailOptions = {
        from: this.smtpConfig.fromEmail,
        to: to,
        subject: subject,
        text: body
      };
      
      const result = await this.transporter.sendMail(mailOptions);
      console.log(`Email sent successfully: ${result.messageId}`);
      return result;
      
    } catch (error) {
      console.error('Failed to send email:', error);
      throw error;
    }
  }

  async sendBookingConfirmation(userEmail, userData, bookingData) {
    const variables = {
      user_name: userData.fullname || userData.username,
      computer_name: bookingData.computer_name,
      start_time: new Date(bookingData.start_time).toLocaleString('vi-VN'),
      end_time: new Date(bookingData.end_time).toLocaleString('vi-VN'),
      unlock_code: bookingData.unlock_code
    };
    
    return await this.sendEmail(userEmail, 'booking_confirmation', variables);
  }

  async sendBookingCancellation(userEmail, userData, bookingData) {
    const variables = {
      user_name: userData.fullname || userData.username,
      computer_name: bookingData.computer_name,
      start_time: new Date(bookingData.start_time).toLocaleString('vi-VN'),
      end_time: new Date(bookingData.end_time).toLocaleString('vi-VN')
    };
    
    return await this.sendEmail(userEmail, 'booking_cancellation', variables);
  }

  async sendBookingReminder(userEmail, userData, bookingData) {
    const variables = {
      user_name: userData.fullname || userData.username,
      computer_name: bookingData.computer_name,
      start_time: new Date(bookingData.start_time).toLocaleString('vi-VN'),
      end_time: new Date(bookingData.end_time).toLocaleString('vi-VN'),
      unlock_code: bookingData.unlock_code
    };
    
    return await this.sendEmail(userEmail, 'booking_reminder', variables);
  }

  async sendWelcomeEmail(userEmail, userData) {
    const variables = {
      user_name: userData.fullname || userData.username,
      username: userData.username,
      email: userData.email
    };
    
    return await this.sendEmail(userEmail, 'welcome_email', variables);
  }

  async sendPasswordReset(userEmail, userData, newPassword) {
    const variables = {
      user_name: userData.fullname || userData.username,
      new_password: newPassword
    };
    
    return await this.sendEmail(userEmail, 'password_reset', variables);
  }

  async testConnection() {
    try {
      if (!this.transporter) {
        const configLoaded = await this.loadSMTPConfig();
        if (!configLoaded) {
          throw new Error('SMTP not configured');
        }
      }
      
      await this.transporter.verify();
      return { success: true, message: 'SMTP connection successful' };
    } catch (error) {
      return { success: false, message: `SMTP connection failed: ${error.message}` };
    }
  }
}

export default EmailService;
