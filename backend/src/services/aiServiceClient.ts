import { env } from "../config/env";

export interface AiOcrBlock {
  text: string;
  confidence: number;
  boundingBox: { x: number; y: number; width: number; height: number };
}

export interface AiOcrResult {
  engine: string;
  imageWidth: number;
  imageHeight: number;
  processingTimeMs: number;
  fullText: string;
  blocks: AiOcrBlock[];
}

/**
 * Thrown for every failure mode where the AI service simply isn't usable
 * right now — down, unreachable, timed out, or reporting its OCR engine
 * isn't installed. Callers must degrade gracefully (brief §34: "AI analysis
 * service unavailable", not a crash and never fabricated results) rather
 * than treating this the same as a bad request.
 */
export class AiServiceUnavailableError extends Error {}

/**
 * Sends one image to the AI service's /ocr endpoint using Node's built-in
 * fetch/FormData/Blob (Node 18+) — no extra HTTP-client dependency needed
 * for a single multipart call.
 */
export async function runOcrOnImage(
  buffer: Buffer,
  filename: string,
  mimeType: string
): Promise<AiOcrResult> {
  const form = new FormData();
  form.append("file", new Blob([buffer], { type: mimeType }), filename);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), env.aiServiceTimeoutMs);

  let response: Response;
  try {
    response = await fetch(`${env.aiServiceUrl}/ocr`, {
      method: "POST",
      body: form,
      signal: controller.signal,
    });
  } catch (err) {
    if ((err as Error).name === "AbortError") {
      throw new AiServiceUnavailableError(
        `AI analysis service timed out after ${env.aiServiceTimeoutMs}ms.`
      );
    }
    throw new AiServiceUnavailableError(
      "AI analysis service unavailable. Is it running? " +
        `(expected at ${env.aiServiceUrl})`
    );
  } finally {
    clearTimeout(timeoutId);
  }

  if (response.status === 503) {
    const body = await safeJson(response);
    throw new AiServiceUnavailableError(
      body?.detail ?? "AI analysis service reported its OCR engine is unavailable."
    );
  }

  if (!response.ok) {
    const body = await safeJson(response);
    throw new Error(body?.detail ?? `AI service returned HTTP ${response.status}.`);
  }

  return (await response.json()) as AiOcrResult;
}

async function safeJson(response: Response): Promise<{ detail?: string } | null> {
  try {
    return (await response.json()) as { detail?: string };
  } catch {
    return null;
  }
}
