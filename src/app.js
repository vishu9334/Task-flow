import express from 'express';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { healthRouter } from './routes/health.routes.js';
import { authRouter } from './routes/auth.route.js';
import { errorHandler } from './middleware/error.middleware.js';
const app = express();

app.use(morgan("dev"));
app.use(express.json());
app.use(cookieParser());


app.use('/health', healthRouter);
app.use('/auth', authRouter);

app.use(errorHandler);
export {app}