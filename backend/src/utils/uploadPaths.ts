import path from "path";
import { env } from "../config/env";

const MIME_BY_EXT: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

/** Converts a served "/uploads/inspections/<id>/img-0.jpg" path back to an absolute file path. */
export function uploadPathToFilePath(servedPath: string): string {
  const relative = servedPath.replace(/^\/uploads\//, "");
  return path.join(env.uploadDir, relative);
}

export function mimeTypeForFile(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  return MIME_BY_EXT[ext] ?? "application/octet-stream";
}
