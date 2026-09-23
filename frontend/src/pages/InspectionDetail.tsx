import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  CheckCircle2,
  Circle,
  Clock,
  Loader2,
  ScanBarcode,
  ScanText,
  AlertTriangle,
  RefreshCw,
  ClipboardList,
  FileText,
  Download,
  ShieldAlert,
  ShieldCheck,
  Eye,
} from "lucide-react";
import {
  analyzeInspection,
  fetchInspection,
  downloadReportFile,
  reviewFindingApi,
} from "../lib/inspectionsApi";
import { assetUrl, extractErrorMessage } from "../lib/api";
import { Inspection, ExtractedDeclarations } from "../types/inspection";
import { Product } from "../types/product";

const STATUS_LABEL: Record<string, string> = {
  PENDING_ANALYSIS: "Pending Analysis",
  ANALYZING: "Analyzing",
  OCR_COMPLETE: "OCR Complete",
  DECLARATIONS_EXTRACTED: "Declarations Extracted",
  REVIEW_REQUIRED: "Review Required",
  COMPLIANT: "Compliant",
  NON_COMPLIANT: "Non-Compliant",
};

export default function InspectionDetail() {
  const { id } = useParams<{ id: string }>();
  const [inspection, setInspection] = useState<Inspection | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const [downloadingReport, setDownloadingReport] = useState(false);
  const [reviewingIndex, setReviewingIndex] = useState<number | null>(null);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewAction, setReviewAction] = useState<"confirm" | "reject" | "mark-for-review">("confirm");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const autoTriggered = useRef(false);

  async function handleReviewSubmit(findingIdOrIndex: string | number) {
    if (!inspection) return;
    setReviewSubmitting(true);
    try {
      const res = await reviewFindingApi(
        inspection._id,
        findingIdOrIndex,
        reviewAction,
        reviewComment
      );
      setInspection(res.inspection);
      setReviewingIndex(null);
      setReviewComment("");
    } catch (err) {
      alert(extractErrorMessage(err));
    } finally {
      setReviewSubmitting(false);
    }
  }

  const runAnalysis = useCallback(async () => {
    if (!id) return;
    setAnalyzing(true);
    setAnalyzeError(null);
    try {
      const updated = await analyzeInspection(id);
      setInspection(updated);
    } catch (err) {
      setAnalyzeError(extractErrorMessage(err, "Analysis failed. The AI service may be unavailable."));
      const refreshed = await fetchInspection(id).catch(() => null);
      if (refreshed) setInspection(refreshed);
    } finally {
      setAnalyzing(false);
    }
  }, [id]);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetchInspection(id)
      .then((data) => {
        setInspection(data);
        if (data.status === "PENDING_ANALYSIS" && !data.analysisError && !autoTriggered.current) {
          autoTriggered.current = true;
          runAnalysis();
        }
      })
      .catch((err) => setError(extractErrorMessage(err, "Could not load this inspection.")))
      .finally(() => setLoading(false));
  }, [id, runAnalysis]);

  const handleDownload = async (inline: boolean) => {
    if (!inspection) return;
    setDownloadingReport(true);
    try {
      await downloadReportFile(inspection._id, inspection.inspectionCode, inline);
    } catch (err) {
      alert(extractErrorMessage(err, "Failed to download PDF report."));
    } finally {
      setDownloadingReport(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-sm text-slate-500">Loading inspection…</div>;
  }

  if (error || !inspection) {
    return <div className="p-8 text-sm text-critical">{error ?? "Inspection not found."}</div>;
  }

  const product = typeof inspection.product === "object" ? (inspection.product as Product) : null;
  const ocrDone = inspection.ocrResults.length > 0;
  const declarationsDone = Boolean(inspection.extractedDeclarations);
  const readabilityDone = Boolean(inspection.readabilityResults);
  const rulesDone =
    inspection.status === "COMPLIANT" ||
    inspection.status === "NON_COMPLIANT" ||
    inspection.status === "REVIEW_REQUIRED";
  const ocrRunning = analyzing || inspection.status === "ANALYZING";
  const ocrFailed = Boolean(inspection.analysisError) && !ocrRunning && !ocrDone;

  return (
    <div className="mx-auto max-w-3xl p-8">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-navy-800">{inspection.inspectionCode}</h1>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
            <Clock className="h-3.5 w-3.5" />
            Started {new Date(inspection.createdAt).toLocaleString()}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              inspection.status === "COMPLIANT"
                ? "bg-emerald-100 text-emerald-800"
                : inspection.status === "NON_COMPLIANT"
                  ? "bg-rose-100 text-rose-800"
                  : inspection.status === "REVIEW_REQUIRED"
                    ? "bg-amber-100 text-amber-800"
                    : "bg-navy-100 text-navy-700"
            }`}
          >
            {STATUS_LABEL[inspection.status] ?? inspection.status}
          </span>

          {rulesDone && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleDownload(false)}
                disabled={downloadingReport}
                className="flex items-center gap-1.5 rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-teal-700 disabled:opacity-50"
                title="Download Evidence-Backed PDF Report"
              >
                {downloadingReport ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Download className="h-3.5 w-3.5" />
                )}
                Download Report
              </button>
              <button
                onClick={() => handleDownload(true)}
                disabled={downloadingReport}
                className="flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                title="Open PDF Preview in New Tab"
              >
                <Eye className="h-3.5 w-3.5 text-slate-500" />
                Preview
              </button>
            </div>
          )}
        </div>
      </div>

      {product ? (
        <div className="mb-6 flex items-start gap-3 rounded-lg border border-teal-200 bg-teal-50 p-4">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-teal-600" />
          <div>
            <p className="text-sm font-medium text-teal-900">{product.productName}</p>
            <p className="text-xs text-teal-700">
              {product.brand ? `${product.brand} · ` : ""}
              {product.barcode ? `Barcode ${product.barcode}` : "No barcode"}
            </p>
          </div>
        </div>
      ) : inspection.barcodeScanned ? (
        <div className="mb-6 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <ScanBarcode className="h-4 w-4 shrink-0" />
          Barcode {inspection.barcodeScanned} scanned — no matching product in the repository.
          Continuing as an image-based inspection.
        </div>
      ) : null}

      <div className="mb-6">
        <p className="mb-2 text-sm font-medium text-navy-800">Package images</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {inspection.images.map((imgPath) => (
            <img
              key={imgPath}
              src={assetUrl(imgPath)}
              alt="Package"
              className="h-40 w-full rounded-lg border border-slate-200 object-cover"
            />
          ))}
        </div>
      </div>

      {/* Real processing pipeline */}
      <div className="mb-6 rounded-lg border border-slate-200 bg-white p-4">
        <p className="mb-3 text-sm font-medium text-navy-800">Processing pipeline</p>
        <ul className="space-y-2 text-sm">
          <PipelineStep done label={`${inspection.images.length} image(s) uploaded`} />
          <PipelineStep
            done={ocrDone}
            running={ocrRunning}
            failed={ocrFailed}
            label="Image preprocessing + OCR (text & bounding boxes)"
          />
          <PipelineStep
            done={declarationsDone}
            running={ocrRunning && ocrDone && !declarationsDone}
            label="Declaration extraction (MRP, net quantity, dates, manufacturer…)"
          />
          <PipelineStep
            done={readabilityDone}
            running={ocrRunning && declarationsDone && !readabilityDone}
            label="Font size & readability analysis (OCR box estimates)"
          />
          <PipelineStep
            done={rulesDone}
            running={ocrRunning && readabilityDone && !rulesDone}
            label="Compliance rule validation"
          />
          <PipelineStep
            done={rulesDone}
            running={ocrRunning && rulesDone}
            label="Evidence audit trail & report generation (PDFKit)"
          />
        </ul>

        {ocrFailed && (
          <div className="mt-3 flex items-start gap-2 rounded-md bg-red-50 px-3 py-2 text-sm text-critical">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <p>{inspection.analysisError ?? analyzeError}</p>
              <button
                onClick={runAnalysis}
                disabled={analyzing}
                className="mt-2 flex items-center gap-1.5 rounded-md border border-red-300 px-2.5 py-1 text-xs font-medium text-critical hover:bg-red-100"
              >
                <RefreshCw className="h-3 w-3" />
                Retry analysis
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Compliance Findings & Audit Evidence (Phase 10 & 11) */}
      {rulesDone && (
        <div className="mb-6">
          <p className="mb-2 flex items-center gap-2 text-sm font-medium text-navy-800">
            {inspection.findings && inspection.findings.length > 0 ? (
              <ShieldAlert className="h-4 w-4 text-critical" />
            ) : (
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
            )}
            Compliance Findings & Audit Evidence ({inspection.findings?.length ?? 0})
          </p>

          {!inspection.findings || inspection.findings.length === 0 ? (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
              ✓ All checked Legal Metrology compliance rules passed without violations.
            </div>
          ) : (
            <div className="space-y-3">
              {inspection.findings.map((f, i) => (
                <div
                  key={`${f.ruleCode}-${i}`}
                  className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-navy-800">
                      {f.ruleCode}: {f.ruleName}
                    </span>
                    <span
                      className={`rounded px-2 py-0.5 text-xs font-bold ${
                        f.outcome === "NON_COMPLIANT"
                          ? "bg-rose-100 text-rose-700"
                          : f.outcome === "REVIEW_REQUIRED"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {f.outcome}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-slate-700">{f.message}</p>

                  {f.evidence && (
                    <div className="mt-3 rounded border border-slate-100 bg-slate-50 p-2.5 text-xs text-slate-600">
                      <p className="font-semibold text-slate-700">Audit Evidence:</p>
                      <div className="mt-1 grid grid-cols-1 gap-1 sm:grid-cols-2">
                        {f.evidence.location && (
                          <p>
                            <span className="text-slate-400">Location:</span> {f.evidence.location}
                          </p>
                        )}
                        {f.evidence.extractedValue && (
                          <p>
                            <span className="text-slate-400">Detected:</span> "{f.evidence.extractedValue}"
                          </p>
                        )}
                        {f.evidence.expectedValue && (
                          <p>
                            <span className="text-slate-400">Expected:</span> "{f.evidence.expectedValue}"
                          </p>
                        )}
                        {f.evidence.ocrText && (
                          <p className="col-span-full">
                            <span className="text-slate-400">OCR Text:</span> "{f.evidence.ocrText}"
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Human-in-the-Loop Review Verification (Phase 14) */}
                  <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500 font-medium">Verification Status:</span>
                      <span
                        className={`rounded px-2 py-0.5 text-xs font-semibold ${
                          f.reviewStatus === "CONFIRMED"
                            ? "bg-rose-50 text-rose-700 border border-rose-200"
                            : f.reviewStatus === "REJECTED"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200 line-through"
                              : f.reviewStatus === "MARKED_FOR_REVIEW"
                                ? "bg-amber-50 text-amber-700 border border-amber-200"
                                : "bg-slate-50 text-slate-600 border border-slate-200"
                        }`}
                      >
                        {f.reviewStatus === "CONFIRMED"
                          ? "✓ Confirmed Violation"
                          : f.reviewStatus === "REJECTED"
                            ? "✕ Dismissed / False Positive"
                            : f.reviewStatus === "MARKED_FOR_REVIEW"
                              ? "⏳ Marked for Review"
                              : "Pending Verification"}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          setReviewingIndex(i);
                          setReviewAction("confirm");
                          setReviewComment("");
                        }}
                        className="px-2 py-1 text-xs font-medium rounded border border-rose-300 text-rose-700 hover:bg-rose-50 transition"
                        title="Confirm this finding as an actual violation"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => {
                          setReviewingIndex(i);
                          setReviewAction("reject");
                          setReviewComment("");
                        }}
                        className="px-2 py-1 text-xs font-medium rounded border border-emerald-300 text-emerald-700 hover:bg-emerald-50 transition"
                        title="Reject / dismiss as false positive"
                      >
                        Reject (False Positive)
                      </button>
                      <button
                        onClick={() => {
                          setReviewingIndex(i);
                          setReviewAction("mark-for-review");
                          setReviewComment("");
                        }}
                        className="px-2 py-1 text-xs font-medium rounded border border-amber-300 text-amber-700 hover:bg-amber-50 transition"
                        title="Flag for supervisor review"
                      >
                        Mark for Review
                      </button>
                    </div>
                  </div>

                  {f.reviewComment && (
                    <p className="mt-2 text-xs italic text-slate-600 bg-slate-50 p-2 rounded border border-slate-200">
                      <span className="font-semibold not-italic text-slate-700">Review Note:</span> "{f.reviewComment}"
                    </p>
                  )}

                  {/* Inline verification input dialog */}
                  {reviewingIndex === i && (
                    <div className="mt-3 p-3 bg-blue-50/70 border border-blue-200 rounded-md">
                      <p className="text-xs font-semibold text-blue-900 mb-1.5">
                        {reviewAction === "confirm" && "Confirm Violation (Recorded in Audit Trail)"}
                        {reviewAction === "reject" && "Dismiss Violation (Recalculates Inspection Status)"}
                        {reviewAction === "mark-for-review" && "Flag for Supervisor Review"}
                      </p>
                      <input
                        type="text"
                        placeholder="Optional physical inspection comment or verification rationale..."
                        value={reviewComment}
                        onChange={(e) => setReviewComment(e.target.value)}
                        className="w-full text-xs rounded border border-slate-300 p-2 focus:ring-1 focus:ring-blue-500 bg-white"
                      />
                      <div className="mt-2 flex justify-end gap-2">
                        <button
                          onClick={() => setReviewingIndex(null)}
                          disabled={reviewSubmitting}
                          className="px-2.5 py-1 text-xs rounded border border-slate-300 text-slate-600 hover:bg-slate-100 transition"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleReviewSubmit(f._id || i)}
                          disabled={reviewSubmitting}
                          className="px-3 py-1 text-xs font-semibold rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition"
                        >
                          {reviewSubmitting ? "Saving..." : "Save Review"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}

            </div>
          )}
        </div>
      )}

      {/* Extracted Declarations */}
      {declarationsDone && inspection.extractedDeclarations && (
        <ExtractedDeclarationsPanel declarations={inspection.extractedDeclarations} product={product} />
      )}

      {/* Font Readability Assessment */}
      {readabilityDone && inspection.readabilityResults && (
        <div className="mb-6 rounded-lg border border-slate-200 bg-white p-4">
          <p className="mb-2 text-sm font-medium text-navy-800">
            Font Readability & Legibility Assessment
          </p>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-slate-600">Overall Rating:</span>
            <span
              className={`rounded px-2 py-0.5 text-xs font-semibold ${
                inspection.readabilityResults.overall === "PASS"
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-amber-100 text-amber-700"
              }`}
            >
              {inspection.readabilityResults.overall}
            </span>
          </div>
          <div className="mt-2 space-y-1 text-xs text-slate-500">
            {inspection.readabilityResults.assessments.map((a, i) => (
              <p key={i}>
                • <strong className="text-slate-700">{a.field}:</strong> {a.classification} (rel. height:{" "}
                {(a.relativeHeight * 100).toFixed(1)}%, conf: {(a.ocrConfidence * 100).toFixed(0)}%) —{" "}
                {a.message}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* OCR Results Raw View */}
      {ocrDone && inspection.ocrResults.length > 0 && (
        <div className="mb-6">
          <p className="mb-2 flex items-center gap-2 text-sm font-medium text-navy-800">
            <ScanText className="h-4 w-4" />
            OCR results
          </p>
          <div className="space-y-3">
            {inspection.ocrResults.map((result, i) => (
              <div key={result.imagePath} className="rounded-lg border border-slate-200 p-4">
                <p className="mb-2 text-xs text-slate-400">
                  Image {i + 1} · {result.engine} · {result.blocks.length} text block(s) ·{" "}
                  {result.processingTimeMs}ms
                </p>
                <pre className="whitespace-pre-wrap font-sans text-sm text-slate-700">
                  {result.fullText || "No text detected on this image."}
                </pre>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Report Quick Action Banner */}
      {rulesDone && (
        <div className="mb-6 flex items-center justify-between rounded-lg border border-teal-200 bg-teal-50 p-4">
          <div className="flex items-center gap-3">
            <FileText className="h-6 w-6 text-teal-700" />
            <div>
              <p className="text-sm font-semibold text-teal-900">Official Inspection Report Ready</p>
              <p className="text-xs text-teal-700">
                PDF report generated with complete evidence audit trail and Legal Metrology rule citations.
              </p>
            </div>
          </div>
          <button
            onClick={() => handleDownload(false)}
            disabled={downloadingReport}
            className="flex items-center gap-1.5 rounded-lg bg-teal-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow hover:bg-teal-700 disabled:opacity-50"
          >
            {downloadingReport ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
            Download PDF
          </button>
        </div>
      )}

      <Link to="/dashboard" className="mt-6 inline-block text-sm font-medium text-teal-700 hover:underline">
        Back to dashboard
      </Link>
    </div>
  );
}

function ExtractedDeclarationsPanel({
  declarations,
  product,
}: {
  declarations: ExtractedDeclarations;
  product: Product | null;
}) {
  const rows: { label: string; value: string | null; crossCheck?: "match" | "mismatch" | null }[] = [
    {
      label: "MRP",
      value: declarations.mrp ? `₹${declarations.mrp.value} (from "${declarations.mrp.raw}")` : null,
      crossCheck:
        declarations.mrp && product?.mrp !== undefined
          ? declarations.mrp.value === product.mrp
            ? "match"
            : "mismatch"
          : null,
    },
    {
      label: "Net Quantity",
      value: declarations.netQuantity
        ? `${declarations.netQuantity.value} ${declarations.netQuantity.unit} (from "${declarations.netQuantity.raw}")`
        : null,
      crossCheck:
        declarations.netQuantity && product?.netQuantity !== undefined && product?.unit
          ? declarations.netQuantity.value === product.netQuantity &&
            declarations.netQuantity.unit === product.unit
            ? "match"
            : "mismatch"
          : null,
    },
    { label: "Manufacturing Date", value: declarations.manufacturingDate?.raw ?? null },
    { label: "Packing Date", value: declarations.packingDate?.raw ?? null },
    { label: "Best Before / Expiry", value: declarations.bestBeforeOrExpiry?.raw ?? null },
    { label: "Country of Origin", value: declarations.countryOfOrigin ?? null },
    { label: "Manufacturer", value: declarations.manufacturer ?? null },
    { label: "Consumer Care", value: declarations.consumerCare ?? null },
    { label: "Batch Number", value: declarations.batchNumber ?? null },
  ];

  const anyFound = rows.some((r) => r.value);

  return (
    <div className="mb-6">
      <p className="mb-2 flex items-center gap-2 text-sm font-medium text-navy-800">
        <ClipboardList className="h-4 w-4" />
        Extracted declarations
      </p>
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        {!anyFound && (
          <p className="p-4 text-sm text-slate-400">
            No recognizable declarations were found in the OCR text.
          </p>
        )}
        {anyFound && (
          <table className="w-full text-left text-sm">
            <tbody className="divide-y divide-slate-100">
              {rows
                .filter((r) => r.value)
                .map((row) => (
                  <tr key={row.label}>
                    <td className="w-1/3 px-4 py-2.5 text-xs font-medium uppercase tracking-wide text-slate-400">
                      {row.label}
                    </td>
                    <td className="px-4 py-2.5 text-slate-700">
                      <div className="flex items-center gap-2">
                        <span>{row.value}</span>
                        {row.crossCheck === "match" && (
                          <span className="flex items-center gap-1 rounded-full bg-teal-50 px-2 py-0.5 text-xs text-teal-700">
                            <CheckCircle2 className="h-3 w-3" /> matches repository
                          </span>
                        )}
                        {row.crossCheck === "mismatch" && (
                          <span className="flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs text-amber-700">
                            <AlertTriangle className="h-3 w-3" /> differs from repository
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function PipelineStep({
  label,
  done,
  running,
  failed,
}: {
  label: string;
  done?: boolean;
  running?: boolean;
  failed?: boolean;
}) {
  return (
    <li className={`flex items-center gap-2 ${done ? "text-slate-700" : "text-slate-400"}`}>
      {done ? (
        <CheckCircle2 className="h-4 w-4 shrink-0 text-teal-600" />
      ) : running ? (
        <Loader2 className="h-4 w-4 shrink-0 animate-spin text-navy-500" />
      ) : failed ? (
        <AlertTriangle className="h-4 w-4 shrink-0 text-critical" />
      ) : (
        <Circle className="h-4 w-4 shrink-0" />
      )}
      {label}
      {running && <span className="text-xs text-navy-500">running…</span>}
      {failed && <span className="text-xs text-critical">failed</span>}
    </li>
  );
}
