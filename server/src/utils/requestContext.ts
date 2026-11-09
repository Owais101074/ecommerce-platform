import { AsyncLocalStorage } from 'node:async_hooks';

interface RequestStore {
  requestId: string;
}

const storage = new AsyncLocalStorage<RequestStore>();

export function runWithRequestContext<T>(requestId: string, callback: () => T): T {
  return storage.run({ requestId }, callback);
}

/** Lets services and queued jobs attach the originating request id. */
export function getRequestId(): string | undefined {
  return storage.getStore()?.requestId;
}
