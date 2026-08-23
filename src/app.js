import express from 'express';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { healthRouter } from './routes/health.routes.js';
import { authRouter } from './routes/auth.route.js';
import { organizationRouter } from './routes/organization.route.js';
import { projectRouter } from './routes/project.route.js';
import { taskRouter } from './routes/task.route.js';
import { dashboardRouter } from './routes/dashboard.route.js';
import { jobRouter } from './routes/job.route.js';
import { setupSwaggerDocs } from './docs/swagger.js';
import { errorHandler } from './middleware/error.middleware.js';

const app = express();

app.use(morgan("dev"));
app.use(express.json());
app.use(cookieParser());

// OpenAPI Swagger UI documentation
setupSwaggerDocs(app);

app.use('/health', healthRouter);
app.use('/auth', authRouter);
app.use('/organizations', organizationRouter);
app.use('/projects', projectRouter);
app.use('/tasks', taskRouter);
app.use('/dashboard', dashboardRouter);
app.use('/jobs', jobRouter);

app.use(errorHandler);
export { app };