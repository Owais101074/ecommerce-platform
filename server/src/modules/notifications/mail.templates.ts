export type OrderEmailKind = 'placed' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';

export interface MailMessage {
  to: string;
  subject: string;
  text: string;
  html: string;
}

export interface OrderEmailInput {
  kind: OrderEmailKind;
  to: string;
  customerName: string;
  orderNumber: string;
  totalPaise: number;
  itemCount: number;
  tracking?: { carrier: string; trackingNumber: string } | null;
}

const SUBJECTS: Record<OrderEmailKind, string> = {
  placed: 'We received your order',
  confirmed: 'Your payment is confirmed',
  shipped: 'Your order is on the way',
  delivered: 'Your order was delivered',
  cancelled: 'Your order was cancelled',
};

function formatMoney(paise: number): string {
  return (paise / 100).toLocaleString('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  });
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function buildBody(input: OrderEmailInput): string {
  const summary = `Order ${input.orderNumber} (${input.itemCount} item${
    input.itemCount === 1 ? '' : 's'
  }) · ${formatMoney(input.totalPaise)}`;

  switch (input.kind) {
    case 'placed':
      return `Thanks for your order. ${summary}. We will email you again when the payment is confirmed.`;
    case 'confirmed':
      return `Payment received. ${summary} is confirmed and will be prepared for shipping.`;
    case 'shipped':
      return input.tracking
        ? `${summary} has shipped with ${input.tracking.carrier}. Tracking number: ${input.tracking.trackingNumber}.`
        : `${summary} has shipped.`;
    case 'delivered':
      return `${summary} was delivered. We hope you enjoy it.`;
    case 'cancelled':
      return `${summary} was cancelled. If you paid online, any refund will be processed to your original payment method.`;
  }
}

export function buildOrderEmail(input: OrderEmailInput): MailMessage {
  const body = buildBody(input);
  const name = escapeHtml(input.customerName);
  const escapedBody = escapeHtml(body);

  return {
    to: input.to,
    subject: `${SUBJECTS[input.kind]} · ${input.orderNumber}`,
    text: `Hi ${input.customerName}, ${body}`,
    html: [
      '<div style="font-family:Arial,sans-serif;line-height:1.6;color:#1f2933">',
      `<p>Hi ${name},</p>`,
      `<p>${escapedBody}</p>`,
      '<p>— Ecommerce Platform</p>',
      '</div>',
    ].join(''),
  };
}
