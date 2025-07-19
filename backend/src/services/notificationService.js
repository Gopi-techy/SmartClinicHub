const nodemailer = require('nodemailer');
const twilio = require('twilio');
const webpush = require('web-push');
const logger = require('../utils/logger');
const config = require('../config/config');

class NotificationService {
  constructor() {
    // Initialize email transporter
    this.emailTransporter = nodemailer.createTransporter({
      host: config.email.host,
      port: config.email.port,
      secure: config.email.secure,
      auth: {
        user: config.email.user,
        pass: config.email.password
      }
    });

    // Initialize SMS client
    this.smsClient = twilio(config.sms.accountSid, config.sms.authToken);

    // Initialize push notifications
    webpush.setVapidDetails(
      `mailto:${config.email.from}`,
      config.webPush.publicKey,
      config.webPush.privateKey
    );

    this.notificationQueue = [];
    this.isProcessing = false;
  }

  /**
   * Send email notification
   */
  async sendEmail({ to, subject, html, text, attachments = [] }) {
    try {
      const mailOptions = {
        from: config.email.from,
        to,
        subject,
        html,
        text,
        attachments
      };

      const result = await this.emailTransporter.sendMail(mailOptions);
      
      logger.info('Email sent successfully', {
        to,
        subject,
        messageId: result.messageId
      });

      return {
        success: true,
        messageId: result.messageId
      };
    } catch (error) {
      logger.error('Email sending failed:', error);
      throw new Error(`Email sending failed: ${error.message}`);
    }
  }

  /**
   * Send SMS notification
   */
  async sendSMS({ to, message }) {
    try {
      const result = await this.smsClient.messages.create({
        body: message,
        from: config.sms.from,
        to
      });

      logger.info('SMS sent successfully', {
        to,
        sid: result.sid
      });

      return {
        success: true,
        sid: result.sid
      };
    } catch (error) {
      logger.error('SMS sending failed:', error);
      throw new Error(`SMS sending failed: ${error.message}`);
    }
  }

  /**
   * Send push notification
   */
  async sendPushNotification({ subscription, payload }) {
    try {
      const result = await webpush.sendNotification(subscription, JSON.stringify(payload));
      
      logger.info('Push notification sent successfully', {
        endpoint: subscription.endpoint
      });

      return {
        success: true,
        statusCode: result.statusCode
      };
    } catch (error) {
      logger.error('Push notification failed:', error);
      throw new Error(`Push notification failed: ${error.message}`);
    }
  }

  /**
   * Send appointment reminder
   */
  async sendAppointmentReminder(appointment, reminderType = '24h') {
    const patient = appointment.patient;
    const doctor = appointment.doctor;
    
    const messages = {
      '24h': {
        subject: 'Appointment Reminder - Tomorrow',
        html: `
          <h2>Appointment Reminder</h2>
          <p>Dear ${patient.firstName},</p>
          <p>This is a reminder that you have an appointment scheduled for tomorrow.</p>
          <div style="background: #f0f0f0; padding: 15px; margin: 15px 0; border-radius: 5px;">
            <strong>Appointment Details:</strong><br>
            Doctor: Dr. ${doctor.firstName} ${doctor.lastName}<br>
            Date: ${new Date(appointment.appointmentDate).toLocaleDateString()}<br>
            Time: ${new Date(appointment.appointmentDate).toLocaleTimeString()}<br>
            Type: ${appointment.type}<br>
            ${appointment.location ? `Location: ${appointment.location}` : ''}
          </div>
          <p>Please arrive 15 minutes early and bring a valid ID and insurance card.</p>
          <p>If you need to reschedule, please contact us at least 24 hours in advance.</p>
        `,
        sms: `Reminder: You have an appointment tomorrow with Dr. ${doctor.lastName} at ${new Date(appointment.appointmentDate).toLocaleTimeString()}. Please arrive 15 minutes early.`
      },
      '2h': {
        subject: 'Appointment Reminder - Today',
        html: `
          <h2>Appointment Today</h2>
          <p>Dear ${patient.firstName},</p>
          <p>Your appointment is scheduled for today in 2 hours.</p>
          <p><strong>Time:</strong> ${new Date(appointment.appointmentDate).toLocaleTimeString()}</p>
          <p><strong>Doctor:</strong> Dr. ${doctor.firstName} ${doctor.lastName}</p>
          <p>Please prepare any questions you have and arrive on time.</p>
        `,
        sms: `Your appointment with Dr. ${doctor.lastName} is today at ${new Date(appointment.appointmentDate).toLocaleTimeString()}. See you soon!`
      }
    };

    const message = messages[reminderType];
    
    try {
      // Send email reminder
      if (patient.email) {
        await this.sendEmail({
          to: patient.email,
          subject: message.subject,
          html: message.html
        });
      }

      // Send SMS reminder if phone number is available
      if (patient.phone) {
        await this.sendSMS({
          to: patient.phone,
          message: message.sms
        });
      }

      // Send push notification if user has subscribed
      if (patient.notificationSettings?.pushSubscription) {
        await this.sendPushNotification({
          subscription: patient.notificationSettings.pushSubscription,
          payload: {
            title: message.subject,
            body: message.sms,
            icon: '/icons/appointment.png',
            badge: '/icons/badge.png',
            data: {
              appointmentId: appointment._id,
              type: 'appointment_reminder'
            }
          }
        });
      }

      logger.audit('Appointment reminder sent', patient._id, {
        appointmentId: appointment._id,
        reminderType,
        channels: ['email', 'sms', 'push'].filter(channel => {
          switch (channel) {
            case 'email': return patient.email;
            case 'sms': return patient.phone;
            case 'push': return patient.notificationSettings?.pushSubscription;
            default: return false;
          }
        })
      });

      return { success: true };
    } catch (error) {
      logger.error('Appointment reminder failed:', error);
      throw error;
    }
  }

  /**
   * Send prescription ready notification
   */
  async sendPrescriptionReady(prescription) {
    const patient = prescription.patient;
    const pharmacy = prescription.pharmacy;

    try {
      const message = {
        subject: 'Prescription Ready for Pickup',
        html: `
          <h2>Prescription Ready</h2>
          <p>Dear ${patient.firstName},</p>
          <p>Your prescription is ready for pickup.</p>
          <div style="background: #e8f5e8; padding: 15px; margin: 15px 0; border-radius: 5px;">
            <strong>Prescription Details:</strong><br>
            Prescription #: ${prescription.prescriptionNumber}<br>
            Pharmacy: ${pharmacy.name}<br>
            Address: ${pharmacy.address}<br>
            Phone: ${pharmacy.phone}<br>
            Medications: ${prescription.medications.length} item(s)
          </div>
          <p>Please bring a valid ID when picking up your prescription.</p>
          <p>Pharmacy hours: ${pharmacy.hours || 'Contact pharmacy for hours'}</p>
        `,
        sms: `Your prescription ${prescription.prescriptionNumber} is ready for pickup at ${pharmacy.name}. Bring valid ID.`
      };

      if (patient.email) {
        await this.sendEmail({
          to: patient.email,
          subject: message.subject,
          html: message.html
        });
      }

      if (patient.phone) {
        await this.sendSMS({
          to: patient.phone,
          message: message.sms
        });
      }

      return { success: true };
    } catch (error) {
      logger.error('Prescription ready notification failed:', error);
      throw error;
    }
  }

  /**
   * Send emergency alert
   */
  async sendEmergencyAlert(emergencyAccess, alertLevel = 'high') {
    const patient = emergencyAccess.patientId;
    const emergencyContacts = emergencyAccess.emergencyContacts || [];

    try {
      const alertMessage = {
        critical: {
          subject: '🚨 CRITICAL EMERGENCY ALERT',
          html: `
            <div style="background: #ff4444; color: white; padding: 20px; border-radius: 5px;">
              <h2>🚨 CRITICAL EMERGENCY ALERT</h2>
              <p><strong>Patient:</strong> ${patient.firstName} ${patient.lastName}</p>
              <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
              <p><strong>Location:</strong> ${emergencyAccess.location || 'Unknown'}</p>
              <p><strong>Access Method:</strong> ${emergencyAccess.accessMethod}</p>
              <p><strong>Medical Information Accessed</strong></p>
              <p>This is an automated emergency alert. Please respond immediately.</p>
            </div>
          `,
          sms: `🚨 EMERGENCY: ${patient.firstName} ${patient.lastName} - Medical info accessed at ${new Date().toLocaleTimeString()}. Location: ${emergencyAccess.location || 'Unknown'}`
        },
        high: {
          subject: 'Emergency Medical Access Alert',
          html: `
            <div style="background: #ff8800; color: white; padding: 15px; border-radius: 5px;">
              <h3>Emergency Medical Access Alert</h3>
              <p><strong>Patient:</strong> ${patient.firstName} ${patient.lastName}</p>
              <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
              <p><strong>Access granted for emergency medical information</strong></p>
            </div>
          `,
          sms: `Emergency alert: Medical info for ${patient.firstName} ${patient.lastName} accessed at ${new Date().toLocaleTimeString()}`
        }
      };

      const message = alertMessage[alertLevel] || alertMessage.high;

      // Send to patient
      if (patient.email) {
        await this.sendEmail({
          to: patient.email,
          subject: message.subject,
          html: message.html
        });
      }

      if (patient.phone) {
        await this.sendSMS({
          to: patient.phone,
          message: message.sms
        });
      }

      // Send to emergency contacts
      for (const contact of emergencyContacts) {
        if (contact.email) {
          await this.sendEmail({
            to: contact.email,
            subject: message.subject,
            html: message.html
          });
        }

        if (contact.phone) {
          await this.sendSMS({
            to: contact.phone,
            message: message.sms
          });
        }
      }

      logger.emergency('Emergency alert sent', {
        patientId: patient._id,
        alertLevel,
        accessMethod: emergencyAccess.accessMethod,
        location: emergencyAccess.location,
        contactsSent: emergencyContacts.length
      });

      return { success: true };
    } catch (error) {
      logger.error('Emergency alert failed:', error);
      throw error;
    }
  }

  /**
   * Send system notification
   */
  async sendSystemNotification(userId, notification) {
    try {
      // This would typically store in database and send real-time via WebSocket
      const systemNotification = {
        userId,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        data: notification.data,
        priority: notification.priority || 'normal',
        createdAt: new Date(),
        read: false
      };

      // Store notification in database (implementation would depend on your notification storage)
      // await NotificationModel.create(systemNotification);

      // Send real-time notification via WebSocket if user is online
      // io.to(userId).emit('notification', systemNotification);

      logger.info('System notification sent', {
        userId,
        type: notification.type,
        priority: notification.priority
      });

      return { success: true, notification: systemNotification };
    } catch (error) {
      logger.error('System notification failed:', error);
      throw error;
    }
  }

  /**
   * Queue notification for batch processing
   */
  queueNotification(notification) {
    this.notificationQueue.push({
      ...notification,
      queuedAt: new Date()
    });

    if (!this.isProcessing) {
      this.processQueue();
    }
  }

  /**
   * Process notification queue
   */
  async processQueue() {
    if (this.isProcessing || this.notificationQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    try {
      while (this.notificationQueue.length > 0) {
        const notification = this.notificationQueue.shift();
        
        try {
          switch (notification.type) {
            case 'email':
              await this.sendEmail(notification.data);
              break;
            case 'sms':
              await this.sendSMS(notification.data);
              break;
            case 'push':
              await this.sendPushNotification(notification.data);
              break;
            case 'appointment_reminder':
              await this.sendAppointmentReminder(notification.data.appointment, notification.data.reminderType);
              break;
            case 'prescription_ready':
              await this.sendPrescriptionReady(notification.data.prescription);
              break;
            case 'emergency_alert':
              await this.sendEmergencyAlert(notification.data.emergencyAccess, notification.data.alertLevel);
              break;
            default:
              logger.warn('Unknown notification type:', notification.type);
          }

          // Small delay between notifications to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
          logger.error('Failed to process queued notification:', error);
          
          // Retry logic could be implemented here
          if (notification.retryCount < 3) {
            notification.retryCount = (notification.retryCount || 0) + 1;
            this.notificationQueue.push(notification);
          }
        }
      }
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Schedule appointment reminders
   */
  scheduleAppointmentReminders(appointment) {
    const appointmentDate = new Date(appointment.appointmentDate);
    const now = new Date();

    // Schedule 24-hour reminder
    const reminderTime24h = new Date(appointmentDate - 24 * 60 * 60 * 1000);
    if (reminderTime24h > now) {
      setTimeout(() => {
        this.queueNotification({
          type: 'appointment_reminder',
          data: {
            appointment,
            reminderType: '24h'
          }
        });
      }, reminderTime24h - now);
    }

    // Schedule 2-hour reminder
    const reminderTime2h = new Date(appointmentDate - 2 * 60 * 60 * 1000);
    if (reminderTime2h > now) {
      setTimeout(() => {
        this.queueNotification({
          type: 'appointment_reminder',
          data: {
            appointment,
            reminderType: '2h'
          }
        });
      }, reminderTime2h - now);
    }
  }
}

module.exports = new NotificationService();
