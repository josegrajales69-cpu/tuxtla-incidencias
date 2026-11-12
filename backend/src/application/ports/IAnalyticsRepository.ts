export interface AnalyticsRange {
  from?: string;
  to?: string;
}

export interface AnalyticsSummary {
  totalReports: number;
  resolvedReports: number;
  resolutionRatePct: number;
  avgResolutionHours: number | null;
}

export interface CountByLabel {
  label: string;
  name: string;
  count: number;
  pct: number;
  color?: string;
}

export interface TimePoint {
  period: string;
  count: number;
}

export interface HotZone {
  lat: number;
  lng: number;
  count: number;
  zone?: string;
}

export interface DashboardAnalyticsResponse {
  summary: AnalyticsSummary;
  byStatus: CountByLabel[];
  byCategory: CountByLabel[];
  timeline: TimePoint[];
  hotZones: HotZone[];
}

export interface IAnalyticsRepository {
  getSummaryMetrics(range?: AnalyticsRange, granularity?: 'day' | 'week' | 'month'): Promise<DashboardAnalyticsResponse>;
}
