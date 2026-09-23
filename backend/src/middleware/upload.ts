import multer from "multer";
import { env } from "../config/env";

const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp"]);

/**
 * Files are held in memory rather than written straight to disk, because we
 * validate them (type, size, decodability) and only persist them once an
 * Inspection document exists to hang them off — see inspectionController.
 */
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: env.maxUploadSizeMb * 1024 * 1024,
    files: 6, // multi-side package images (front/back/side/etc.)
  },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      cb(new multer.MulterError("LIMIT_UNEXPECTED_FILE", file.fieldname));
      return;
    }
    cb(null, true);
  },
});

export const uploadPackageImages = upload.array("images", 6);
