import { Report, ReportCategory } from '../../domain/entities/Report';
import { IReportRepository } from '../ports/IReportRepository';

export class GetReportsUseCase {
  constructor(private readonly reportRepo: IReportRepository) {}

  async execute(filters?: { category?: ReportCategory; status?: string }): Promise<Report[]> {
    return this.reportRepo.findAll(filters);
  }
}
