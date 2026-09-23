import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  Filter,
  RotateCcw,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  FileText,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import {
  fetchInspectionsList,
  downloadReportFile,
  InspectionFilterParams,
} from "../lib/inspectionsApi";
import { extractErrorMessage } from "../lib/api";
import { Inspection } from "../types/inspection";
import { Product } from "../types/product";

const STATUS_OPTIONS = [
  { value: "", label: "All Statuses" },
  { value: "COMPLIANT", label: "Compliant" },
  { value: "NON_COMPLIANT", label: "Non-Compliant" },
  { value: "REVIEW_REQUIRED", label: "Review Required" },
  { value: "PENDING_ANALYSIS", label: "Pending Analysis" },
  { value: "ANALYZING", label: "Analyzing" },
];

const SEVERITY_OPTIONS = [
  { value: "", label: "All Severities" },
  { value: "NON_COMPLIANT", label: "Non-Compliant Findings" },
  { value: "REVIEW_REQUIRED", label: "Review Required Findings" },
  { value: "WARNING", label: "Warning Findings" },
];

const COMMON_CATEGORIES = [
  { value: "", label: "All Categories" },
  { value: "Snacks", label: "Snacks & Savouries" },
  { value: "Dairy", label: "Dairy & Milk Products" },
  { value: "Beverages", label: "Beverages" },
  { value: "Bakery", label: "Bakery & Biscuits" },
  { value: "Personal Care", label: "Personal Care" },
  { value: "Edible Oil", label: "Edible Oils" },
];

export default function History() {
  const { user } = useAuth();
  const isPrivileged = user?.role === "OFFICER" || user?.role === "ADMIN";

  // Filter state
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [severity, setSeverity] = useState("");
  const [category, setCategory] = useState("");
  const [inspector, setInspector] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(1);

  // Data state
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: InspectionFilterParams = {
        page,
        limit: 15,
        search: search.trim() || undefined,
        status: status || undefined,
        severity: severity || undefined,
        category: category || undefined,
        inspector: isPrivileged && inspector.trim() ? inspector.trim() : undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      };

      const res = await fetchInspectionsList(params);
      setInspections(res.inspections);
      setPagination(res.pagination);
    } catch (err) {
      setError(extractErrorMessage(err, "Failed to load inspection history."));
    } finally {
      setLoading(false);
    }
  }, [page, search, status, severity, category, inspector, startDate, endDate, isPrivileged]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleResetFilters = () => {
    setSearch("");
    setStatus("");
    setSeverity("");
    setCategory("");
    setInspector("");
    setStartDate("");
    setEndDate("");
    setPage(1);
  };

  const handleDownload = async (inspection: Inspection, inline: boolean) => {
    setDownloadingId(inspection._id);
    try {
      await downloadReportFile(inspection._id, inspection.inspectionCode, inline);
    } catch (err) {
      alert(extractErrorMessage(err, "Failed to download PDF report."));
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="mx-auto max-w-7xl p-8">
      {/* Title & Stats Header */}
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy-800">Inspection History</h1>
          <p className="text-sm text-slate-500">
            {isPrivileged
              ? "Search and filter all repository inspections across officers and categories"
              : "Review and access reports for all your completed and pending inspections"}
          </p>
        </div>
        <span className="self-start rounded-lg bg-navy-50 px-3 py-1.5 text-xs font-semibold text-navy-700">
          Total: {pagination.total} Record{pagination.total === 1 ? "" : "s"}
        </span>
      </div>

      {/* Filter Toolbar */}
      <div className="mb-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold text-navy-800">
            <Filter className="h-4 w-4 text-teal-600" />
            Filters & Search
          </div>
          <button
            onClick={handleResetFilters}
            className="flex items-center gap-1 text-xs font-medium text-slate-500 transition hover:text-navy-800"
          >
            <RotateCcw className="h-3 w-3" />
            Reset all
          </button>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {/* Keyword Search */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search code, product, barcode…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-xs text-slate-700 placeholder-slate-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-700 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Severity Filter */}
          <div>
            <select
              value={severity}
              onChange={(e) => {
                setSeverity(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-700 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
            >
              {SEVERITY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-700 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
            >
              {COMMON_CATEGORIES.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Inspector search (Officers / Admins only) */}
          {isPrivileged && (
            <div>
              <input
                type="text"
                placeholder="Filter by inspector name/email…"
                value={inspector}
                onChange={(e) => {
                  setInspector(e.target.value);
                  setPage(1);
                }}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-700 placeholder-slate-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>
          )}

          {/* Date range from */}
          <div className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5 shrink-0 text-slate-400" />
            <input
              type="date"
              title="From date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-xs text-slate-700 focus:border-teal-500 focus:outline-none"
            />
          </div>

          {/* Date range to */}
          <div className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5 shrink-0 text-slate-400" />
            <input
              type="date"
              title="To date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-xs text-slate-700 focus:border-teal-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Results Table */}
      {error && (
        <div className="mb-6 flex items-center gap-2 rounded-lg bg-red-50 p-4 text-sm text-critical">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex h-64 items-center justify-center rounded-xl border border-slate-200 bg-white">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Loader2 className="h-5 w-5 animate-spin text-teal-600" />
            Loading inspection records…
          </div>
        </div>
      ) : inspections.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <FileText className="h-10 w-10 text-slate-300" />
          <p className="mt-3 text-sm font-semibold text-navy-800">No inspections found</p>
          <p className="mt-1 text-xs text-slate-500">
            Try adjusting your search query, status filters, or date range.
          </p>
          <button
            onClick={handleResetFilters}
            className="mt-4 rounded-lg bg-teal-600 px-4 py-2 text-xs font-medium text-white hover:bg-teal-700"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50 font-semibold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-3.5">Inspection Code</th>
                <th className="px-4 py-3.5">Date</th>
                <th className="px-4 py-3.5">Product / Barcode</th>
                <th className="px-4 py-3.5">Category</th>
                {isPrivileged && <th className="px-4 py-3.5">Inspector</th>}
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5">Findings</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {inspections.map((insp) => {
                const prod =
                  insp.product && typeof insp.product === "object"
                    ? (insp.product as Product)
                    : null;
                const findingsCount = insp.findings?.length ?? 0;
                const hasNonCompliant = insp.findings?.some((f) => f.outcome === "NON_COMPLIANT");
                const hasReview = insp.findings?.some((f) => f.outcome === "REVIEW_REQUIRED");

                return (
                  <tr key={insp._id} className="transition hover:bg-slate-50">
                    {/* Code */}
                    <td className="px-5 py-3 font-semibold text-navy-800">
                      <Link
                        to={`/inspections/${insp._id}`}
                        className="text-teal-700 hover:underline"
                      >
                        {insp.inspectionCode}
                      </Link>
                    </td>

                    {/* Date */}
                    <td className="whitespace-nowrap px-4 py-3 text-slate-500">
                      {new Date(insp.createdAt).toLocaleDateString()}{" "}
                      <span className="text-[11px] text-slate-400">
                        {new Date(insp.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </td>

                    {/* Product */}
                    <td className="px-4 py-3">
                      {prod ? (
                        <div>
                          <p className="font-medium text-navy-800">{prod.productName}</p>
                          <p className="text-[11px] text-slate-400">
                            {prod.brand ? `${prod.brand} · ` : ""}
                            {prod.barcode || "No barcode"}
                          </p>
                        </div>
                      ) : insp.barcodeScanned ? (
                        <span className="text-slate-500">Barcode {insp.barcodeScanned}</span>
                      ) : (
                        <span className="italic text-slate-400">Unlinked image</span>
                      )}
                    </td>

                    {/* Category */}
                    <td className="px-4 py-3 text-slate-600">{prod?.productCategory || "—"}</td>

                    {/* Inspector (Officers / Admins) */}
                    {isPrivileged && (
                      <td className="px-4 py-3 text-slate-600">
                        {typeof insp.inspector === "object" && insp.inspector !== null
                          ? (insp.inspector as { name: string }).name
                          : "Inspector"}
                      </td>
                    )}

                    {/* Status Badge */}
                    <td className="whitespace-nowrap px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                          insp.status === "COMPLIANT"
                            ? "bg-emerald-100 text-emerald-800"
                            : insp.status === "NON_COMPLIANT"
                              ? "bg-rose-100 text-rose-800"
                              : insp.status === "REVIEW_REQUIRED"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {insp.status === "COMPLIANT" ? (
                          <CheckCircle2 className="h-3 w-3" />
                        ) : insp.status === "NON_COMPLIANT" ? (
                          <AlertCircle className="h-3 w-3" />
                        ) : insp.status === "REVIEW_REQUIRED" ? (
                          <AlertTriangle className="h-3 w-3" />
                        ) : null}
                        {insp.status.replace(/_/g, " ")}
                      </span>
                    </td>

                    {/* Findings */}
                    <td className="whitespace-nowrap px-4 py-3">
                      {findingsCount === 0 ? (
                        <span className="text-emerald-700">0 violations</span>
                      ) : (
                        <span
                          className={`font-medium ${
                            hasNonCompliant
                              ? "text-rose-600"
                              : hasReview
                                ? "text-amber-600"
                                : "text-slate-600"
                          }`}
                        >
                          {findingsCount} finding{findingsCount === 1 ? "" : "s"}
                        </span>
                      )}
                    </td>

                    {/* Action buttons */}
                    <td className="whitespace-nowrap px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          to={`/inspections/${insp._id}`}
                          className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-navy-800"
                          title="View inspection details"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => handleDownload(insp, false)}
                          disabled={downloadingId === insp._id}
                          className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-teal-700 disabled:opacity-50"
                          title="Download PDF report"
                        >
                          {downloadingId === insp._id ? (
                            <Loader2 className="h-4 w-4 animate-spin text-teal-600" />
                          ) : (
                            <Download className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Pagination Controls */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-200 px-5 py-3 text-xs text-slate-500">
              <div>
                Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
                {pagination.total} records
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={pagination.page <= 1}
                  className="rounded border border-slate-200 p-1.5 text-slate-500 hover:bg-slate-50 disabled:opacity-40"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="px-2 font-medium">
                  Page {pagination.page} of {pagination.pages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
                  disabled={pagination.page >= pagination.pages}
                  className="rounded border border-slate-200 p-1.5 text-slate-500 hover:bg-slate-50 disabled:opacity-40"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
