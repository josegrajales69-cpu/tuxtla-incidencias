import { Router } from 'express';
import { ReportController } from '../ReportController';

export const createReportRouter = (controller: ReportController): Router => {
  const router = Router();
  router.get('/user-upvotes', (req, res) => controller.getUserUpvotes(req, res));
  router.get('/', (req, res) => controller.getAll(req, res));
  router.post('/', (req, res) => controller.create(req, res));
  router.post('/:id/upvote', (req, res) => controller.toggleUpvote(req, res));
  router.patch('/:id/status', (req, res) => controller.updateStatus(req, res));
  router.patch('/:id/assign', (req, res) => controller.assignBrigade(req, res));
  router.delete('/:id', (req, res) => controller.delete(req, res));
  return router;
};
