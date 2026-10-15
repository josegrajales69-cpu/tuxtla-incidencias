import { Pool } from 'pg';
import { 
  IAnalyticsRepository, 
  AnalyticsRange, 
  DashboardAnalyticsResponse,
  CountByLabel,
  TimePoint,
  HotZone 
} from '../../../application/ports/IAnalyticsRepository';

const CATEGORY_META: Record<string, { name: string; color: string }> = {
  BACHE: { name: 'Bache', color: '#f97316' },
  LUMINARIA: { name: 'Alumbrado público', color: '#eab308' },
  BASURA: { name: 'Basura', color: '#22c55e' },
  ARBOL_CAIDO: { name: 'Árbol caído', color: '#10b981' },
  FUGA_AGUA: { name: 'Fuga de agua', color: '#06b6d4' },
  DRENAJE: { name: 'Drenaje', color: '#3b82f6' },
  SEMAFORO: { name: 'Semáforo', color: '#ef4444' },
};

const STATUS_META: Record<string, { name: string; color: string }> = {
  RECIBIDO: { name: 'Recibido', color: '#3b82f6' },
  EN_REVISION: { name: 'En revisión', color: '#a855f7' },
  EN_ATENCION: { name: 'En atención', color: '#f59e0b' },
  RESUELTO: { name: 'Resuelto', color: '#22c55e' },
};

export class PostgresAnalyticsRepository implements IAnalyticsRepository {
  constructor(private readonly db: Pool) {}

  async getSummaryMetrics(range?: AnalyticsRange, granularity: 'day' | 'week' | 'month' = 'day'): Promise<DashboardAnalyticsResponse> {
    const conds: string[] = [];
    const params: any[] = [];

    if (range?.from) {
      params.push(range.from);
      conds.push(`r.created_at >= $${params.length}`);
    }
    if (range?.to) {
      params.push(range.to);
      conds.push(`r.created_at <= $${params.length}`);
    }

    const whereClause = conds.length ? `WHERE ${conds.join(' AND ')}` : '';

    // 1. Resumen general
    const summaryQuery = `
      SELECT 
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE r.status = 'RESUELTO')::int AS resolved,
        ROUND(AVG(EXTRACT(EPOCH FROM (r.updated_at - r.created_at)) / 3600)
              FILTER (WHERE r.status = 'RESUELTO')::numeric, 1) AS avg_hours
      FROM reports r
      ${whereClause};
    `;

    // 2. Por estatus
    const statusQuery = `
      SELECT 
        r.status::text AS label, 
        COUNT(*)::int AS count,
        ROUND(100.0 * COUNT(*) / NULLIF(SUM(COUNT(*)) OVER (), 0), 1) AS pct
      FROM reports r
      ${whereClause}
      GROUP BY r.status
      ORDER BY count DESC;
    `;

    // 3. Por categoría
    const categoryQuery = `
      SELECT 
        r.category::text AS label, 
        COUNT(*)::int AS count,
        ROUND(100.0 * COUNT(*) / NULLIF(SUM(COUNT(*)) OVER (), 0), 1) AS pct
      FROM reports r
      ${whereClause}
      GROUP BY r.category
      ORDER BY count DESC;
    `;

    // 4. Línea de tiempo
    const validUnit = ['day', 'week', 'month'].includes(granularity) ? granularity : 'day';
    const timelineQuery = `
      SELECT 
        to_char(DATE_TRUNC('${validUnit}', r.created_at), 'YYYY-MM-DD') AS period, 
        COUNT(*)::int AS count
      FROM reports r
      ${whereClause}
      GROUP BY 1
      ORDER BY 1;
    `;

    // 5. Zonas calientes usando PostGIS ST_SnapToGrid
    const hotZonesQuery = `
      SELECT 
        ST_Y(ST_Centroid(ST_Collect(r.location))) AS lat,
        ST_X(ST_Centroid(ST_Collect(r.location))) AS lng,
        COUNT(*)::int AS count,
        MAX(r.address) as zone
      FROM reports r
      ${whereClause}
      GROUP BY ST_SnapToGrid(r.location, 0.002)
      ORDER BY count DESC
      LIMIT 6;
    `;

    const [summaryRes, statusRes, catRes, timelineRes, hotZonesRes] = await Promise.all([
      this.db.query(summaryQuery, params),
      this.db.query(statusQuery, params),
      this.db.query(categoryQuery, params),
      this.db.query(timelineQuery, params),
      this.db.query(hotZonesQuery, params),
    ]);

    const s = summaryRes.rows[0] || { total: 0, resolved: 0, avg_hours: null };
    const totalReports = s.total || 0;
    const resolvedReports = s.resolved || 0;
    const resolutionRatePct = totalReports ? Math.round((resolvedReports / totalReports) * 1000) / 10 : 0;
    const avgResolutionHours = s.avg_hours !== null ? parseFloat(s.avg_hours) : null;

    const byStatus: CountByLabel[] = statusRes.rows.map((r) => ({
      label: r.label,
      name: STATUS_META[r.label]?.name || r.label,
      color: STATUS_META[r.label]?.color || '#94a3b8',
      count: r.count,
      pct: parseFloat(r.pct),
    }));

    const byCategory: CountByLabel[] = catRes.rows.map((r) => ({
      label: r.label,
      name: CATEGORY_META[r.label]?.name || r.label,
      color: CATEGORY_META[r.label]?.color || '#3b82f6',
      count: r.count,
      pct: parseFloat(r.pct),
    }));

    const timeline: TimePoint[] = timelineRes.rows.map((r) => ({
      period: r.period,
      count: r.count,
    }));

    const hotZones: HotZone[] = hotZonesRes.rows.map((r) => ({
      lat: parseFloat(r.lat),
      lng: parseFloat(r.lng),
      count: r.count,
      zone: r.zone || 'Tuxtla Centro',
    }));

    return {
      summary: {
        totalReports,
        resolvedReports,
        resolutionRatePct,
        avgResolutionHours,
      },
      byStatus,
      byCategory,
      timeline,
      hotZones,
    };
  }
}
