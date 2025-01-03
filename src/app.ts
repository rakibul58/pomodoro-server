import express, { Application, NextFunction, Request, Response } from 'express';
import cors from 'cors';
import router from './app/routes';
import globalErrorHandler from './app/middlewares/globalErrorHandler';
import cookieParser from 'cookie-parser';
import { notFound } from './app/errors/NotFoundError';
import { requestLogger } from './helpers/winston';
import { createMetrics, createMetricsMiddleware, createRequestDurationMiddleware } from './helpers/prometheus';

const app: Application = express();
app.use(cors());
app.use(cookieParser());
const metrics = createMetrics();

//parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(requestLogger);
app.use(createRequestDurationMiddleware(metrics));

// Metrics endpoint
app.get('/api/v1/metrics', createMetricsMiddleware(metrics));


app.get('/', (req: Request, res: Response) => {
    res.send({
        Message: "PH-Pomodoro Server is running..."
    })
});

app.use('/api/v1', router);

app.use(globalErrorHandler);

app.use(notFound)

export default app;