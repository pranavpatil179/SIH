/**
 * Gemini Vision — OCR + tamper/risk analysis.
 *
 * Uses @google/generative-ai (gemini-1.5-flash) to extract structured fields
 * from a document image and return a risk score.
 *
 * Requires GOOGLE_AI_API_KEY set to a valid Google AI Studio key (starts with AIzaSy...).
 * Get one free at: https://aistudio.google.com/app/apikey
 */

import type { RiskLevel } from "@/lib/types";

export interface GeminiOcrResult {
  licence_number: string | null;
  company_name: string | null;
  valid_from: string | null;   // ISO date string YYYY-MM-DD or null
  valid_until: string | null;
  raw_text: string;
  risk_level: RiskLevel;
  risk_reason: string;
  error?: string; // Set when real analysis failed
}

const OCR_PROMPT = `You are a document analysis assistant for a government approval portal.
Analyze this document image and extract the following information in JSON format:

{
  "licence_number": "the licence or registration number visible in the document, or null if not found",
  "company_name": "the company or applicant name visible in the document, or null",
  "valid_from": "validity start date in YYYY-MM-DD format, or null",
  "valid_until": "validity end date in YYYY-MM-DD format, or null",
  "raw_text": "all visible text in the document, summarized in 2-3 sentences",
  "risk_level": "low | medium | high",
  "risk_reason": "one sentence explaining the risk assessment"
}

For risk_level:
- "low" = document looks authentic with consistent formatting and clear data
- "medium" = some inconsistencies (font mismatch, unclear stamp, partially obscured text)
- "high" = signs of tampering (pasted text, inconsistent dates, overlaid images, multiple fonts) OR this is clearly not a government document (e.g. a selfie, personal photo, unrelated image)

IMPORTANT: Do NOT claim the document is genuine. Only report what you observe.
If the image is NOT a document (e.g. a selfie or photo of a person), set risk_level to "high" and explain in risk_reason.
Return ONLY valid JSON, no markdown fences.`;

/** Convert image bytes to a Gemini-compatible inline data part. */
function imageToInlinePart(bytes: Buffer, mimeType: string) {
  return {
    inlineData: {
      data: bytes.toString("base64"),
      mimeType,
    },
  };
}

/** Returned when OCR analysis could not be completed. */
function failedResult(reason: string): GeminiOcrResult {
  return {
    licence_number: null,
    company_name: null,
    valid_from: null,
    valid_until: null,
    raw_text: "Analysis could not be completed.",
    risk_level: "high",
    risk_reason: reason,
    error: reason,
  };
}

export async function extractWithGemini(
  imageBytes: Buffer,
  mimeType: string,
  fileName: string,
): Promise<GeminiOcrResult> {
  const apiKey = process.env.GOOGLE_AI_API_KEY;

  // No key set
  if (!apiKey) {
    return failedResult(
      "GOOGLE_AI_API_KEY is not configured. Go to https://aistudio.google.com/app/apikey to get a free API key and add it to your Vercel environment variables."
    );
  }

  // Warn if key looks wrong (Gemini keys start with AIzaSy)
  if (!apiKey.startsWith("AIzaSy")) {
    console.warn(
      "[gemini] Warning: GOOGLE_AI_API_KEY does not look like a valid Gemini API key. " +
      "Keys from https://aistudio.google.com/app/apikey start with 'AIzaSy'."
    );
  }

  try {
    // Dynamic import so Next.js doesn't bundle this for client
    const { GoogleGenerativeAI } = await import("@google/generative-ai");
    const genai = new GoogleGenerativeAI(apiKey);
    const model = genai.getGenerativeModel({ model: "gemini-1.5-pro" });

    const result = await model.generateContent([
      OCR_PROMPT,
      imageToInlinePart(imageBytes, mimeType),
    ]);

    const text = result.response.text().trim();
    // Strip markdown fences if model adds them
    const json = text.replace(/^```[a-z]*\n?/, "").replace(/\n?```$/, "");
    const parsed = JSON.parse(json) as GeminiOcrResult;

    // Sanitize risk_level
    if (!["low", "medium", "high"].includes(parsed.risk_level)) {
      parsed.risk_level = "low";
    }

    return parsed;
  } catch (err: any) {
    console.error("[gemini] OCR failed:", err);

    // Provide a clear error message based on the failure type
    const message = err?.message ?? String(err);
    if (message.includes("API_KEY_INVALID") || message.includes("400")) {
      return failedResult(
        "Gemini API key is invalid. Please get a valid key from https://aistudio.google.com/app/apikey (keys start with AIzaSy) and update GOOGLE_AI_API_KEY in Vercel."
      );
    }
    if (message.includes("quota") || message.includes("429")) {
      return failedResult("Gemini API quota exceeded. Please check your Google AI Studio usage.");
    }

    return failedResult(`Gemini analysis failed: ${message}`);
  }
}
