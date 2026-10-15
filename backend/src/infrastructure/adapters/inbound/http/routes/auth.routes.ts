import { Router } from 'express';
import { AuthController } from '../AuthController';

export const createAuthRouter = (controller: AuthController): Router => {
  const router = Router();
  router.post('/login', (req, res) => controller.login(req, res));
  router.post('/register', (req, res) => controller.register(req, res));
  router.get('/demo-users', (req, res) => controller.getDemoUsers(req, res));
  router.patch('/users/:id/role', (req, res) => controller.updateUserRole(req, res));
  return router;
};
