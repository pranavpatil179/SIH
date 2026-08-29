import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { rateLimit } from 'express-rate-limit';
import dotenv from 'dotenv';
import { errorHandler } from './middleware/errorHandler';

import projectsRouter from './routes/projects';
import applicationsRouter from './routes/applications';
import documentsRouter from './routes/documents';
import queriesRouter from './routes/queries';
import inspectionsRouter from './routes/inspections';
import notificationsRouter from './routes/notifications';
import officerRouter from './routes/officer';
import schemesRouter from './routes/schemes';
import grievancesRouter from './routes/grievances';
import adminRouter from './routes/admin';
import analyticsRouter from './routes/analytics';

dotenv.config();

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});
app.use(limiter);

app.use('/projects', projectsRouter);
app.use('/applications', applicationsRouter);
app.use('/documents', documentsRouter);
app.use('/queries', queriesRouter);
app.use('/inspections', inspectionsRouter);
app.use('/notifications', notificationsRouter);
app.use('/officer', officerRouter);
app.use('/schemes', schemesRouter);
app.use('/grievances', grievancesRouter);
app.use('/admin', adminRouter);
app.use('/analytics', analyticsRouter);

app.use(errorHandler);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
