import { Report, ReportProps } from '../../domain/entities/Report';
import { IReportRepository } from '../ports/IReportRepository';
import { IWebhookService } from '../ports/IWebhookService';

export class CreateReportUseCase {
  constructor(
    private readonly reportRepo: IReportRepository,
    private readonly webhookService: IWebhookService
  ) {}

  async execute(dto: ReportProps): Promise<{ report: Report; duplicateWarning?: string }> {
    // 1. Validar duplicados a 30 metros usando función PostGIS
    const duplicateCheck = await this.reportRepo.checkDuplicate(dto.category, dto.lat, dto.lng, 30.0);
    
    let duplicateWarning: string | undefined;
    if (duplicateCheck.isDuplicate && duplicateCheck.existingId) {
      duplicateWarning = `Atención: Existe un reporte de ${dto.category} a ${Math.round(duplicateCheck.distanceMeters || 0)}m. Se registró como correlacionado.`;
    }

    // 2. Construir entidad de dominio y persistir
    const entity = new Report(dto);
    const created = await this.reportRepo.create(entity);

    // 3. Despachar webhook a n8n desacoplado (en segundo plano, no bloqueante)
    this.webhookService.emitReportCreated(created).catch((err) => {
      console.warn(`[WebhookService] Fallo envío a webhook/n8n (esperado en modo desacoplado): ${err.message}`);
    });

    return { report: created, duplicateWarning };
  }
}
