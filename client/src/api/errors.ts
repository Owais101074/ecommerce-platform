import { isAxiosError } from 'axios';
import type { ApiFailure, ApiFieldError } from '@/types/api';

export class ApiError extends Error {
  readonly status: number;
  readonly errors: ApiFieldError[];

  constructor(message: string, status: number, errors: ApiFieldError[] = []) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errors = errors;
  }
}

/** Turns an axios failure into one predictable shape the UI can render. */
export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) {
    return error;
  }

  if (isAxiosError<ApiFailure>(error)) {
    const { response } = error;
    const body = response?.data;

    if (body && typeof body === 'object' && typeof body.message === 'string') {
      return new ApiError(body.message, response?.status ?? 500, body.errors ?? []);
    }

    if (error.code === 'ECONNABORTED') {
      return new ApiError('The request timed out. Please try again.', 0);
    }

    if (!response) {
      return new ApiError('Cannot reach the server. Make sure the API is running.', 0);
    }

    return new ApiError(error.message, response.status);
  }

  return new ApiError('Something went wrong. Please try again.', 500);
}

export function getErrorMessage(error: unknown): string {
  return toApiError(error).message;
}

/** Maps server field errors (e.g. `email`) onto form inputs. */
export function getFieldErrors(error: unknown): Record<string, string> {
  return toApiError(error).errors.reduce<Record<string, string>>((accumulator, item) => {
    accumulator[item.field] = item.message;
    return accumulator;
  }, {});
}
