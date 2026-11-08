import type { Request, Response } from 'express';
import { sendSuccess } from '../../utils/ApiResponse';
import { getAdminStats } from './admin.stats.service';

export async function stats(_req: Request, res: Response): Promise<void> {
  const dashboard = await getAdminStats();
  sendSuccess(res, 200, 'Dashboard stats fetched', { stats: dashboard });
}
