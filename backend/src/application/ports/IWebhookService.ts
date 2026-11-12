import { Report } from '../../domain/entities/Report';

export interface IWebhookService {
  emitReportCreated(report: Report): Promise<void>;
}
