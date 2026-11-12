import { Report, ReportStatus } from '../../domain/entities/Report';
import { IReportRepository } from '../ports/IReportRepository';

export class UpdateReportStatusUseCase {
  constructor(private readonly reportRepo: IReportRepository) {}

  async execute(id: string, status: ReportStatus): Promise<Report> {
    const updated = await this.reportRepo.updateStatus(id, status);
    if (!updated) {
      throw new Error(`Reporte con ID ${id} no encontrado`);
    }
    return updated;
  }
}
