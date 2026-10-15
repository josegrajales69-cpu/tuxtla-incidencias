import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { pool } from './infrastructure/config/db';
import { PostgresReportRepository } from './infrastructure/adapters/outbound/PostgresReportRepository';
import { PostgresAnalyticsRepository } from './infrastructure/adapters/outbound/PostgresAnalyticsRepository';
import { PostgresUserRepository } from './infrastructure/adapters/outbound/PostgresUserRepository';
import { WebhookService } from './infrastructure/adapters/outbound/WebhookService';
import { CreateReportUseCase } from './application/use-cases/CreateReportUseCase';
import { GetReportsUseCase } from './application/use-cases/GetReportsUseCase';
import { GetAnalyticsUseCase } from './application/use-cases/GetAnalyticsUseCase';
import { UpdateReportStatusUseCase } from './application/use-cases/UpdateReportStatusUseCase';
import { LoginUseCase } from './application/use-cases/LoginUseCase';
import { RegisterUseCase } from './application/use-cases/RegisterUseCase';
import { ReportController } from './infrastructure/adapters/inbound/http/ReportController';
import { AnalyticsController } from './infrastructure/adapters/inbound/http/AnalyticsController';
import { AuthController } from './infrastructure/adapters/inbound/http/AuthController';
import { createReportRouter } from './infrastructure/adapters/inbound/http/routes/report.routes';
import { createAnalyticsRouter } from './infrastructure/adapters/inbound/http/routes/analytics.routes';
import { createAuthRouter } from './infrastructure/adapters/inbound/http/routes/auth.routes';
import { createGeocodeRouter } from './infrastructure/adapters/inbound/http/routes/geocode.routes';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// Middlewares
app.use(cors());
app.use(express.json());

// Inyección de dependencias
const reportRepo = new PostgresReportRepository(pool);
const analyticsRepo = new PostgresAnalyticsRepository(pool);
const userRepo = new PostgresUserRepository(pool);
const webhookService = new WebhookService();

const createReportUseCase = new CreateReportUseCase(reportRepo, webhookService);
const getReportsUseCase = new GetReportsUseCase(reportRepo);
const getAnalyticsUseCase = new GetAnalyticsUseCase(analyticsRepo);
const updateReportStatusUseCase = new UpdateReportStatusUseCase(reportRepo);

const loginUseCase = new LoginUseCase(userRepo);
const registerUseCase = new RegisterUseCase(userRepo);

const reportController = new ReportController(createReportUseCase, getReportsUseCase, updateReportStatusUseCase, reportRepo);
const analyticsController = new AnalyticsController(getAnalyticsUseCase);
const authController = new AuthController(loginUseCase, registerUseCase, userRepo);

// Rutas de la API
app.use('/api/auth', createAuthRouter(authController));
app.use('/api/reports', createReportRouter(reportController));
app.use('/api/analytics', createAnalyticsRouter(analyticsController));
app.use('/api/geocode', createGeocodeRouter());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'Tuxtla Reportes GIS API', timestamp: new Date() });
});

app.listen(port, () => {
  console.log(`[Backend] Servidor Tuxtla Reportes corriendo en http://localhost:${port}`);
});
