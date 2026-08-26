"use client";

import type { DocumentVerification, DocumentExtraction } from "@/lib/types";
import { CheckCircle2, XCircle, AlertTriangle, MinusCircle, QrCode, Shield, ExternalLink } from "lucide-react";

interface Props {
  extraction: DocumentExtraction | null;
  verification: DocumentVerification | null;
  fileUrl: string | null;
  fileName: string;
}

type RowStatus = "ok" | "warn" | "fail" | "na";

function Row({
  label,
  value,
  status,
}: {
  label: string;
  value: string;
  status: RowStatus;
}) {
  const icon =
    status === "ok" ? (
      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
    ) : status === "warn" ? (
      <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
    ) : status === "fail" ? (
      <XCircle className="h-4 w-4 text-red-500 shrink-0" />
    ) : (
      <MinusCircle className="h-4 w-4 text-slate-400 shrink-0" />
    );

  return (
    <div className="flex items-start gap-2 text-sm">
      {icon}
      <span className="text-slate-600 min-w-[170px] shrink-0">{label}</span>
      <span className="text-slate-800 font-medium break-all">{value}</span>
    </div>
  );
}

const OVERALL_META: Record<
  string,
  { label: string; color: string; bg: string }
> = {
  verified: {
    label: "VERIFIED",
    color: "text-emerald-700",
    bg: "bg-emerald-50 ring-emerald-200",
  },
  needs_review: {
    label: "NEEDS OFFICER REVIEW",
    color: "text-amber-700",
    bg: "bg-amber-50 ring-amber-200",
  },
  flagged: {
    label: "FLAGGED — MANUAL REVIEW",
    color: "text-red-700",
    bg: "bg-red-50 ring-red-200",
  },
  pending: {
    label: "VERIFICATION PENDING",
    color: "text-slate-600",
    bg: "bg-slate-50 ring-slate-200",
  },
};

const RISK_META: Record<string, { label: string; status: RowStatus }> = {
  low: { label: "LOW — No obvious anomalies detected", status: "ok" },
  medium: { label: "MEDIUM — Some inconsistencies noted", status: "warn" },
  high: { label: "HIGH — Potential tampering detected", status: "fail" },
};

const QR_META: Record<string, { label: string; status: RowStatus }> = {
  match: { label: "Detected — data matches OCR fields", status: "ok" },
  mismatch: { label: "Detected — data DOES NOT match OCR fields", status: "fail" },
  no_qr: { label: "Not found in document", status: "na" },
};

const OFFICIAL_META: Record<string, { label: string; status: RowStatus }> = {
  verified: { label: "Confirmed in official registry", status: "ok" },
  unverified: { label: "Not found in official registry", status: "fail" },
  na: { label: "No public API available for this document type", status: "na" },
};

export function VerificationResult({ extraction, verification, fileUrl, fileName }: Props) {
  const overall = verification?.overall_status ?? "pending";
  const meta = OVERALL_META[overall] ?? OVERALL_META.pending;

  return (
    <div className="mt-3 rounded-xl bg-white ring-1 ring-slate-100 p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Document Verification
        </span>
        {fileUrl && (
          <a
            href={fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-brand-600 hover:underline"
          >
            View file <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>

      {/* OCR Extraction */}
      <div className="space-y-1.5">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">OCR Extraction</p>
        {extraction ? (
          <>
            <Row label="OCR completed" value="Yes" status="ok" />
            <Row
              label="Licence / registration no."
              value={extraction.licence_number ?? "Not found"}
              status={extraction.licence_number ? "ok" : "warn"}
            />
            <Row
              label="Company name"
              value={extraction.company_name ?? "Not extracted"}
              status={extraction.company_name ? "ok" : "na"}
            />
            <Row
              label="Valid until"
              value={extraction.valid_until ?? "Not found"}
              status={
                extraction.valid_until
                  ? new Date(extraction.valid_until) > new Date()
                    ? "ok"
                    : "fail"
                  : "na"
              }
            />
          </>
        ) : (
          <Row label="OCR status" value="Extraction in progress…" status="na" />
        )}
      </div>

      {/* QR Verification */}
      {verification && (
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1">
            <QrCode className="h-3.5 w-3.5" /> QR Code
          </p>
          <Row
            label="QR code"
            value={QR_META[verification.qr_status ?? "no_qr"]?.label ?? "Unknown"}
            status={QR_META[verification.qr_status ?? "no_qr"]?.status ?? "na"}
          />
        </div>
      )}

      {/* Official */}
      {verification && (
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            Official Registry
          </p>
          <Row
            label="Official check"
            value={OFFICIAL_META[verification.official_status ?? "na"]?.label ?? "N/A"}
            status={OFFICIAL_META[verification.official_status ?? "na"]?.status ?? "na"}
          />
        </div>
      )}

      {/* AI Risk */}
      {verification && (
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1">
            <Shield className="h-3.5 w-3.5" /> AI Tamper Analysis
          </p>
          {verification.ai_reasoning?.startsWith("Gemini") || verification.ai_reasoning?.startsWith("GOOGLE_AI") || verification.ai_reasoning?.includes("failed") ? (
            <div className="rounded-lg bg-red-50 px-3 py-2 ring-1 ring-red-200 text-xs text-red-700">
              <strong>⚠️ AI Analysis Failed:</strong> {verification.ai_reasoning}
            </div>
          ) : (
            <>
              <Row
                label="Risk level"
                value={RISK_META[verification.ai_risk ?? "low"]?.label ?? "N/A"}
                status={RISK_META[verification.ai_risk ?? "low"]?.status ?? "na"}
              />
              {verification.ai_reasoning && (
                <p className="text-xs text-slate-500 ml-6 italic">
                  {verification.ai_reasoning}
                </p>
              )}
              <p className="text-xs text-slate-400 ml-6">
                ℹ️ &ldquo;No obvious tampering detected&rdquo; ≠ guaranteed genuine. Final decision by officer.
              </p>
            </>
          )}
        </div>
      )}

      {/* Overall verdict */}
      {verification && (
        <div
          className={`rounded-lg px-4 py-3 ring-1 ${meta.bg} flex items-center justify-between`}
        >
          <span className={`text-sm font-bold ${meta.color}`}>
            Automated Status: {meta.label}
          </span>
        </div>
      )}
    </div>
  );
}
