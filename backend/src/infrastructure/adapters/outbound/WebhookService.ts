import { IWebhookService } from '../../../application/ports/IWebhookService';
import { Report } from '../../../domain/entities/Report';

export class WebhookService implements IWebhookService {
  private readonly webhookUrl: string | undefined;

  constructor() {
    this.webhookUrl = process.env.WEBHOOK_URL;
  }

  async emitReportCreated(report: Report): Promise<void> {
    if (!this.webhookUrl) {
      return;
    }

    const payload = {
      event: 'REPORT_CREATED',
      timestamp: new Date().toISOString(),
      data: {
        id: report.id,
        title: report.title,
        description: report.description,
        category: report.category,
        status: report.status,
        coordinates: {
          latitude: report.lat,
          longitude: report.lng,
        },
        address: report.address,
        photoUrl: report.photoUrl,
        createdAt: report.createdAt,
      },
    };

    // Usando fetch nativo de Node.js
    await fetch(this.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  }
}
