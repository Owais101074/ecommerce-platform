import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { env } from '../../config/env';
import { logger } from '../../utils/logger';
import type { MailMessage } from './mail.templates';

export interface SentMail extends MailMessage {
  driver: 'log' | 'smtp';
  sentAt: string;
  requestId?: string;
}

const OUTBOX_LIMIT = 50;
const outbox: SentMail[] = [];
let transporter: Transporter | null = null;

function getTransporter(): Transporter {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_SECURE,
      auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined,
    });
  }

  return transporter;
}

function record(mail: SentMail): void {
  outbox.push(mail);

  if (outbox.length > OUTBOX_LIMIT) {
    outbox.shift();
  }
}

/**
 * `log` is the development and test transport: the message is recorded in the
 * outbox and logged instead of being sent. `smtp` uses Nodemailer.
 */
export async function sendMail(message: MailMessage, requestId?: string): Promise<void> {
  if (env.MAIL_DRIVER === 'none') {
    logger.debug('mail.skipped', { to: message.to, subject: message.subject, requestId });
    return;
  }

  if (env.MAIL_DRIVER === 'log') {
    const sentAt = new Date().toISOString();
    record({ ...message, driver: 'log', sentAt, requestId });
    logger.info('mail.sent', {
      driver: 'log',
      to: message.to,
      subject: message.subject,
      preview: message.text.slice(0, 160),
      requestId,
    });
    return;
  }

  await getTransporter().sendMail({ from: env.MAIL_FROM, ...message });
  record({ ...message, driver: 'smtp', sentAt: new Date().toISOString(), requestId });
  logger.info('mail.sent', {
    driver: 'smtp',
    to: message.to,
    subject: message.subject,
    requestId,
  });
}

export function getMailOutbox(): readonly SentMail[] {
  return outbox;
}

export function resetMailOutbox(): void {
  outbox.length = 0;
}

export function closeMailer(): void {
  transporter?.close();
  transporter = null;
}
