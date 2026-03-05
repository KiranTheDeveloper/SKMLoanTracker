"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Upload, FileText, Loader2, Sparkles, Trash2, ExternalLink,
  CheckCircle, AlertCircle, Clock, Download, ChevronDown, ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { DOC_TYPE_GROUPS, DOC_TYPE_LABELS } from "@/lib/constants";
import { formatDate } from "@/lib/utils";

interface Doc {
  id: string;
  originalName: string;
  docType: string | null;
  extractionStatus: string;
  extractedData: string | null;
  extractionError: string | null;
  filePath: string;
  fileSize: number;
  createdAt: Date;
}

interface DocumentUploaderProps {
  customerId: string;
  existingDocs: Doc[];
  applicationId?: string;
  isAdmin: boolean;
}

// Human-readable labels for extracted data fields
const FIELD_LABELS: Record<string, string> = {
  name: "Name", fatherName: "Father's Name", motherName: "Mother's Name",
  spouseName: "Spouse Name", dob: "Date of Birth", gender: "Gender",
  aadhaarNo: "Aadhaar No.", panNo: "PAN No.", passportNo: "Passport No.",
  passportExpiry: "Passport Expiry", voterIdNo: "Voter ID No.", dlNo: "DL No.",
  dlExpiry: "DL Expiry", dlVehicleClass: "Vehicle Class",
  address: "Address", city: "City", state: "State", pincode: "Pincode",
  bankName: "Bank Name", accountNo: "Account No.", accountType: "Account Type",
  ifscCode: "IFSC Code", micrCode: "MICR Code", branchName: "Branch",
  accountHolderName: "Account Holder", openingBalance: "Opening Balance", closingBalance: "Closing Balance",
  companyName: "Company / Employer", designation: "Designation", employeeId: "Employee ID",
  grossSalary: "Gross Salary (₹)", netSalary: "Net Salary (₹)", basicSalary: "Basic Salary (₹)",
  salaryMonth: "Salary Month", tdsDeducted: "TDS Deducted (₹)", pfDeducted: "PF Deducted (₹)",
  assessmentYear: "Assessment Year", grossIncome: "Gross Income (₹)",
  taxableIncome: "Taxable Income (₹)", taxPaid: "Tax Paid (₹)",
  gstNo: "GST No.", udyamNo: "Udyam No.", companyRegistrationNo: "Company Reg. No.",
  businessName: "Business Name", businessType: "Business Type", incorporationDate: "Incorporation Date",
  billMonth: "Bill Month", billAmount: "Bill Amount (₹)", consumerNo: "Consumer No.",
  serviceProviderName: "Service Provider",
  propertyAddress: "Property Address", vehicleRegNo: "Vehicle Reg. No.",
  vehicleMake: "Vehicle Make", vehicleModel: "Vehicle Model",
  chassisNo: "Chassis No.", engineNo: "Engine No.",
  loanAccountNo: "Loan Account No.", loanAmount: "Loan Amount (₹)",
  emiAmount: "EMI (₹)", outstandingBalance: "Outstanding (₹)",
};

const META_FIELDS = ["docType", "confidence", "notes"];

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function DocumentUploader({ customerId, existingDocs, applicationId, isAdmin }: DocumentUploaderProps) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [docType, setDocType] = useState("AADHAAR_FRONT");
  const [uploading, setUploading] = useState(false);
  const [extracting, setExtracting] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("customerId", customerId);
      form.append("docType", docType);
      if (applicationId) form.append("applicationId", applicationId);

      const res = await fetch("/api/documents", { method: "POST", body: form });
      if (!res.ok) throw new Error("Upload failed");
      const doc = await res.json();
      toast.success("Document uploaded — running AI extraction...");
      await triggerExtraction(doc.id);
      router.refresh();
    } catch {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function triggerExtraction(docId: string) {
    setExtracting(docId);
    try {
      const res = await fetch(`/api/documents/${docId}/extract`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        const fields = Object.keys(data.extracted || {}).filter(k => !META_FIELDS.includes(k));
        toast.success("AI extraction complete", {
          description: fields.length > 0 ? `Extracted: ${fields.map(f => FIELD_LABELS[f] || f).slice(0, 5).join(", ")}${fields.length > 5 ? ` +${fields.length - 5} more` : ""}` : "No data found",
        });
        // Auto-expand the extracted data
        setExpanded(prev => ({ ...prev, [docId]: true }));
      } else {
        const err = await res.json();
        toast.error("Extraction failed", { description: err.error });
      }
    } catch {
      toast.error("Extraction failed");
    } finally {
      setExtracting(null);
      router.refresh();
    }
  }

  async function handleDelete(docId: string) {
    if (!confirm("Delete this document?")) return;
    await fetch(`/api/documents/${docId}`, { method: "DELETE" });
    toast.success("Document deleted");
    router.refresh();
  }

  const statusIcon = (status: string) => {
    if (status === "COMPLETED") return <CheckCircle className="w-3.5 h-3.5 text-green-400" />;
    if (status === "FAILED") return <AlertCircle className="w-3.5 h-3.5 text-red-400" />;
    if (status === "PROCESSING") return <Loader2 className="w-3.5 h-3.5 text-blue-400 animate-spin" />;
    return <Clock className="w-3.5 h-3.5 text-slate-400" />;
  };

  const statusLabel = (status: string) => {
    if (status === "COMPLETED") return "Extracted";
    if (status === "FAILED") return "Failed";
    if (status === "PROCESSING") return "Processing...";
    return "Pending";
  };

  return (
    <div className="space-y-5">
      {/* Upload zone */}
      <div className="space-y-2">
        <div className="flex flex-col sm:flex-row gap-3">
          <select
            value={docType}
            onChange={(e) => setDocType(e.target.value)}
            className="h-10 rounded-md border border-slate-600 bg-slate-700 px-3 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:w-64"
          >
            {DOC_TYPE_GROUPS.map((group) => (
              <optgroup key={group.label} label={group.label}>
                {group.types.map((t) => (
                  <option key={t} value={t}>{DOC_TYPE_LABELS[t] || t}</option>
                ))}
              </optgroup>
            ))}
          </select>

          <label className="flex-1">
            <input ref={fileRef} type="file" accept="image/*,.pdf" onChange={handleUpload} className="hidden" disabled={uploading} />
            <div className={`flex items-center gap-2 h-10 px-4 rounded-md border-2 border-dashed border-slate-600 text-sm text-slate-400 cursor-pointer hover:border-blue-500 hover:text-blue-400 transition-colors ${uploading ? "opacity-50 cursor-not-allowed" : ""}`}>
              {uploading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Uploading &amp; extracting...</>
              ) : (
                <><Upload className="w-4 h-4" /> Click to upload (JPG, PNG, PDF — max 10MB)</>
              )}
            </div>
          </label>
        </div>
        <p className="text-xs text-slate-400 flex items-center gap-1.5">
          <Sparkles className="w-3 h-3 text-yellow-400 flex-shrink-0" />
          AI-powered extraction (Gemini 1.5 Flash) automatically reads Aadhaar, PAN, bank details, salary, address and more
        </p>
      </div>

      {/* Documents list */}
      {existingDocs.length === 0 ? (
        <div className="text-center py-6 border border-dashed border-slate-700 rounded-lg">
          <FileText className="w-8 h-8 text-slate-600 mx-auto mb-2" />
          <p className="text-sm text-slate-400">No documents uploaded yet</p>
          <p className="text-xs text-slate-500 mt-1">Upload Aadhaar, PAN, bank statements, salary slips, etc.</p>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">{existingDocs.length} document{existingDocs.length !== 1 ? "s" : ""} uploaded</p>
          {existingDocs.map((doc) => {
            const extracted = doc.extractedData ? JSON.parse(doc.extractedData) : null;
            const extractedFields = extracted
              ? Object.entries(extracted).filter(([k, v]) => v && !META_FIELDS.includes(k))
              : [];
            const isExpanded = expanded[doc.id] ?? (extractedFields.length > 0 && doc.extractionStatus === "COMPLETED");

            return (
              <div key={doc.id} className="border border-slate-700 rounded-lg overflow-hidden">
                {/* Doc header */}
                <div className="flex items-start justify-between gap-2 p-3">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <FileText className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-200 truncate">{doc.originalName}</p>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
                        <span className="text-xs text-blue-300 font-medium">{DOC_TYPE_LABELS[doc.docType || ""] || doc.docType || "Unknown type"}</span>
                        <span className="text-slate-600">·</span>
                        <div className="flex items-center gap-1">
                          {statusIcon(doc.extractionStatus)}
                          <span className={`text-xs ${doc.extractionStatus === "COMPLETED" ? "text-green-400" : doc.extractionStatus === "FAILED" ? "text-red-400" : "text-slate-400"}`}>
                            {statusLabel(doc.extractionStatus)}
                          </span>
                        </div>
                        <span className="text-slate-600">·</span>
                        <span className="text-xs text-slate-500">{formatFileSize(doc.fileSize)}</span>
                        <span className="text-slate-600">·</span>
                        <span className="text-xs text-slate-500">{formatDate(doc.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 flex-shrink-0">
                    {doc.extractionStatus === "FAILED" && (
                      <Button size="sm" variant="ghost" onClick={() => triggerExtraction(doc.id)} disabled={extracting === doc.id} className="h-7 px-2 text-xs text-yellow-400 hover:text-yellow-300">
                        {extracting === doc.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                        <span className="ml-1">Re-extract</span>
                      </Button>
                    )}
                    {extractedFields.length > 0 && (
                      <button
                        onClick={() => setExpanded(prev => ({ ...prev, [doc.id]: !prev[doc.id] }))}
                        className="p-1.5 text-slate-400 hover:text-white rounded"
                        title={isExpanded ? "Hide extracted data" : "Show extracted data"}
                      >
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>
                    )}
                    <a href={doc.filePath} download={doc.originalName} className="p-1.5 text-slate-400 hover:text-green-400 rounded" title="Download">
                      <Download className="w-3.5 h-3.5" />
                    </a>
                    <a href={doc.filePath} target="_blank" rel="noopener noreferrer" className="p-1.5 text-slate-400 hover:text-white rounded" title="Open in new tab">
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                    {isAdmin && (
                      <button onClick={() => handleDelete(doc.id)} className="p-1.5 text-slate-400 hover:text-red-400 rounded" title="Delete">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Extracted data */}
                {isExpanded && extractedFields.length > 0 && (
                  <div className="border-t border-slate-700/70 bg-slate-800/40 px-3 py-2.5">
                    <p className="text-xs font-medium text-yellow-400 flex items-center gap-1 mb-2">
                      <Sparkles className="w-3 h-3" /> AI Extracted Data
                      {extracted?.confidence && (
                        <span className={`ml-1 px-1.5 py-0.5 rounded text-xs ${extracted.confidence === "HIGH" ? "bg-green-900/40 text-green-400" : extracted.confidence === "MEDIUM" ? "bg-yellow-900/40 text-yellow-400" : "bg-red-900/40 text-red-400"}`}>
                          {extracted.confidence} confidence
                        </span>
                      )}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-1.5">
                      {extractedFields.map(([k, v]) => (
                        <div key={k} className="text-xs">
                          <span className="text-slate-500">{FIELD_LABELS[k] || k.replace(/([A-Z])/g, " $1").trim()}: </span>
                          <span className="text-slate-200 font-mono break-all">{String(v)}</span>
                        </div>
                      ))}
                    </div>
                    {extracted?.notes && (
                      <p className="mt-2 text-xs text-slate-400 italic">Note: {extracted.notes}</p>
                    )}
                  </div>
                )}

                {doc.extractionError && (
                  <div className="border-t border-slate-700/70 bg-red-900/10 px-3 py-2">
                    <p className="text-xs text-red-400"><AlertCircle className="w-3 h-3 inline mr-1" />{doc.extractionError}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
