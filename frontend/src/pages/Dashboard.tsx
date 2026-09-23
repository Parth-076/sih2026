import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  FileText,
  TrendingUp,
  BarChart3,
  RefreshCw,
  Loader2,
  ArrowUpRight,
  ShieldCheck,
  Package,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { useAuth } from "../context/AuthContext";
import { fetchDashboardStats, DashboardStats } from "../lib/dashboardApi";
import { extractErrorMessage } from "../lib/api";
import { Product } from "../types/product";

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadStats = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const data = await fetchDashboardStats();
      setStats(data);
    } catch (err) {
      setError(extractErrorMessage(err, "Failed to load dashboard statistics."));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const totals = stats?.totals;
  const trend = stats?.trend ?? [];
  const topViolations = stats?.topViolations ?? [];
  const categoryBreakdown = stats?.categoryBreakdown ?? [];
  const recentInspections = stats?.recentInspections ?? [];

  return (
    <div className="mx-auto max-w-7xl p-8">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-navy-900">
              Welcome, {user?.name}
            </h1>
            <span className="rounded-full bg-teal-100 px-2.5 py-0.5 text-xs font-semibold text-teal-800">
              {user?.role}
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            {user?.role === "INSPECTOR"
              ? "Your personal digital inspection activity and Legal Metrology compliance metrics"
              : "Executive Legal Metrology digital inspection dashboard and system-wide compliance intelligence"}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => loadStats(true)}
            disabled={refreshing || loading}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin text-teal-600" : ""}`} />
            Refresh
          </button>
          <Link
            to="/inspections/new"
            className="flex items-center gap-1.5 rounded-lg bg-teal-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-teal-700"
          >
            + New Inspection
          </Link>
        </div>
      </div>

      {error && (
        <div className="mb-6 flex items-center gap-2 rounded-lg bg-red-50 p-4 text-sm text-critical">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex h-72 items-center justify-center rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Loader2 className="h-5 w-5 animate-spin text-teal-600" />
            Loading live compliance analytics…
          </div>
        </div>
      ) : (
        <>
          {/* KPI Metrics Cards */}
          <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Total */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Total Inspections
                </span>
                <div className="rounded-lg bg-navy-50 p-2 text-navy-700">
                  <FileText className="h-4 w-4" />
                </div>
              </div>
              <p className="mt-3 text-3xl font-bold text-navy-900">{totals?.total ?? 0}</p>
              <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                <span>{totals?.pending ?? 0} in progress</span>
                <Link to="/history" className="text-teal-700 hover:underline">
                  View all →
                </Link>
              </div>
            </div>

            {/* Compliant */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Compliant Packages
                </span>
                <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <p className="text-3xl font-bold text-emerald-700">{totals?.compliant ?? 0}</p>
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-800">
                  {totals?.complianceRate ?? 0}% Rate
                </span>
              </div>
              <div className="mt-2 text-xs text-slate-500">Passed all checked LM rules</div>
            </div>

            {/* Non-Compliant */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Non-Compliant
                </span>
                <div className="rounded-lg bg-rose-50 p-2 text-rose-600">
                  <AlertCircle className="h-4 w-4" />
                </div>
              </div>
              <p className="mt-3 text-3xl font-bold text-rose-600">{totals?.nonCompliant ?? 0}</p>
              <div className="mt-2 text-xs text-slate-500">Mandatory rule violations detected</div>
            </div>

            {/* Review Required */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Review Required
                </span>
                <div className="rounded-lg bg-amber-50 p-2 text-amber-600">
                  <AlertTriangle className="h-4 w-4" />
                </div>
              </div>
              <p className="mt-3 text-3xl font-bold text-amber-600">
                {totals?.reviewRequired ?? 0}
              </p>
              <div className="mt-2 text-xs text-slate-500">Requires officer visual verification</div>
            </div>
          </div>

          {/* Charts Row */}
          <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* 30-Day Trend (AreaChart) */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-teal-600" />
                  <h2 className="text-sm font-bold text-navy-800">
                    Inspection Activity & Outcome Trend (Last 30 Days)
                  </h2>
                </div>
                <span className="text-xs text-slate-400">Daily Volumes</span>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorCompliant" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0D9488" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#0D9488" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="colorNonCompliant" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#E11D48" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#E11D48" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="colorReview" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#D97706" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#D97706" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 10, fill: "#64748B" }}
                      axisLine={{ stroke: "#CBD5E1" }}
                      tickLine={false}
                      interval={4}
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fontSize: 10, fill: "#64748B" }}
                      axisLine={{ stroke: "#CBD5E1" }}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#0F172A",
                        borderColor: "#1E293B",
                        borderRadius: 8,
                        fontSize: 12,
                        color: "#FFFFFF",
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
                    <Area
                      type="monotone"
                      dataKey="compliant"
                      name="Compliant"
                      stroke="#0D9488"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorCompliant)"
                    />
                    <Area
                      type="monotone"
                      dataKey="nonCompliant"
                      name="Non-Compliant"
                      stroke="#E11D48"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorNonCompliant)"
                    />
                    <Area
                      type="monotone"
                      dataKey="reviewRequired"
                      name="Review Required"
                      stroke="#D97706"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorReview)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Top Violations (BarChart) */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-rose-600" />
                  <h2 className="text-sm font-bold text-navy-800">Top Rule Violations</h2>
                </div>
                <span className="text-xs text-slate-400">By Frequency</span>
              </div>

              {topViolations.length === 0 ? (
                <div className="flex h-64 flex-col items-center justify-center text-center text-xs text-slate-400">
                  <ShieldCheck className="mb-2 h-8 w-8 text-emerald-500" />
                  No compliance violations recorded yet.
                </div>
              ) : (
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={topViolations}
                      layout="vertical"
                      margin={{ top: 0, right: 10, left: 10, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                      <XAxis type="number" allowDecimals={false} tick={{ fontSize: 10, fill: "#64748B" }} />
                      <YAxis
                        type="category"
                        dataKey="field"
                        tick={{ fontSize: 11, fill: "#1E293B", fontWeight: 500 }}
                        width={70}
                      />
                      <Tooltip
                        formatter={(val: number, name: string) => [val, name]}
                        labelFormatter={(label) => `Target Field: ${label}`}
                        contentStyle={{
                          backgroundColor: "#0F172A",
                          borderRadius: 8,
                          fontSize: 11,
                          color: "#FFFFFF",
                        }}
                      />
                      <Bar dataKey="nonCompliantCount" name="Non-Compliant" fill="#E11D48" radius={[0, 4, 4, 0]} />
                      <Bar dataKey="reviewRequiredCount" name="Review Req." fill="#D97706" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>

          {/* Bottom Row: Category Breakdown & Recent Activity */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Category Breakdown */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-teal-600" />
                  <h2 className="text-sm font-bold text-navy-800">Category Compliance Breakdown</h2>
                </div>
                <span className="text-xs text-slate-400">Top Categories</span>
              </div>

              {categoryBreakdown.length === 0 ? (
                <p className="py-8 text-center text-xs text-slate-400">
                  No categorized inspections available yet.
                </p>
              ) : (
                <div className="space-y-4">
                  {categoryBreakdown.map((cat) => (
                    <div key={cat.category}>
                      <div className="mb-1 flex items-center justify-between text-xs">
                        <span className="font-semibold text-navy-800">{cat.category}</span>
                        <span className="text-slate-500">
                          {cat.compliant}/{cat.total} compliant ({cat.complianceRate}%)
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                        <div
                          className={`h-full rounded-full ${
                            cat.complianceRate >= 80
                              ? "bg-emerald-500"
                              : cat.complianceRate >= 50
                                ? "bg-amber-500"
                                : "bg-rose-500"
                          }`}
                          style={{ width: `${cat.complianceRate}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Inspections */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-navy-700" />
                  <h2 className="text-sm font-bold text-navy-800">Recent Inspections</h2>
                </div>
                <Link
                  to="/history"
                  className="flex items-center gap-0.5 text-xs font-medium text-teal-700 hover:underline"
                >
                  View full history <ArrowUpRight className="h-3 w-3" />
                </Link>
              </div>

              {recentInspections.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  No inspection activity recorded yet. Start a new inspection to populate.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {recentInspections.map((insp) => {
                    const prod =
                      insp.product && typeof insp.product === "object"
                        ? (insp.product as Product)
                        : null;

                    return (
                      <div
                        key={insp._id}
                        className="flex items-center justify-between py-3 transition hover:bg-slate-50"
                      >
                        <div>
                          <Link
                            to={`/inspections/${insp._id}`}
                            className="text-xs font-semibold text-navy-800 hover:text-teal-700 hover:underline"
                          >
                            {insp.inspectionCode}
                          </Link>
                          <p className="text-[11px] text-slate-500">
                            {prod?.productName || insp.barcodeScanned || "Unlinked image"} ·{" "}
                            {new Date(insp.createdAt).toLocaleDateString()}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                              insp.status === "COMPLIANT"
                                ? "bg-emerald-100 text-emerald-800"
                                : insp.status === "NON_COMPLIANT"
                                  ? "bg-rose-100 text-rose-800"
                                  : insp.status === "REVIEW_REQUIRED"
                                    ? "bg-amber-100 text-amber-800"
                                    : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {insp.status.replace(/_/g, " ")}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
