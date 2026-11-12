import {N8nReportQuery} from './infrastructure/adapters/outbound/N8nReportQuery';
import {LocalPhotoStorage,photoDirectory} from './infrastructure/adapters/outbound/LocalPhotoStorage';
import express from 'express';
import {ResolveReportUseCase} from './application/use-cases/ResolveReportUseCase';
import {ManageAccounts} from './application/use-cases/ManageAccounts';
import {PostgresAccountRepository} from './infrastructure/adapters/outbound/PostgresAccountRepository';
import {createAccountsRouter} from './infrastructure/adapters/inbound/http/routes/accounts.routes';
import {TelegramHttpApi} from './infrastructure/adapters/outbound/TelegramApi';
import {PostgresTelegramBrigadeRepository} from './infrastructure/adapters/outbound/PostgresTelegramBrigadeRepository';
import {ClaimReportFromTelegram} from './application/use-cases/ClaimReportFromTelegram';
import {TelegramBrigadeWorker} from './infrastructure/adapters/inbound/TelegramBrigadeWorker';
import {createTelegramRouter} from './infrastructure/adapters/inbound/http/routes/telegram.routes';
import cors from 'cors';
import dotenv from 'dotenv';
import { pool } from './infrastructure/config/db';
import { PostgresReportRepository } from './infrastructure/adapters/outbound/PostgresReportRepository';
import { PostgresAnalyticsRepository } from './infrastructure/adapters/outbound/PostgresAnalyticsRepository';
import { PostgresUserRepository } from './infrastructure/adapters/outbound/PostgresUserRepository';
import { DispatchWorker } from './infrastructure/adapters/outbound/DispatchWorker';
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
if(!process.env.JWT_SECRET||process.env.JWT_SECRET.length<32)throw new Error('Configura JWT_SECRET con al menos 32 caracteres antes de iniciar.');

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use('/media/reports',express.static(photoDirectory(),{dotfiles:'deny',maxAge:'7d',immutable:true,setHeaders:res=>res.setHeader('X-Content-Type-Options','nosniff')}));

const reportRepo = new PostgresReportRepository(pool);
const analyticsRepo = new PostgresAnalyticsRepository(pool);
const userRepo = new PostgresUserRepository(pool);
const dispatchWorker = new DispatchWorker(pool);
const telegramLinks=new PostgresTelegramBrigadeRepository(pool);
const telegramWorker=process.env.TELEGRAM_RECEIVE_ENABLED==='true'&&process.env.TELEGRAM_BOT_TOKEN&&process.env.TELEGRAM_GROUP_ID
 ?new TelegramBrigadeWorker(pool,new TelegramHttpApi(process.env.TELEGRAM_BOT_TOKEN),telegramLinks,new ClaimReportFromTelegram(reportRepo,telegramLinks),process.env.TELEGRAM_GROUP_ID,process.env.N8N_QUERY_URL&&process.env.N8N_DISPATCH_SECRET?new N8nReportQuery(process.env.N8N_QUERY_URL,process.env.N8N_DISPATCH_SECRET):undefined):undefined;

const createReportUseCase = new CreateReportUseCase(reportRepo,new LocalPhotoStorage());
const getReportsUseCase = new GetReportsUseCase(reportRepo);
const getAnalyticsUseCase = new GetAnalyticsUseCase(analyticsRepo);
const updateReportStatusUseCase = new UpdateReportStatusUseCase(reportRepo);

const loginUseCase = new LoginUseCase(userRepo);
const registerUseCase = new RegisterUseCase(userRepo);

const reportController = new ReportController(createReportUseCase, getReportsUseCase, updateReportStatusUseCase, reportRepo,new ResolveReportUseCase(reportRepo,new LocalPhotoStorage()));
const analyticsController = new AnalyticsController(getAnalyticsUseCase);
const authController = new AuthController(loginUseCase, registerUseCase, userRepo);

app.use('/api/telegram',createTelegramRouter(telegramLinks,()=>telegramWorker?.active===true));
app.use('/api/accounts',createAccountsRouter(new ManageAccounts(new PostgresAccountRepository(pool))));
app.use('/api/auth', createAuthRouter(authController));
app.use('/api/reports', createReportRouter(reportController));
app.use('/api/analytics', createAnalyticsRouter(analyticsController));
app.use('/api/geocode', createGeocodeRouter());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'Tuxtla Reportes GIS API', timestamp: new Date() });
});

app.listen(port, () => {
  dispatchWorker.start();telegramWorker?.start();
  console.log(`[Backend] Servidor Tuxtla Reportes corriendo en http://localhost:${port}`);
});
