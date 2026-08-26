"use client";

import { useState, useTransition, useRef } from "react";
import { Upload, Loader2, CheckCircle2, FileText, X } from "lucide-react";
import { uploadAndVerifyDocument } from "@/app/app/document-actions";
import { VerificationResult } from "@/components/verification-result";
import type { DocumentWithVerification } from "@/lib/types";

interface Props {
  approvalId: string;
  approvalName: string;
  businessId: string;
  requiredDocuments: string[];
  existingDocuments: DocumentWithVerification[];
}

export function DocumentUpload({
  approvalId,
  approvalName,
  businessId,
  requiredDocuments,
  existingDocuments,
}: Props) {
  const [docs, setDocs] = useState<DocumentWithVerification[]>(existingDocuments);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [selectedDocType, setSelectedDocType] = useState(
    requiredDocuments[0] ?? "document",
  );
  const [pending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setError(null);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("approvalId", approvalId);
    fd.append("docType", selectedDocType);
    fd.append("businessId", businessId);

    startTransition(async () => {
      const result = await uploadAndVerifyDocument(fd);
      if (!result.ok) {
        setError(result.error ?? "Upload failed.");
        return;
      }
      // Optimistically show the uploaded document with pending status
      const optimistic: DocumentWithVerification = {
        id: result.documentId ?? Date.now().toString(),
        business_id: businessId,
        application_approval_id: approvalId,
        doc_type: selectedDocType,
        file_name: file.name,
        file_url: null,
        validation_status: "pending",
        expiry_date: null,
        extraction: null,
        verification: null,
      };
      setDocs((prev) => [optimistic, ...prev]);
      // Reload page to get full verification data from server
      window.location.reload();
    });
  }

  function onFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  const hasDoc = docs.length > 0;
  const latestDoc = docs[0];

  return (
    <div className="mt-3 space-y-3">
      {/* Document type selector (if multiple required docs) */}
      {requiredDocuments.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {requiredDocuments.map((doc) => (
            <button
              key={doc}
              onClick={() => setSelectedDocType(doc)}
              className={`rounded-full px-3 py-1 text-xs font-medium ring-1 transition-colors ${
                selectedDocType === doc
                  ? "bg-brand-600 text-white ring-brand-600"
                  : "bg-white text-slate-600 ring-slate-200 hover:ring-brand-300"
              }`}
            >
              {doc}
            </button>
          ))}
        </div>
      )}

      {/* Upload zone */}
      {!hasDoc && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          className={`cursor-pointer rounded-xl border-2 border-dashed p-6 text-center transition-colors ${
            dragging
              ? "border-brand-400 bg-brand-50"
              : "border-slate-200 bg-slate-50 hover:border-brand-300 hover:bg-brand-50/50"
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            className="hidden"
            onChange={onFileInput}
          />
          {pending ? (
            <div className="flex flex-col items-center gap-2 text-brand-600">
              <Loader2 className="h-8 w-8 animate-spin" />
              <p className="text-sm font-medium">Uploading & verifying…</p>
              <p className="text-xs text-slate-500">
                Running OCR · QR check · AI analysis
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 text-slate-500">
              <Upload className="h-7 w-7 text-slate-400" />
              <p className="text-sm font-medium text-slate-700">
                Upload {selectedDocType}
              </p>
              <p className="text-xs">Drag & drop or click — JPEG, PNG, PDF up to 5 MB</p>
            </div>
          )}
        </div>
      )}

      {/* Uploaded document + verification result */}
      {hasDoc && (
        <div>
          <div className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2 ring-1 ring-slate-100">
            <div className="flex items-center gap-2 min-w-0">
              <FileText className="h-4 w-4 shrink-0 text-slate-400" />
              <span className="text-sm text-slate-700 truncate">
                {latestDoc.file_name}
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${
                  latestDoc.validation_status === "valid"
                    ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                    : latestDoc.validation_status === "invalid"
                      ? "bg-red-50 text-red-700 ring-red-200"
                      : "bg-slate-100 text-slate-600 ring-slate-200"
                }`}
              >
                {latestDoc.validation_status}
              </span>
              {/* Allow re-upload */}
              <button
                onClick={() => {
                  setDocs([]);
                  setError(null);
                }}
                className="text-slate-400 hover:text-slate-600"
                title="Remove and re-upload"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <VerificationResult
            extraction={latestDoc.extraction}
            verification={latestDoc.verification}
            fileUrl={latestDoc.file_url}
            fileName={latestDoc.file_name}
          />
        </div>
      )}

      {error && (
        <p className="text-xs text-red-600 flex items-center gap-1">
          <X className="h-3.5 w-3.5" /> {error}
        </p>
      )}
    </div>
  );
}
