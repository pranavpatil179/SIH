/**
 * Verification pipeline orchestrator.
 *
 * Runs: OCR (Gemini) → QR decode → official check → risk synthesis
 * Returns a unified result that gets persisted into document_extractions
 * and document_verifications.
 */

import { extractWithGemini } from "./gemini";
import { decodeQr, crossCheck } from "./qr";
import { checkOfficial } from "./official";
import type { VerifyStatus, RiskLevel } from "@/lib/types";

export interface PipelineResult {
  // OCR fields
  licence_number: string | null;
  company_name: string | null;
  valid_from: string | null;
  valid_until: string | null;
  raw_text: string;

  // QR
  qr_status: "match" | "mismatch" | "no_qr";
  qr_extracted: Record<string, string> | null;

  // AI
  ai_risk: RiskLevel;
  ai_reasoning: string;

  // Official
  official_status: "verified" | "unverified" | "na";
  official_message: string;

  // Synthesized verdict
  overall_status: VerifyStatus;
}

/**
 * Synthesize an overall status from the individual check results.
 *
 * Rules (in priority order):
 *  - QR mismatch or AI risk=high → flagged
 *  - Official unverified or AI risk=medium → needs_review
 *  - Official verified and AI risk=low → verified
 *  - Everything else (no_qr, na) with low risk → verified
 */
function synthesize(
  qrStatus: "match" | "mismatch" | "no_qr",
  aiRisk: RiskLevel,
  officialStatus: "verified" | "unverified" | "na",
): VerifyStatus {
  if (qrStatus === "mismatch" || aiRisk === "high") return "flagged";
  if (officialStatus === "unverified" || aiRisk === "medium") return "needs_review";
  if (officialStatus === "verified" && aiRisk === "low") return "verified";
  // na official + low ai risk = verified (officer does final check anyway)
  return "verified";
}

/**
 * Run the full verification pipeline for a document.
 *
 * @param imageBytes  Raw bytes of the uploaded file
 * @param mimeType    MIME type (e.g. "image/jpeg", "application/pdf")
 * @param fileName    Original file name (used for mock heuristics)
 * @param docType     Document type key from approval_types.required_documents
 */
export async function runVerificationPipeline(
  imageBytes: Buffer,
  mimeType: string,
  fileName: string,
  docType: string,
): Promise<PipelineResult> {
  // Run OCR + QR in parallel
  const [ocrResult, qrResult] = await Promise.all([
    extractWithGemini(imageBytes, mimeType, fileName),
    decodeQr(imageBytes),
  ]);

  // Cross-check QR vs OCR
  const qrStatus = crossCheck(qrResult, ocrResult.licence_number);

  // Update qrResult status based on cross-check
  const finalQrResult = { ...qrResult, status: qrStatus };

  // Official verification (sequential — depends on OCR licence number)
  const official = await checkOfficial(
    docType,
    ocrResult.licence_number,
    ocrResult.company_name,
  );

  const overall = synthesize(qrStatus, ocrResult.risk_level, official.status);

  return {
    licence_number: ocrResult.licence_number,
    company_name: ocrResult.company_name,
    valid_from: ocrResult.valid_from,
    valid_until: ocrResult.valid_until,
    raw_text: ocrResult.raw_text,

    qr_status: qrStatus,
    qr_extracted: finalQrResult.extracted,

    ai_risk: ocrResult.risk_level,
    ai_reasoning: ocrResult.risk_reason,

    official_status: official.status,
    official_message: official.message,

    overall_status: overall,
  };
}
