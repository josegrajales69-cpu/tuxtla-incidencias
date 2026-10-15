import { Request, Response } from 'express';
import { GetAnalyticsUseCase } from '../../../../application/use-cases/GetAnalyticsUseCase';

export class AnalyticsController {
  constructor(private readonly getAnalyticsUseCase: GetAnalyticsUseCase) {}

  async getMetrics(req: Request, res: Response): Promise<void> {
    try {
      const { from, to, granularity } = req.query;
      const range = (from || to) ? { from: from as string, to: to as string } : undefined;
      const metrics = await this.getAnalyticsUseCase.execute(
        range, 
        (granularity as 'day' | 'week' | 'month') || 'day'
      );
      res.json(metrics);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Error al procesar métricas' });
    }
  }
}
