import type { RequestHandler } from 'express';
import multer from 'multer';
import { ApiError } from '../../utils/ApiError';

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_IMAGE_BYTES, files: 1 },
  fileFilter: (_req, file, callback) => {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      callback(new ApiError(400, 'Only JPEG, PNG or WebP images are allowed'));
      return;
    }

    callback(null, true);
  },
});

export const singleProductImage: RequestHandler = (req, res, next) => {
  upload.single('image')(req, res, (error) => {
    if (error instanceof ApiError) {
      next(error);
      return;
    }

    if (error instanceof multer.MulterError) {
      next(
        new ApiError(
          400,
          error.code === 'LIMIT_FILE_SIZE'
            ? 'Image must be 5 MB or smaller'
            : 'Image upload failed',
        ),
      );
      return;
    }

    next(error);
  });
};
