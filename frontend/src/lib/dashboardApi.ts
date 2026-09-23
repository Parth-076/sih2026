import { api } from "./api";
import { Inspection } from "../types/inspection";

export interface DashboardTotals {
  total: number;
  compliant: number;
  nonCompliant: number;
  reviewRequired: number;
  pending: number;
  complianceRate: number;
}

export interface DashboardTrendPoint {
  date: string;
  label: string;
  total: number;
  compliant: number;
  nonCompliant: number;
  reviewRequired: number;
}

export interface ViolationCategoryStat {
  field: string;
  ruleCode: string;
  ruleName: string;
  totalCount: number;
  nonCompliantCount: number;
  reviewRequiredCount: number;
}

export interface CategoryBreakdownStat {
  category: string;
  total: number;
  compliant: number;
  nonCompliant: number;
  reviewRequired: number;
  complianceRate: number;
}

export interface DashboardStats {
  totals: DashboardTotals;
  trend: DashboardTrendPoint[];
  topViolations: ViolationCategoryStat[];
  categoryBreakdown: CategoryBreakdownStat[];
  recentInspections: Inspection[];
}

export async function fetchDashboardStats(): Promise<DashboardStats> {
  const res = await api.get<{ success: boolean; stats: DashboardStats }>("/dashboard");
  return res.data.stats;
}
