import { randomUUID } from 'node:crypto';
import { Queue, Worker } from 'bullmq';
import { env } from '../config/env';
import { logger } from '../utils/logger';
import { getRequestId } from '../utils/requestContext';
import type { MailMessage } from '../modules/notifications/mail.templates';
import { sendMail } from '../modules/notifications/mailer';
import { createRedisConnection } from './redis';

type JobName = 'email.send';

interface EmailJobData {
  message: MailMessage;
  requestId?: string;
}

interface InternalJob {
  id: string;
  name: JobName;
  data: EmailJobData;
}

const QUEUE_NAME = 'email';

const pending: InternalJob[] = [];
const idleWaiters: Array<() => void> = [];
let active = 0;

let queue: Queue<EmailJobData> | null = null;
let worker: Worker<EmailJobData> | null = null;

async function handleJob(name: string, data: EmailJobData): Promise<void> {
  if (name !== 'email.send') {
    logger.warn('queue.unknown-job', { name });
    return;
  }

  await sendMail(data.message, data.requestId);
  logger.info('queue.job-completed', { name, requestId: data.requestId });
}

function notifyIdle(): void {
  if (active === 0 && pending.length === 0) {
    const waiters = idleWaiters.splice(0);
    waiters.forEach((resolve) => resolve());
  }
}

async function runMemoryJob(job: InternalJob): Promise<void> {
  active += 1;

  try {
    await handleJob(job.name, job.data);
  } catch (error) {
    logger.error('queue.job-failed', { jobId: job.id, name: job.name, err: error });
  } finally {
    active -= 1;
    notifyIdle();

    if (pending.length > 0) {
      processNext();
    }
  }
}

function processNext(): void {
  if (active > 0 || pending.length === 0) {
    return;
  }

  const job = pending.shift();

  if (job) {
    void runMemoryJob(job);
  }
}

function getQueue(): Queue<EmailJobData> {
  if (!queue) {
    queue = new Queue<EmailJobData>(QUEUE_NAME, {
      connection: createRedisConnection('queue'),
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 1000 },
        removeOnComplete: 100,
        removeOnFail: 100,
      },
    });
  }

  return queue;
}

export async function startQueue(): Promise<void> {
  if (env.QUEUE_DRIVER !== 'bullmq' || worker) {
    logger.info('queue.ready', { driver: env.QUEUE_DRIVER });
    return;
  }

  worker = new Worker<EmailJobData>(
    QUEUE_NAME,
    async (job) => {
      await handleJob(job.name, job.data);
    },
    { connection: createRedisConnection('worker'), concurrency: 2 },
  );

  worker.on('failed', (job, error) => {
    logger.error('queue.job-failed', { jobId: job?.id, name: job?.name, err: error });
  });
  worker.on('error', (error) => {
    logger.warn('queue.worker-error', { err: error });
  });

  logger.info('queue.started', { driver: 'bullmq' });
}

export async function enqueueEmail(
  message: MailMessage,
  requestId = getRequestId(),
): Promise<void> {
  try {
    if (env.QUEUE_DRIVER === 'none') {
      logger.debug('queue.skipped', { to: message.to, requestId });
      return;
    }

    if (env.QUEUE_DRIVER === 'bullmq') {
      await getQueue().add('email.send', { message, requestId });
      logger.info('queue.enqueued', { driver: 'bullmq', to: message.to, requestId });
      return;
    }

    const job: InternalJob = {
      id: randomUUID(),
      name: 'email.send',
      data: { message, requestId },
    };

    pending.push(job);
    logger.info('queue.enqueued', { driver: 'memory', jobId: job.id, to: message.to, requestId });
    processNext();
  } catch (error) {
    logger.error('queue.enqueue-failed', { to: message.to, err: error });
  }
}

export function waitForQueueIdle(timeoutMs = 5000): Promise<void> {
  if (active === 0 && pending.length === 0) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const waiter = (): void => {
      clearTimeout(timer);
      resolve();
    };

    const timer = setTimeout(() => {
      const index = idleWaiters.indexOf(waiter);

      if (index >= 0) {
        idleWaiters.splice(index, 1);
      }

      reject(new Error('Queue did not drain before the timeout'));
    }, timeoutMs);

    idleWaiters.push(waiter);
  });
}

export async function stopQueue(): Promise<void> {
  if (env.QUEUE_DRIVER === 'memory') {
    await waitForQueueIdle().catch(() => undefined);
  }

  await worker?.close();
  worker = null;
  await queue?.close();
  queue = null;

  logger.info('queue.stopped', { driver: env.QUEUE_DRIVER });
}
