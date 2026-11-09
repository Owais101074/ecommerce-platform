import type { AuthUser } from '../modules/auth/auth.types';
import type { Logger } from '../utils/logger';

declare module 'express-serve-static-core' {
  interface Request {
    user?: AuthUser;
    validatedQuery?: unknown;
    id: string;
    log: Logger;
  }
}
