/**
 * Gemini Vision — OCR + tamper/risk analysis.
 *
 * Uses @google/generative-ai (gemini-1.5-flash) to extract structured fields
 * from a document image and return a risk score.
 *
 * If GOOGLE_AI_API_KEY is not set, returns a realistic mock response so the
 * full UI flow works without an API key (great for SIH demo setup).
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
}

const OCR_PROMPT = `You are a document analysis assistant for a government approval portal.
Analyze this document image and extract the following information in JSON format:

{
  "licence_number": "the licence or registration number, or null if not found",
  "company_name": "the company or applicant name, or null",
  "valid_from": "validity start date in YYYY-MM-DD format, or null",
  "valid_until": "validity end date in YYYY-MM-DD format, or null",
  "raw_text": "all visible text in the document, briefly summarized",
  "risk_level": "low | medium | high",
  "risk_reason": "one sentence explaining the risk assessment"
}

For risk_level:
- "low" = document looks authentic with consistent formatting and clear data
- "medium" = some inconsistencies (font mismatch, unclear stamp, partially obscured text)
- "high" = signs of tampering (pasted text, inconsistent dates, overlaid images, multiple fonts)

IMPORTANT: Do NOT claim the document is genuine. Only report what you observe.
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

/** Generate a mock response for demo/dev use when no API key is configured. */
function mockResponse(fileName: string): GeminiOcrResult {
  const isFood = fileName.toLowerCase().includes("fssai");
  const isFactory = fileName.toLowerCase().includes("factory");

  return {
    licence_number: isFood
      ? "100" + Math.floor(Math.random() * 900000000 + 100000000)
      : isFactory
        ? "MH/FAC/" + Math.floor(Math.random() * 90000 + 10000)
        : "LIC-" + Math.floor(Math.random() * 9000000 + 1000000),
    company_name: null,  // applicant fills this from their own record
    valid_from: "2026-01-01",
    valid_until: "2027-12-31",
    raw_text: "[Mock OCR — set GOOGLE_AI_API_KEY to enable real extraction]",
    risk_level: "low",
    risk_reason:
      "Mock analysis: document structure appears consistent (no real image analyzed).",
  };
}

export async function extractWithGemini(
  imageBytes: Buffer,
  mimeType: string,
  fileName: string,
): Promise<GeminiOcrResult> {
  const apiKey = process.env.GOOGLE_AI_API_KEY;

  // No key → return realistic mock
  if (!apiKey) {
    return mockResponse(fileName);
  }

  try {
    // Dynamic import so Next.js doesn't bundle this for client
    const { GoogleGenerativeAI } = await import("@google/generative-ai");
    const genai = new GoogleGenerativeAI(apiKey);
    const model = genai.getGenerativeModel({ model: "gemini-1.5-flash" });

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
  } catch (err) {
    console.error("[gemini] OCR failed, falling back to mock:", err);
    return mockResponse(fileName);
  }
}
