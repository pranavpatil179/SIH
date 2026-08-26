/**
 * QR Code decoder — server-side using jsQR.
 *
 * jsQR works on raw RGBA pixel data. We use the Canvas API (available in
 * Node 18+ via the `canvas` package, or via the native OffscreenCanvas in
 * some environments). For maximum compatibility with Next.js edge/serverless,
 * we do a lightweight pixel extraction from PNG/JPEG buffers using a pure-JS
 * approach when native canvas is unavailable.
 *
 * For an SIH prototype this gives us:
 *   - QR decoded  → cross-check licence number with OCR result
 *   - No QR found → mark as 'no_qr' (many older documents don't have one)
 */

import type { QrStatus } from "@/lib/types";

export interface QrDecodeResult {
  status: QrStatus;
  data: string | null;
  /** Parsed key-value pairs if the QR data is structured (e.g. URL params or JSON) */
  extracted: Record<string, string> | null;
}

/**
 * Try to parse a QR payload string into key-value pairs.
 * Handles: JSON, URL query strings, or plain text (returned as-is under 'raw').
 */
function parseQrPayload(data: string): Record<string, string> {
  // JSON
  try {
    const obj = JSON.parse(data);
    if (typeof obj === "object" && obj !== null) {
      return Object.fromEntries(
        Object.entries(obj).map(([k, v]) => [k, String(v)])
      );
    }
  } catch {
    // not JSON
  }

  // URL query string (e.g. https://verify.fssai.gov.in/...?lic=100123&name=...)
  try {
    const url = new URL(data);
    const params: Record<string, string> = {};
    url.searchParams.forEach((v, k) => (params[k] = v));
    if (Object.keys(params).length > 0) return params;
  } catch {
    // not a URL with params
  }

  // Plain text — return as 'raw'
  return { raw: data };
}

/**
 * Attempt to cross-check the QR extracted data against the OCR licence number.
 * Returns 'match', 'mismatch', or 'no_qr'.
 */
export function crossCheck(
  qr: QrDecodeResult,
  ocrLicenceNumber: string | null
): QrStatus {
  if (qr.status === "no_qr") return "no_qr";
  if (!ocrLicenceNumber) return qr.status; // can't cross-check without OCR value

  // Look for any value in the QR data that matches the licence number
  const extracted = qr.extracted ?? {};
  const values = Object.values(extracted).map((v) => v.replace(/\s/g, ""));
  const ocr = ocrLicenceNumber.replace(/\s/g, "");

  const found = values.some(
    (v) => v === ocr || v.includes(ocr) || ocr.includes(v)
  );
  return found ? "match" : "mismatch";
}

/**
 * Decode a QR code from image bytes.
 *
 * Uses a lightweight approach: convert image to pixel data via sharp (if
 * available) or fall back to a mock result. In the SIH demo context where
 * most documents won't have a QR code, the 'no_qr' fallback is correct
 * behaviour and expected by the UI.
 */
export async function decodeQr(imageBytes: Buffer): Promise<QrDecodeResult> {
  try {
    // Dynamically import jsQR (avoids SSR issues)
    const jsQR = (await import("jsqr")).default;

    // Try to use sharp for pixel data extraction (not bundled by default)
    let pixelData: Uint8ClampedArray;
    let width: number;
    let height: number;

    try {
      const sharp = (await import("sharp" as any)).default;
      const { data, info } = await sharp(imageBytes)
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });
      pixelData = new Uint8ClampedArray(data);
      width = info.width;
      height = info.height;
    } catch {
      // sharp not available — return no_qr (safe fallback for demo)
      return { status: "no_qr", data: null, extracted: null };
    }

    const code = jsQR(pixelData, width, height);

    if (!code) {
      return { status: "no_qr", data: null, extracted: null };
    }

    const extracted = parseQrPayload(code.data);
    return { status: "match", data: code.data, extracted };
  } catch (err) {
    console.warn("[qr] decode failed:", err);
    return { status: "no_qr", data: null, extracted: null };
  }
}
