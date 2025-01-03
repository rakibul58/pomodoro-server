import { Request, Response, NextFunction } from "express";
import * as promClient from "prom-client";

interface PrometheusMetrics {
  register: promClient.Registry;
  httpRequestDuration: promClient.Histogram<string>;
  httpRequestTotal: promClient.Counter<string>;
}

const createMetrics = (): PrometheusMetrics => {
  const register = new promClient.Registry();

  promClient.collectDefaultMetrics({
    register,
    prefix: "app_",
  });

  const httpRequestDuration = new promClient.Histogram({
    name: "http_request_duration_seconds",
    help: "Duration of HTTP requests in seconds",
    labelNames: ["method", "route", "code"],
    buckets: [0.1, 0.5, 1, 5],
  });

  const httpRequestTotal = new promClient.Counter({
    name: "http_requests_total",
    help: "Total number of HTTP requests",
    labelNames: ["method", "route", "code"],
  });

  register.registerMetric(httpRequestDuration);
  register.registerMetric(httpRequestTotal);

  return { register, httpRequestDuration, httpRequestTotal };
};

const createRequestDurationMiddleware =
  (metrics: PrometheusMetrics) =>
  (req: Request, res: Response, next: NextFunction): void => {
    const start = Date.now();

    res.on("finish", () => {
      const duration = Date.now() - start;
      const route = (req.route?.path || req.path) as string;

      metrics.httpRequestDuration
        .labels(req.method, route, res.statusCode.toString())
        .observe(duration / 1000);

      metrics.httpRequestTotal
        .labels(req.method, route, res.statusCode.toString())
        .inc();
    });

    next();
  };

const createMetricsMiddleware =
  (metrics: PrometheusMetrics) =>
  async (req: Request, res: Response): Promise<void> => {
    try {
      const format = req.query.format;

      if (format === "json") {
        const metricsText = await metrics.register.metrics();
        const metricsJson = parsePrometheusToJson(metricsText);
        res.json(metricsJson);
      } else {
        res.set("Content-Type", metrics.register.contentType);
        res.end(await metrics.register.metrics());
      }
    } catch (err) {
      res.status(500).end();
    }
  };

interface MetricData {
  help: string;
  type: string;
  metrics: Record<string, any>[];
}

function parsePrometheusToJson(
  metricsText: string
): Record<string, MetricData> {
  const lines = metricsText.split("\n");
  const metrics: Record<string, MetricData> = {};
  let currentMetric = "";

  for (const line of lines) {
    if (line.startsWith("# HELP")) {
      currentMetric = line.split(" ")[2];
      metrics[currentMetric] = {
        help: line.split(" ").slice(3).join(" "),
        type: "",
        metrics: [],
      };
    } else if (line.startsWith("# TYPE")) {
      metrics[currentMetric].type = line.split(" ")[3];
    } else if (line && !line.startsWith("#")) {
      const [name, value] = line.split(" ");
      const labels = name.match(/{(.+)}/)?.[1];

      const metric: Record<string, any> = { value: parseFloat(value) };

      if (labels) {
        const labelParts = labels.split(",");
        labelParts.forEach((part) => {
          const [key, value] = part.split("=");
          metric[key] = value.replace(/"/g, "");
        });
      }

      metrics[currentMetric].metrics.push(metric);
    }
  }

  return metrics;
}

export {
  createMetrics,
  createRequestDurationMiddleware,
  createMetricsMiddleware,
};
