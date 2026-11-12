export type ReportCategory =
  | 'BACHE'
  | 'LUMINARIA'
  | 'BASURA'
  | 'ARBOL_CAIDO'
  | 'FUGA_AGUA'
  | 'DRENAJE'
  | 'SEMAFORO';

export type ReportStatus = 'RECIBIDO' | 'EN_REVISION' | 'EN_ATENCION' | 'RESUELTO';
export type UserRole = 'CIUDADANO' | 'BRIGADISTA' | 'ADMIN';

export interface UserSession {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  token?: string;
  username?:string;
  mustChangePassword?:boolean;
}

export interface ReportItem {
  id: string;
  folio?: string;
  title: string;
  description: string;
  category: ReportCategory;
  status: ReportStatus;
  lat: number;
  lng: number;
  address?: string;
  photoUrl?: string;
  resolutionPhotoUrl?:string;
  resolutionNotes?:string;
  resolvedBy?:string;
  resolvedByName?:string;
  resolvedAt?:string;
  situation?: string;
  situationLabel?: string;
  priority?: 'ALTA'|'MEDIA'|'BAJA'|'POR_CONFIRMAR';
  priorityReason?: string;
  citizenId?: string;
  assignedTo?: string;
  assignedBrigadeName?: string;
  upvotesCount?: number;
  hasUpvoted?: boolean;
  createdAt: string;
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

export interface DashboardData {
  summary: AnalyticsSummary;
  byStatus: CountByLabel[];
  byCategory: CountByLabel[];
  timeline: TimePoint[];
  hotZones: HotZone[];
}

export interface SituationOption {id:string;label:string;priority?:NonNullable<ReportItem['priority']>;reason?:string;}
