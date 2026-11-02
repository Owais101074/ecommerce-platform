import type { Request, Response } from 'express';
import { sendSuccess } from '../../utils/ApiResponse';

export function ping(req: Request, res: Response): void {
  sendSuccess(res, 200, 'Admin access granted', { user: req.user });
}
