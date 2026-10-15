import { Router } from 'express';
import { AnalyticsController } from '../AnalyticsController';

export const createAnalyticsRouter = (controller: AnalyticsController): Router => {
  const router = Router();
  router.get('/summary', (req, res) => controller.getMetrics(req, res));
  return router;
};
