import { createHash } from 'node:crypto';
import { env } from '../../config/env';
import { ApiError } from '../../utils/ApiError';

const CLOUDINARY_API_URL = 'https://api.cloudinary.com/v1_1';

export interface UploadedImage {
  url: string;
  publicId: string;
}

interface CloudinaryResponse {
  secure_url?: string;
  public_id?: string;
  error?: { message?: string };
}

export function isCloudinaryConfigured(): boolean {
  return Boolean(env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET);
}

/**
 * Cloudinary signs the alphabetically sorted params plus the API secret, so
 * `folder` must come before `timestamp` in the signed string.
 */
function signUpload(folder: string, timestamp: number): string {
  return createHash('sha1')
    .update(`folder=${folder}&timestamp=${timestamp}${env.CLOUDINARY_API_SECRET}`)
    .digest('hex');
}

export async function uploadImage(file: Express.Multer.File): Promise<UploadedImage> {
  if (!isCloudinaryConfigured()) {
    throw new ApiError(503, 'Image uploads are not configured on this server');
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const folder = env.CLOUDINARY_FOLDER;
  const body = new FormData();

  body.append(
    'file',
    new Blob([new Uint8Array(file.buffer)], { type: file.mimetype }),
    file.originalname,
  );
  body.append('api_key', env.CLOUDINARY_API_KEY);
  body.append('timestamp', String(timestamp));
  body.append('folder', folder);
  body.append('signature', signUpload(folder, timestamp));

  const response = await fetch(`${CLOUDINARY_API_URL}/${env.CLOUDINARY_CLOUD_NAME}/image/upload`, {
    method: 'POST',
    body,
  });
  const payload = (await response.json()) as CloudinaryResponse;

  if (!response.ok || !payload.secure_url) {
    throw new ApiError(502, payload.error?.message ?? 'Cloudinary upload failed');
  }

  return { url: payload.secure_url, publicId: payload.public_id ?? '' };
}
