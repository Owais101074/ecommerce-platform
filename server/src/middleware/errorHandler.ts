import type { ErrorRequestHandler } from 'express';
import mongoose from 'mongoose';
import { ZodError } from 'zod';
import { env } from '../config/env';
import { ApiError, type ErrorDetail } from '../utils/ApiError';

interface DuplicateKeyError {
  code?: number;
  keyValue?: Record<string, unknown>;
}

const isDuplicateKeyError = (error: unknown): error is DuplicateKeyError => {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as DuplicateKeyError).code === 11000
  );
};

export const errorHandler: ErrorRequestHandler = (error, _req, res, next) => {
  if (res.headersSent) {
    return next(error);
  }

  let statusCode = 500;
  let message = 'Internal server error';
  let details: ErrorDetail[] | undefined;

  if (error instanceof ApiError) {
    statusCode = error.statusCode;
    message = error.message;
    details = error.details;
  } else if (error instanceof ZodError) {
    statusCode = 400;
    message = 'Validation failed';
    details = error.issues.map((issue) => ({
      field: issue.path.join('.') || 'body',
      message: issue.message,
    }));
  } else if (error instanceof mongoose.Error.ValidationError) {
    statusCode = 400;
    message = 'Validation failed';
    details = Object.values(error.errors).map((item) => ({
      field: item.path,
      message: item.message,
    }));
  } else if (error instanceof mongoose.Error.CastError) {
    statusCode = 400;
    message = `Invalid value for ${error.path}`;
  } else if (isDuplicateKeyError(error)) {
    statusCode = 409;
    const fields = Object.keys(error.keyValue ?? {}).join(', ');
    message = fields ? `Duplicate value for: ${fields}` : 'Duplicate value';
  } else if (error instanceof SyntaxError && 'body' in error) {
    statusCode = 400;
    message = 'Invalid JSON payload';
  }

  if (statusCode >= 500) {
    console.error('[error]', error);
  } else if (env.NODE_ENV === 'development') {
    console.warn(`[error] ${statusCode} ${message}`);
  }

  const body: Record<string, unknown> = { success: false, message };
  if (details) {
    body.errors = details;
  }
  if (env.NODE_ENV === 'development' && statusCode >= 500 && error instanceof Error) {
    body.stack = error.stack;
  }

  res.status(statusCode).json(body);
};
