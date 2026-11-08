export {};

declare global {
  interface RazorpayPaymentResponse {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }

  interface RazorpayCheckoutOptions {
    key: string;
    amount: number;
    currency: string;
    name: string;
    description?: string;
    order_id: string;
    prefill?: {
      name?: string;
      contact?: string;
      email?: string;
    };
    notes?: Record<string, string>;
    theme?: {
      color?: string;
    };
    handler: (response: RazorpayPaymentResponse) => void;
    modal?: {
      ondismiss?: () => void;
      escape?: boolean;
      confirm_close?: boolean;
    };
  }

  interface RazorpayInstance {
    open: () => void;
    on: (event: string, handler: () => void) => void;
  }

  interface Window {
    Razorpay?: new (options: RazorpayCheckoutOptions) => RazorpayInstance;
  }
}
