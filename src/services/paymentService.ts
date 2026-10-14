import { OrderItem, PaymentMethod } from '../types';

export interface CreatePaymentInput {
  userId: string;
  userEmail: string;
  userName?: string;
  items: OrderItem[];
  total: number;
  discount?: number;
  couponCode?: string | null;
  paymentMethod: PaymentMethod;
  senderPhone: string;
  transactionRef: string;
  note?: string;
}

export interface PaymentResult {
  success: boolean;
  orderId?: string;
  error?: string;
  redirectUrl?: string;
}

/**
 * Interface allowing future automated payment gateways (Paymob, Fawry, Stripe, etc.)
 * to be plugged in seamlessly without changing checkout logic.
 */
export interface PaymentGateway {
  id: PaymentMethod | string;
  name: string;
  processPayment(input: CreatePaymentInput): Promise<PaymentResult>;
}

/**
 * Manual transfer gateway for Vodafone Cash and InstaPay.
 * Collects Egyptian mobile sender number and transaction reference.
 */
export class ManualTransferGateway implements PaymentGateway {
  id: PaymentMethod;
  name: string;

  constructor(method: PaymentMethod, name: string) {
    this.id = method;
    this.name = name;
  }

  async processPayment(_input: CreatePaymentInput): Promise<PaymentResult> {
    // For manual transfer, the order is created with status: 'pending' and reviewed by admin
    return {
      success: true,
    };
  }
}

export const paymentGateways: Record<PaymentMethod, PaymentGateway> = {
  vodafone_cash: new ManualTransferGateway('vodafone_cash', 'فودافون كاش (Vodafone Cash)'),
  instapay: new ManualTransferGateway('instapay', 'إنستاباي (InstaPay)'),
};
