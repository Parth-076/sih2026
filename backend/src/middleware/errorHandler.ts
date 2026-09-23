import { ErrorRequestHandler, RequestHandler } from "express";
import multer from "multer";
import { ApiError } from "../utils/ApiError";
import { isProd } from "../config/env";

export const notFoundHandler: RequestHandler = (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  if (err instanceof ApiError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      details: err.details,
    });
    return;
  }

  // Uploaded-image validation failures (bad type, too large, too many files)
  if (err instanceof multer.MulterError) {
    const messages: Record<string, string> = {
      LIMIT_FILE_SIZE: `Image exceeds the maximum upload size of ${process.env.MAX_UPLOAD_SIZE_MB ?? 10}MB.`,
      LIMIT_FILE_COUNT: "Too many images — a maximum of 6 package images is supported.",
      LIMIT_UNEXPECTED_FILE: "Unsupported file type. Please upload JPG, JPEG, PNG, or WEBP images.",
    };
    res.status(400).json({
      success: false,
      message: messages[err.code] ?? "Could not process the uploaded image(s).",
    });
    return;
  }

  // Mongoose duplicate key error (e.g. duplicate email or barcode)
  if (err && typeof err === "object" && "code" in err && (err as { code: number }).code === 11000) {
    res.status(409).json({
      success: false,
      message: "A record with this value already exists.",
      details: isProd ? undefined : err,
    });
    return;
  }

  // Mongoose validation error
  if (err && typeof err === "object" && (err as { name?: string }).name === "ValidationError") {
    res.status(400).json({
      success: false,
      message: "Validation failed.",
      details: isProd ? undefined : err,
    });
    return;
  }

  // eslint-disable-next-line no-console
  console.error("[unhandled error]", err);
  res.status(500).json({
    success: false,
    message: "Something went wrong on the server.",
    details: isProd ? undefined : (err as Error)?.message,
  });
};
