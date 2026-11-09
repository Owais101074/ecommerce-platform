import { env } from '../config/env';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export type LogFields = Record<string, unknown>;

type LogMethod = (message: string, fields?: LogFields) => void;

export interface Logger {
  debug: LogMethod;
  info: LogMethod;
  warn: LogMethod;
  error: LogMethod;
  child: (fields: LogFields) => Logger;
}

const LEVEL_WEIGHT: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

function serializeError(error: Error): LogFields {
  return {
    name: error.name,
    message: error.message,
    stack: error.stack,
  };
}

function normalizeFields(fields: LogFields): LogFields {
  const normalized: LogFields = {};

  for (const [key, value] of Object.entries(fields)) {
    normalized[key] = value instanceof Error ? serializeError(value) : value;
  }

  return normalized;
}

function write(level: LogLevel, message: string, fields: LogFields): void {
  if (LEVEL_WEIGHT[level] < LEVEL_WEIGHT[env.LOG_LEVEL]) {
    return;
  }

  const entry = {
    level,
    time: new Date().toISOString(),
    message,
    ...normalizeFields(fields),
  };

  let line: string;

  try {
    line = JSON.stringify(entry);
  } catch {
    line = JSON.stringify({
      level,
      time: entry.time,
      message,
      logError: 'Fields could not be serialized',
    });
  }

  if (level === 'error') {
    console.error(line);
  } else if (level === 'warn') {
    console.warn(line);
  } else {
    console.log(line);
  }
}

function createLogger(base: LogFields): Logger {
  return {
    debug: (message, fields = {}) => write('debug', message, { ...base, ...fields }),
    info: (message, fields = {}) => write('info', message, { ...base, ...fields }),
    warn: (message, fields = {}) => write('warn', message, { ...base, ...fields }),
    error: (message, fields = {}) => write('error', message, { ...base, ...fields }),
    child: (fields) => createLogger({ ...base, ...fields }),
  };
}

export const logger: Logger = createLogger({ service: 'ecommerce-api' });
