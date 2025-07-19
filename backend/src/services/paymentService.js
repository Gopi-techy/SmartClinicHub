const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const logger = require('../utils/logger');
const config = require('../config/config');

class PaymentService {
  constructor() {
    this.stripe = stripe;
    this.webhookSecret = config.payment.webhookSecret;
    this.currency = config.payment.defaultCurrency || 'usd';
    
    // Payment method configurations
    this.paymentMethods = {
      consultation: {
        description: 'Medical Consultation',
        defaultAmount: 10000, // $100.00 in cents
        category: 'healthcare'
      },
      prescription: {
        description: 'Prescription Processing',
        defaultAmount: 500, // $5.00 in cents
        category: 'pharmacy'
      },
      emergency_access: {
        description: 'Emergency Medical Access',
        defaultAmount: 0, // Free
        category: 'emergency'
      },
      subscription: {
        description: 'SmartClinicHub Subscription',
        defaultAmount: 2999, // $29.99 in cents
        category: 'subscription'
      }
    };
  }

  /**
   * Create payment intent for appointment
   */
  async createAppointmentPayment(appointmentData) {
    try {
      const { 
        appointmentId, 
        patientId, 
        doctorId, 
        amount, 
        description = 'Medical Consultation',
        metadata = {} 
      } = appointmentData;

      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: amount || this.paymentMethods.consultation.defaultAmount,
        currency: this.currency,
        description,
        metadata: {
          type: 'appointment',
          appointmentId,
          patientId,
          doctorId,
          ...metadata
        },
        automatic_payment_methods: {
          enabled: true,
        },
        capture_method: 'automatic',
        confirmation_method: 'automatic'
      });

      logger.audit('Payment intent created for appointment', patientId, {
        paymentIntentId: paymentIntent.id,
        appointmentId,
        amount,
        currency: this.currency
      });

      return {
        success: true,
        paymentIntent: {
          id: paymentIntent.id,
          clientSecret: paymentIntent.client_secret,
          amount: paymentIntent.amount,
          currency: paymentIntent.currency,
          status: paymentIntent.status
        }
      };
    } catch (error) {
      logger.error('Failed to create appointment payment:', error);
      throw new Error(`Payment creation failed: ${error.message}`);
    }
  }

  /**
   * Create subscription for premium features
   */
  async createSubscription(subscriptionData) {
    try {
      const { 
        customerId, 
        priceId, 
        paymentMethodId,
        trialPeriodDays = 7,
        metadata = {} 
      } = subscriptionData;

      // Create customer if not exists
      let customer;
      if (customerId) {
        customer = await this.stripe.customers.retrieve(customerId);
      } else {
        customer = await this.stripe.customers.create({
          metadata: {
            userId: metadata.userId,
            email: metadata.email
          }
        });
      }

      // Attach payment method to customer
      if (paymentMethodId) {
        await this.stripe.paymentMethods.attach(paymentMethodId, {
          customer: customer.id,
        });

        // Set as default payment method
        await this.stripe.customers.update(customer.id, {
          invoice_settings: {
            default_payment_method: paymentMethodId,
          },
        });
      }

      // Create subscription
      const subscription = await this.stripe.subscriptions.create({
        customer: customer.id,
        items: [{ price: priceId }],
        trial_period_days: trialPeriodDays,
        metadata: {
          type: 'premium_subscription',
          ...metadata
        },
        expand: ['latest_invoice.payment_intent'],
      });

      logger.audit('Subscription created', metadata.userId, {
        subscriptionId: subscription.id,
        customerId: customer.id,
        priceId,
        trialDays: trialPeriodDays
      });

      return {
        success: true,
        subscription: {
          id: subscription.id,
          status: subscription.status,
          currentPeriodStart: subscription.current_period_start,
          currentPeriodEnd: subscription.current_period_end,
          trialEnd: subscription.trial_end,
          customerId: customer.id
        }
      };
    } catch (error) {
      logger.error('Failed to create subscription:', error);
      throw new Error(`Subscription creation failed: ${error.message}`);
    }
  }

  /**
   * Process prescription payment
   */
  async processPrescriptionPayment(prescriptionData) {
    try {
      const { 
        prescriptionId, 
        patientId, 
        pharmacyId, 
        medications, 
        totalAmount,
        paymentMethodId,
        metadata = {} 
      } = prescriptionData;

      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: totalAmount,
        currency: this.currency,
        description: `Prescription Payment - ${medications.length} medication(s)`,
        payment_method: paymentMethodId,
        confirmation_method: 'automatic',
        confirm: true,
        metadata: {
          type: 'prescription',
          prescriptionId,
          patientId,
          pharmacyId,
          medicationCount: medications.length,
          ...metadata
        },
        return_url: `${config.frontend.url}/payment/success`
      });

      logger.audit('Prescription payment processed', patientId, {
        paymentIntentId: paymentIntent.id,
        prescriptionId,
        amount: totalAmount,
        pharmacyId,
        medicationCount: medications.length
      });

      return {
        success: true,
        payment: {
          id: paymentIntent.id,
          status: paymentIntent.status,
          amount: paymentIntent.amount,
          currency: paymentIntent.currency
        }
      };
    } catch (error) {
      logger.error('Failed to process prescription payment:', error);
      throw new Error(`Prescription payment failed: ${error.message}`);
    }
  }

  /**
   * Create customer in Stripe
   */
  async createCustomer(customerData) {
    try {
      const { userId, email, name, phone, address } = customerData;

      const customer = await this.stripe.customers.create({
        email,
        name,
        phone,
        address,
        metadata: {
          userId,
          source: 'smartclinichub'
        }
      });

      logger.audit('Stripe customer created', userId, {
        customerId: customer.id,
        email
      });

      return {
        success: true,
        customer: {
          id: customer.id,
          email: customer.email,
          created: customer.created
        }
      };
    } catch (error) {
      logger.error('Failed to create Stripe customer:', error);
      throw new Error(`Customer creation failed: ${error.message}`);
    }
  }

  /**
   * Get payment methods for customer
   */
  async getCustomerPaymentMethods(customerId) {
    try {
      const paymentMethods = await this.stripe.paymentMethods.list({
        customer: customerId,
        type: 'card',
      });

      return {
        success: true,
        paymentMethods: paymentMethods.data.map(pm => ({
          id: pm.id,
          type: pm.type,
          card: pm.card ? {
            brand: pm.card.brand,
            last4: pm.card.last4,
            expMonth: pm.card.exp_month,
            expYear: pm.card.exp_year
          } : null,
          created: pm.created
        }))
      };
    } catch (error) {
      logger.error('Failed to get payment methods:', error);
      throw new Error(`Failed to retrieve payment methods: ${error.message}`);
    }
  }

  /**
   * Add payment method to customer
   */
  async addPaymentMethod(customerId, paymentMethodId) {
    try {
      await this.stripe.paymentMethods.attach(paymentMethodId, {
        customer: customerId,
      });

      logger.audit('Payment method added to customer', null, {
        customerId,
        paymentMethodId
      });

      return {
        success: true,
        message: 'Payment method added successfully'
      };
    } catch (error) {
      logger.error('Failed to add payment method:', error);
      throw new Error(`Failed to add payment method: ${error.message}`);
    }
  }

  /**
   * Remove payment method
   */
  async removePaymentMethod(paymentMethodId) {
    try {
      await this.stripe.paymentMethods.detach(paymentMethodId);

      logger.audit('Payment method removed', null, {
        paymentMethodId
      });

      return {
        success: true,
        message: 'Payment method removed successfully'
      };
    } catch (error) {
      logger.error('Failed to remove payment method:', error);
      throw new Error(`Failed to remove payment method: ${error.message}`);
    }
  }

  /**
   * Process refund
   */
  async processRefund(refundData) {
    try {
      const { 
        paymentIntentId, 
        amount, 
        reason = 'requested_by_customer',
        metadata = {} 
      } = refundData;

      const refund = await this.stripe.refunds.create({
        payment_intent: paymentIntentId,
        amount,
        reason,
        metadata
      });

      logger.audit('Refund processed', null, {
        refundId: refund.id,
        paymentIntentId,
        amount,
        reason
      });

      return {
        success: true,
        refund: {
          id: refund.id,
          amount: refund.amount,
          status: refund.status,
          reason: refund.reason
        }
      };
    } catch (error) {
      logger.error('Failed to process refund:', error);
      throw new Error(`Refund processing failed: ${error.message}`);
    }
  }

  /**
   * Get payment history for customer
   */
  async getPaymentHistory(customerId, limit = 10) {
    try {
      const paymentIntents = await this.stripe.paymentIntents.list({
        customer: customerId,
        limit
      });

      const charges = await this.stripe.charges.list({
        customer: customerId,
        limit
      });

      return {
        success: true,
        payments: paymentIntents.data.map(pi => ({
          id: pi.id,
          amount: pi.amount,
          currency: pi.currency,
          status: pi.status,
          description: pi.description,
          created: pi.created,
          metadata: pi.metadata
        })),
        charges: charges.data.map(charge => ({
          id: charge.id,
          amount: charge.amount,
          currency: charge.currency,
          status: charge.status,
          description: charge.description,
          created: charge.created,
          refunded: charge.refunded,
          refunds: charge.refunds.data
        }))
      };
    } catch (error) {
      logger.error('Failed to get payment history:', error);
      throw new Error(`Failed to retrieve payment history: ${error.message}`);
    }
  }

  /**
   * Create price for subscription plans
   */
  async createSubscriptionPrice(priceData) {
    try {
      const { 
        amount, 
        currency = this.currency, 
        interval = 'month',
        productName,
        productDescription 
      } = priceData;

      // Create product first
      const product = await this.stripe.products.create({
        name: productName,
        description: productDescription,
        type: 'service'
      });

      // Create price
      const price = await this.stripe.prices.create({
        unit_amount: amount,
        currency,
        recurring: { interval },
        product: product.id,
      });

      logger.info('Subscription price created', {
        priceId: price.id,
        productId: product.id,
        amount,
        interval
      });

      return {
        success: true,
        price: {
          id: price.id,
          amount: price.unit_amount,
          currency: price.currency,
          interval: price.recurring.interval,
          productId: product.id
        }
      };
    } catch (error) {
      logger.error('Failed to create subscription price:', error);
      throw new Error(`Price creation failed: ${error.message}`);
    }
  }

  /**
   * Handle webhook events
   */
  async handleWebhook(rawBody, signature) {
    try {
      const event = this.stripe.webhooks.constructEvent(
        rawBody,
        signature,
        this.webhookSecret
      );

      logger.info('Stripe webhook received', {
        eventType: event.type,
        eventId: event.id
      });

      switch (event.type) {
        case 'payment_intent.succeeded':
          await this.handlePaymentSuccess(event.data.object);
          break;
        
        case 'payment_intent.payment_failed':
          await this.handlePaymentFailure(event.data.object);
          break;
        
        case 'subscription.created':
          await this.handleSubscriptionCreated(event.data.object);
          break;
        
        case 'subscription.updated':
          await this.handleSubscriptionUpdated(event.data.object);
          break;
        
        case 'subscription.deleted':
          await this.handleSubscriptionCancelled(event.data.object);
          break;
        
        case 'invoice.payment_succeeded':
          await this.handleInvoicePaymentSuccess(event.data.object);
          break;
        
        case 'invoice.payment_failed':
          await this.handleInvoicePaymentFailure(event.data.object);
          break;
        
        default:
          logger.info('Unhandled webhook event type:', event.type);
      }

      return { success: true, eventType: event.type };
    } catch (error) {
      logger.error('Webhook handling failed:', error);
      throw new Error(`Webhook processing failed: ${error.message}`);
    }
  }

  /**
   * Handle successful payment
   */
  async handlePaymentSuccess(paymentIntent) {
    const { metadata } = paymentIntent;
    
    logger.audit('Payment succeeded', metadata.patientId, {
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount,
      type: metadata.type
    });

    // Handle different payment types
    switch (metadata.type) {
      case 'appointment':
        await this.updateAppointmentPaymentStatus(metadata.appointmentId, 'paid');
        break;
      case 'prescription':
        await this.updatePrescriptionPaymentStatus(metadata.prescriptionId, 'paid');
        break;
    }
  }

  /**
   * Handle failed payment
   */
  async handlePaymentFailure(paymentIntent) {
    const { metadata } = paymentIntent;
    
    logger.error('Payment failed', {
      paymentIntentId: paymentIntent.id,
      lastPaymentError: paymentIntent.last_payment_error,
      metadata
    });

    // Handle payment failure based on type
    switch (metadata.type) {
      case 'appointment':
        await this.updateAppointmentPaymentStatus(metadata.appointmentId, 'failed');
        break;
      case 'prescription':
        await this.updatePrescriptionPaymentStatus(metadata.prescriptionId, 'failed');
        break;
    }
  }

  /**
   * Handle subscription created
   */
  async handleSubscriptionCreated(subscription) {
    logger.audit('Subscription created', subscription.metadata.userId, {
      subscriptionId: subscription.id,
      customerId: subscription.customer,
      status: subscription.status
    });
  }

  /**
   * Handle subscription updated
   */
  async handleSubscriptionUpdated(subscription) {
    logger.audit('Subscription updated', subscription.metadata.userId, {
      subscriptionId: subscription.id,
      status: subscription.status,
      currentPeriodEnd: subscription.current_period_end
    });
  }

  /**
   * Handle subscription cancelled
   */
  async handleSubscriptionCancelled(subscription) {
    logger.audit('Subscription cancelled', subscription.metadata.userId, {
      subscriptionId: subscription.id,
      cancelledAt: subscription.canceled_at
    });
  }

  /**
   * Handle invoice payment success
   */
  async handleInvoicePaymentSuccess(invoice) {
    logger.audit('Invoice payment succeeded', null, {
      invoiceId: invoice.id,
      subscriptionId: invoice.subscription,
      amount: invoice.amount_paid
    });
  }

  /**
   * Handle invoice payment failure
   */
  async handleInvoicePaymentFailure(invoice) {
    logger.error('Invoice payment failed', {
      invoiceId: invoice.id,
      subscriptionId: invoice.subscription,
      attemptCount: invoice.attempt_count
    });
  }

  /**
   * Update appointment payment status (placeholder)
   */
  async updateAppointmentPaymentStatus(appointmentId, status) {
    // This would update the appointment payment status in your database
    logger.info('Appointment payment status updated', {
      appointmentId,
      status
    });
  }

  /**
   * Update prescription payment status (placeholder)
   */
  async updatePrescriptionPaymentStatus(prescriptionId, status) {
    // This would update the prescription payment status in your database
    logger.info('Prescription payment status updated', {
      prescriptionId,
      status
    });
  }

  /**
   * Calculate platform fees
   */
  calculatePlatformFee(amount, feePercentage = 3) {
    return Math.round(amount * (feePercentage / 100));
  }

  /**
   * Get payment analytics
   */
  async getPaymentAnalytics(startDate, endDate) {
    try {
      const charges = await this.stripe.charges.list({
        created: {
          gte: Math.floor(startDate.getTime() / 1000),
          lte: Math.floor(endDate.getTime() / 1000)
        },
        limit: 1000
      });

      const analytics = {
        totalRevenue: 0,
        totalTransactions: charges.data.length,
        successfulPayments: 0,
        failedPayments: 0,
        refundedAmount: 0,
        averageTransactionValue: 0
      };

      charges.data.forEach(charge => {
        analytics.totalRevenue += charge.amount;
        if (charge.status === 'succeeded') {
          analytics.successfulPayments++;
        } else {
          analytics.failedPayments++;
        }
        analytics.refundedAmount += charge.amount_refunded;
      });

      analytics.averageTransactionValue = analytics.totalTransactions > 0 
        ? analytics.totalRevenue / analytics.totalTransactions 
        : 0;

      return {
        success: true,
        analytics,
        period: { startDate, endDate }
      };
    } catch (error) {
      logger.error('Failed to get payment analytics:', error);
      throw new Error(`Analytics retrieval failed: ${error.message}`);
    }
  }
}

module.exports = new PaymentService();
