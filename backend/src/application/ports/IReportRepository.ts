import { Report, ReportCategory, ReportStatus } from '../../domain/entities/Report';

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  existingId?: string;
  distanceMeters?: number;
}

export interface UpvoteResult {
  upvotesCount: number;
  hasUpvoted: boolean;
}

export interface IReportRepository {
  create(report: Report): Promise<Report>;
  findAll(filters?: { category?: ReportCategory; status?: string }): Promise<Report[]>;
  findById(id: string): Promise<Report | null>;
  updateStatus(id: string, status: ReportStatus): Promise<Report | null>;
  assignBrigade(id: string, brigadeId: string | null): Promise<Report | null>;
  delete(id: string): Promise<boolean>;
  checkDuplicate(category: ReportCategory, lat: number, lng: number, radiusMeters?: number): Promise<DuplicateCheckResult>;
  toggleUpvote(reportId: string, userId?: string, fingerprint?: string): Promise<UpvoteResult>;
  getUserUpvotes(userId?: string, fingerprint?: string): Promise<string[]>;
}

