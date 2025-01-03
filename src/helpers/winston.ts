import { NextFunction, Request, Response } from "express";
import winston from "winston";
import config from "../config";

const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
    new winston.transports.File({
      filename:
        config.env === "production" ? "/tmp/error.log" : "./logs/error.log",
      level: "error",
    }),
    new winston.transports.File({
      filename:
        config.env === "production"
          ? "/tmp/combined.log"
          : "./logs/combined.log",
    }),
  ],
});

const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const start = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - start;
    logger.info({
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
    });
  });

  next();
};

export { logger, requestLogger };
