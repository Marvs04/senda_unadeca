import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { errorHandler } from './shared/middleware/errorHandler.mjs';
import authRouter from './features/auth/auth.routes.mjs';
import usersRouter from './features/users/users.routes.mjs';
import departmentsRouter from './features/departments/departments.routes.mjs';
import workLogsRouter from './features/workLogs/workLogs.routes.mjs';
import ratesRouter from './features/rates/rates.routes.mjs';
import reportsRouter from './features/reports/reports.routes.mjs';
import kioskRouter from './features/kiosk/kiosk.routes.mjs';
import accountingRouter from './features/accounting/accounting.routes.mjs';

dotenv.config();

const { CORS_ORIGIN = 'http://localhost:3000' } = process.env;

const app = express();
app.use(cors({ origin: CORS_ORIGIN }));
app.use(express.json());

app.get('/health', (_req, res) => res.json({ ok: true }));

app.use('/api/v1/auth', authRouter);
app.use('/api/v1/users', usersRouter);
app.use('/api/v1/departments', departmentsRouter);
app.use('/api/v1/work-logs', workLogsRouter);
app.use('/api/v1/rate', ratesRouter);
app.use('/api/v1/reports', reportsRouter);
app.use('/api/v1/kiosk', kioskRouter);
app.use('/api/v1/accounting', accountingRouter);

app.use(errorHandler);

export default app;
