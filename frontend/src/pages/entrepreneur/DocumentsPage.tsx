import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { businessService } from '../../services/businessService';
import { documentService } from '../../services/documentService';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Badge } from '../../components/ui/Badge';
import {
  FileText, Upload, Sparkles, CheckCircle2, AlertTriangle, XCircle,
  Trash2, Calendar, ShieldCheck, RefreshCw, Layers, ArrowRight, Building2
} from 'lucide-react';
import { formatDate } from '../../lib/utils';
import { toast } from 'sonner';
import type { Business, Document, Project } from '../../types';

const FOOD_DOC_TYPES = [
  'FSSAI Food Safety Management System (FSMS) Plan & Flowchart',
  'Potable Water Test Report as per IS 10500 (NABL Lab)',
  'Food Recall Plan & HACCP / ISO 22000 Manual',
  'Approved Food Safety Supervisor Bio-data & Qualifications',
  'MPCB Organic Effluent ETP & Bio-Methanation Scheme',
  'Detailed Project Report (DPR) - Food & Cold Chain Engineering',
  'DISH Approved Factory Building Architectural Blueprints (Rule 3-A)',
  'Provisional Fire Safety NOC & Evacuation Plan (MFES)',
  'MSEDCL Connected Load Estimation & Cold Storage Calculations',
  'Audited Financials & CA Net Worth Certificate',
  'Udyam MSME Registration Certificate',
  'MIDC Mega Food Park Plot Allotment & Lease Deed',
  'Company PAN Card & GSTIN Registration',
];

const TEXTILE_DOC_TYPES = [
  'Zero Liquid Discharge (ZLD) ETP Scheme with RO & MEE Evaporator',
  'Cotton Dust & Byssinosis Ventilation Extraction Plan (Sec 15/16)',
  'MFES Automatic Sprinkler & Fire Hydrant Blueprint (High-Combustible NBC IV)',
  'Textile Machinery Layout & Loom/Spindle Capacity Declaration',
  'Textile Process Flowchart & Chemical Mass Balance (Azo Dyes Compliance)',
  'Detailed Project Report (DPR) - Textile Machinery & Loom Breakup',
  'Maharashtra Integrated Textile Policy 2023-28 Subsidy Application Form',
  'Structural Stability Certificate (Form 1A)',
  'MSEDCL Single Line Diagram (SLD) & HT Spinning Load Calculations',
  'Audited Financials & CA Net Worth Certificate',
  'Udyam MSME Registration Certificate',
  'MIDC Textile Park Plot Allotment & Lease Deed',
  'Company PAN Card & GSTIN Registration',
];

export default function DocumentsPage() {
  const [business, setBusiness] = useState<Business | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [analysis, setAnalysis] = useState<any>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [validationDetail, setValidationDetail] = useState<any>(null);
  const [validatingId, setValidatingId] = useState<string | null>(null);

  // Upload Form States
  const [file, setFile] = useState<File | null>(null);
  const [docType, setDocType] = useState<string>('');
  const [expiryDate, setExpiryDate] = useState('');
  const [uploading, setUploading] = useState(false);

  const isFood = (business?.sector || project?.sector) === 'food_processing';
  const isTextile = (business?.sector || project?.sector) === 'textile';
  const availableDocTypes = isTextile ? TEXTILE_DOC_TYPES : FOOD_DOC_TYPES;

  useEffect(() => {
    loadVault();
  }, []);

  async function loadVault() {
    try {
      const biz = await businessService.getMyBusiness();
      setBusiness(biz);
      if (biz) {
        const [docs, projs] = await Promise.all([
          documentService.getVault(biz.id),
          businessService.getProjects(biz.id),
        ]);
        setDocuments(docs);
        if (projs.length > 0) {
          setProject(projs[0]);
          try {
            const res = await api.get(`/api/approvals/checklist/${projs[0].id}`);
            setAnalysis(res.data.analysis || res.data);
          } catch (e) {
            console.error('Checklist fetch err', e);
          }
        }
      }
    } catch (err: any) {
      toast.error('Failed to load Document Vault');
    } finally {
      setLoading(false);
    }
  }

  // Pre-fill initial docType
  useEffect(() => {
    if (!docType && availableDocTypes.length > 0) {
      setDocType(availableDocTypes[0]);
    }
  }, [isTextile, isFood]);

  const handleOpenUploadFor = (targetDocType?: string) => {
    if (targetDocType) {
      setDocType(targetDocType);
    } else {
      setDocType(availableDocTypes[0]);
    }
    setShowUploadModal(true);
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !business) {
      toast.error('Please select a file to upload');
      return;
    }

    setUploading(true);
    try {
      const newDoc = await documentService.uploadDocument(
        business.id,
        file,
        docType,
        expiryDate || undefined
      );
      toast.success('Document uploaded to Vault! Triggering Gemini AI pre-validation...');
      setShowUploadModal(false);
      setFile(null);
      setExpiryDate('');
      
      // Reload vault & auto trigger AI validation
      await loadVault();
      if (newDoc?.id) {
        handleValidateAI(newDoc.id);
      }
    } catch (err: any) {
      toast.error(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleValidateAI = async (docId: string) => {
    setValidatingId(docId);
    try {
      const res = await documentService.validateDocument(docId);
      toast.success('Gemini AI document verification completed');
      await loadVault();
      if (selectedDoc?.id === docId) {
        const val = await documentService.getValidation(docId);
        setValidationDetail(val);
      }
    } catch (err: any) {
      toast.error('AI validation error: ' + err.message);
    } finally {
      setValidatingId(null);
    }
  };

  const handleViewValidation = async (doc: Document) => {
    setSelectedDoc(doc);
    try {
      const val = await documentService.getValidation(doc.id);
      setValidationDetail(val);
    } catch (err) {
      setValidationDetail(null);
    }
  };

  const handleDelete = async (docId: string) => {
    if (!confirm('Are you sure you want to remove this document from the vault?')) return;
    try {
      await documentService.deleteDocument(docId);
      toast.success('Document removed');
      if (selectedDoc?.id === docId) setSelectedDoc(null);
      await loadVault();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-800" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Document Locker (Upload Once, Reuse Everywhere)"
        subtitle="Your uploaded certificates and blueprints automatically attach to Labour, Pollution, Fire, and Power applications without re-uploading"
        actions={
          <Button onClick={() => setShowUploadModal(true)} className="font-bold shadow-xs">
            <Upload className="w-4 h-4 mr-1.5" /> Upload New Document
          </Button>
        }
      />

      {/* Vault Info banner */}
      <div className="bg-gradient-to-r from-emerald-50 to-blue-50 border border-emerald-200/80 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
            <ShieldCheck className="w-5 h-5 text-emerald-700" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-bold text-[#002046]">Single-Upload Document Locker is Active</p>
              <span className="text-[10px] font-extrabold px-2 py-0.5 bg-blue-100 text-blue-900 border border-blue-200 rounded-full uppercase">
                {isTextile ? '🧵 Textile & Garment Sector' : '🥗 Food Processing Sector'}
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-0.5">
              {documents.filter(d => d.is_verified || d.validation_status === 'valid').length} of {documents.length} documents verified by Gemini AI. Uploaded files automatically attach to {isTextile ? 'Textile Directorate, MPCB, Fire, and DISH' : 'FSSAI, MPCB, Fire, and DISH'} applications.
            </p>
          </div>
        </div>
      </div>

      {/* Dynamic Sector Required Documents Checklist */}
      <Card className="border-blue-200 bg-gradient-to-r from-blue-50/60 via-indigo-50/30 to-white shadow-2xs">
        <CardHeader className="pb-3 border-b border-blue-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-blue-700" />
            <div>
              <CardTitle className="text-sm font-extrabold text-[#002046]">
                Statutory Document Checklist for {isTextile ? 'Textile & Garment Manufacturing' : 'Food Processing & Agro-Based Industries'}
              </CardTitle>
              <p className="text-xs text-slate-500">
                Department clearances require the following documents. Click any item to upload directly.
              </p>
            </div>
          </div>
          <span className="text-[11px] font-bold text-blue-800 bg-blue-100 px-2.5 py-1 rounded-lg">
            {documents.length} of {availableDocTypes.length} Available in Locker
          </span>
        </CardHeader>

        <CardContent className="p-4 space-y-2.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {availableDocTypes.map((reqDoc, idx) => {
              const uploadedDoc = documents.find(d => d.doc_type === reqDoc || d.doc_type?.toLowerCase().includes(reqDoc.toLowerCase().split(' ')[0]));
              const isUploaded = Boolean(uploadedDoc);
              const isValid = uploadedDoc?.validation_status === 'valid' || uploadedDoc?.is_verified;

              return (
                <div
                  key={idx}
                  onClick={() => !isUploaded && handleOpenUploadFor(reqDoc)}
                  className={`p-3 rounded-xl border transition-all text-xs flex flex-col justify-between gap-2 ${
                    isUploaded
                      ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950'
                      : 'bg-white border-slate-200 hover:border-blue-400 hover:shadow-xs cursor-pointer text-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-bold leading-tight">{reqDoc}</span>
                    {isUploaded ? (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 flex-shrink-0 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" /> In Vault
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 flex-shrink-0">
                        + Upload
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-100">
                    <span className="truncate">
                      {isUploaded && uploadedDoc ? `Uploaded: ${formatDate(uploadedDoc.created_at)}` : 'Click to add to Locker'}
                    </span>
                    {!isUploaded && <ArrowRight className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Grid of Uploaded Documents */}
      {documents.length === 0 ? (
        <Card className="text-center py-16 rounded-2xl border-slate-200 shadow-2xs">
          <CardContent className="space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
              <FileText className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-[#002046]">Your Document Locker is Empty</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
              Upload your company PAN, GST registration, factory layout blueprints, and land papers once. BizClear automatically attaches them to your Factory Licence, Pollution CTE, and Fire NOC applications.
            </p>
            <div className="pt-2">
              <Button onClick={() => setShowUploadModal(true)}>
                <Upload className="w-4 h-4 mr-1" /> Upload First Document
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {documents.map((doc) => (
            <Card
              key={doc.id}
              className={`transition-all cursor-pointer hover:shadow-md ${
                selectedDoc?.id === doc.id ? 'ring-2 ring-primary-600' : ''
              }`}
              onClick={() => handleViewValidation(doc)}
            >
              <CardHeader className="pb-3 flex flex-row items-start justify-between">
                <div className="flex items-start gap-2.5 truncate mr-2">
                  <div className="p-2 rounded bg-primary-50 text-primary-800 flex-shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="truncate">
                    <CardTitle className="text-sm truncate">{doc.doc_type}</CardTitle>
                    <p className="text-xs text-muted-foreground truncate">{doc.file_name}</p>
                  </div>
                </div>
                <StatusBadge status={doc.validation_status} />
              </CardHeader>
              <CardContent className="space-y-3 pt-0">
                <div className="text-xs space-y-1 text-muted-foreground border-t border-border pt-2.5">
                  <div className="flex justify-between">
                    <span>Uploaded:</span>
                    <span className="font-medium text-foreground">{formatDate(doc.created_at)}</span>
                  </div>
                  {doc.expiry_date && (
                    <div className="flex justify-between">
                      <span>Expires:</span>
                      <span className="font-medium text-foreground">{formatDate(doc.expiry_date)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Multi-App Reuse:</span>
                    <span className="text-green-700 font-semibold">Enabled</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-border">
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs h-7 gap-1"
                    loading={validatingId === doc.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleValidateAI(doc.id);
                    }}
                  >
                    <Sparkles className="w-3 h-3 text-indigo-600" />
                    AI Pre-Check
                  </Button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(doc.id);
                    }}
                    className="text-muted-foreground hover:text-red-600 p-1 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Selected Document AI Validation Details Drawer/Card */}
      {selectedDoc && (
        <Card className="border-indigo-200 bg-indigo-50/20">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-600" />
              <CardTitle className="text-base">Gemini AI Scrutiny Report: {selectedDoc.doc_type}</CardTitle>
            </div>
            <StatusBadge status={selectedDoc.validation_status} />
          </CardHeader>
          <CardContent className="space-y-4">
            {validationDetail ? (
              <div className="space-y-3 bg-white p-4 rounded-lg border border-indigo-100 text-sm">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground">AI Validation Status:</p>
                  <p className="font-bold text-foreground capitalize mt-0.5">{validationDetail.overall_status || validationDetail.ai_risk || 'Verified'}</p>
                </div>

                <div>
                  <p className="text-xs font-semibold text-muted-foreground">Pre-Screening Findings:</p>
                  <p className="text-foreground mt-0.5">{validationDetail.ai_reasoning || 'Document parsed successfully with standard validity checks passed.'}</p>
                </div>

                {validationDetail.qr_extracted && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground">Extracted Authority Metadata:</p>
                    <pre className="text-xs bg-slate-50 p-2 rounded mt-1 overflow-x-auto">
                      {JSON.stringify(validationDetail.qr_extracted, null, 2)}
                    </pre>
                  </div>
                )}

                <div className="p-2.5 bg-amber-50 border border-amber-200 rounded text-xs text-amber-900 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 text-amber-700 mt-0.5" />
                  <span>
                    <strong>Statutory Disclaimer:</strong> AI pre-validation assists in preventing application rejections due to obvious discrepancies. Official statutory scrutiny is executed by designated department officers.
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-white rounded border text-center text-sm text-muted-foreground">
                <p>No automated report generated yet.</p>
                <Button
                  size="sm"
                  className="mt-2"
                  onClick={() => handleValidateAI(selectedDoc.id)}
                  loading={validatingId === selectedDoc.id}
                >
                  <Sparkles className="w-3.5 h-3.5 mr-1" /> Run Gemini AI Validation
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-lg">Upload to Document Vault</h3>
              <button onClick={() => setShowUploadModal(false)} className="text-muted-foreground hover:text-foreground">✕</button>
            </div>

            <form onSubmit={handleUpload} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Document Classification</label>
                <select
                  value={docType}
                  onChange={(e) => setDocType(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded text-sm bg-white font-medium"
                >
                  {availableDocTypes.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">File (PDF, PNG, JPG)</label>
                <input
                  type="file"
                  required
                  accept=".pdf,.png,.jpg,.jpeg"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="w-full text-sm border border-border p-2 rounded"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Expiry Date (if applicable)</label>
                <input
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded text-sm bg-white"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t">
                <Button type="button" variant="outline" onClick={() => setShowUploadModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" loading={uploading}>
                  Upload & Validate
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
