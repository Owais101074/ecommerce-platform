import type { Request, Response } from 'express';
import { ApiError } from '../../utils/ApiError';
import { sendSuccess } from '../../utils/ApiResponse';
import { uploadImage } from './cloudinary.service';

export async function uploadProductImage(req: Request, res: Response): Promise<void> {
  if (!req.file) {
    throw new ApiError(400, 'Choose an image to upload');
  }

  const image = await uploadImage(req.file);
  sendSuccess(res, 201, 'Image uploaded', { image });
}
