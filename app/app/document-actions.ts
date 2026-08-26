"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUser } from "@/lib/auth";
import { runVerificationPipeline } from "@/lib/verify/pipeline";
import type { DocumentWithVerification } from "@/lib/types";
import { redirect } from "next/navigation";

// ─── Constants ──────────────────────────────────────────────────────────────

const MAX_BYTES =
  Number(process.env.NEXT_PUBLIC_MAX_UPLOAD_MB ?? "5") * 1024 * 1024;

const ALLOWED_MIME = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
];

// ─── Upload + verify ─────────────────────────────────────────────────────────

/**
 * Upload a document for a specific application_approval, then immediately
 * run the OCR → QR → AI → official verification pipeline.
 *
 * Called from the document-upload client component via a FormData action.
 */
export async function uploadAndVerifyDocument(
  formData: FormData,
): Promise<{ ok: boolean; error?: string; documentId?: string }> {
  const user = await getUser();
  if (!user) redirect("/login");

  const file = formData.get("file") as File | null;
  const approvalId = formData.get("approvalId") as string | null;
  const docType = formData.get("docType") as string | null;
  const businessId = formData.get("businessId") as string | null;

  if (!file || !approvalId || !docType || !businessId) {
    return { ok: false, error: "Missing required fields." };
  }
  if (!ALLOWED_MIME.includes(file.type)) {
    return {
      ok: false,
      error: `Unsupported file type: ${file.type}. Upload a JPEG, PNG, WEBP, or PDF.`,
    };
  }
  if (file.size > MAX_BYTES) {
    return {
      ok: false,
      error: `File too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Max ${MAX_BYTES / 1024 / 1024} MB.`,
    };
  }

  const supabase = createClient();
  const admin = createAdminClient();

  // 1. Upload to Supabase Storage
  const ext = file.name.split(".").pop() ?? "bin";
  const storagePath = `documents/${businessId}/${approvalId}/${Date.now()}.${ext}`;
  const arrayBuffer = await file.arrayBuffer();
  const fileBytes = Buffer.from(arrayBuffer);

  const { error: storageErr } = await supabase.storage
    .from("documents")
    .upload(storagePath, fileBytes, {
      contentType: file.type,
      upsert: true,
    });

  if (storageErr) {
    console.error("[upload] storage error:", storageErr);
    return { ok: false, error: "Storage upload failed: " + storageErr.message };
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("documents").getPublicUrl(storagePath);

  // 2. Insert documents row
  const { data: docRow, error: docErr } = await admin
    .from("documents")
    .insert({
      business_id: businessId,
      application_approval_id: approvalId,
      doc_type: docType,
      file_name: file.name,
      file_url: publicUrl,
      validation_status: "pending",
    })
    .select("id")
    .single();

  if (docErr || !docRow) {
    return { ok: false, error: "Failed to save document record." };
  }

  // 3. Run verification pipeline (OCR → QR → official → AI)
  //    Fire-and-forget is fine here; status updates are persisted to DB.
  //    We await it so the UI can show a result immediately.
  try {
    const pipeline = await runVerificationPipeline(
      fileBytes,
      file.type,
      file.name,
      docType,
    );

    // 4. Persist extraction
    await admin.from("document_extractions").insert({
      document_id: docRow.id,
      licence_number: pipeline.licence_number,
      company_name: pipeline.company_name,
      valid_from: pipeline.valid_from,
      valid_until: pipeline.valid_until,
      raw_text: pipeline.raw_text,
    });

    // 5. Persist verification result
    await admin.from("document_verifications").insert({
      document_id: docRow.id,
      qr_status: pipeline.qr_status,
      qr_extracted: pipeline.qr_extracted,
      ai_risk: pipeline.ai_risk,
      ai_reasoning: pipeline.ai_reasoning,
      official_status: pipeline.official_status,
      overall_status: pipeline.overall_status,
    });

    // 6. Update document validation_status
    const validationStatus =
      pipeline.overall_status === "verified"
        ? "valid"
        : pipeline.overall_status === "flagged"
          ? "invalid"
          : "pending";

    await admin
      .from("documents")
      .update({ validation_status: validationStatus })
      .eq("id", docRow.id);
  } catch (err) {
    console.error("[upload] verification pipeline failed:", err);
    // Don't fail the upload; document is stored, verification can be re-run.
  }

  revalidatePath("/app");
  return { ok: true, documentId: docRow.id };
}

// ─── Get documents for an approval ──────────────────────────────────────────

/**
 * Fetch all documents (with their verification chain) for a given
 * application_approval_id. Used by the dashboard and officer console.
 */
export async function getDocumentsForApproval(
  approvalId: string,
): Promise<DocumentWithVerification[]> {
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("documents")
    .select(
      `id, business_id, application_approval_id, doc_type, file_name, file_url,
       validation_status, expiry_date,
       extraction:document_extractions( id, document_id, licence_number, company_name, valid_from, valid_until, raw_text, created_at ),
       verification:document_verifications( id, document_id, qr_status, qr_extracted, ai_risk, ai_reasoning, official_status, overall_status, created_at )`,
    )
    .eq("application_approval_id", approvalId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[getDocuments]", error);
    return [];
  }

  return (data ?? []).map((row: any) => ({
    ...row,
    extraction: Array.isArray(row.extraction)
      ? row.extraction[0] ?? null
      : row.extraction ?? null,
    verification: Array.isArray(row.verification)
      ? row.verification[0] ?? null
      : row.verification ?? null,
  }));
}
