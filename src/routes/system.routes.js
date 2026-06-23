import { Router } from "express";
import { env, getEnvironmentWarnings, isRuntimeReady } from "../config/env.js";
import { PROVIDER_CAPABILITIES, getInstagramProvider } from "../providers/instagram/index.js";
import { getMetricsSnapshot, getPrometheusMetrics } from "../services/metrics.service.js";
import { sendSuccess } from "../utils/response.js";

export const systemRouter = Router();

export function healthHandler(req, res) {
    const provider = getInstagramProvider();
    return sendSuccess(
        res,
        {
            status: "ok",
            service: env.appName,
            version: env.appVersion,
            nodeVersion: process.version,
            provider: provider.status(),
            uptimeSeconds: Math.round(process.uptime()),
            timestamp: new Date().toISOString(),
        },
        { meta: { requestId: req.id } }
    );
}

export function liveHandler(req, res) {
    return sendSuccess(
        res,
        {
            status: "live",
            uptimeSeconds: Math.round(process.uptime()),
            timestamp: new Date().toISOString(),
        },
        { meta: { requestId: req.id } }
    );
}

export function readyHandler(req, res) {
    const provider = getInstagramProvider();
    const warnings = getEnvironmentWarnings();
    const providerStatus = provider.status();
    const ready = isRuntimeReady({ providerStatus, warnings });
    const statusCode = ready ? 200 : 503;
    return sendSuccess(
        res,
        {
            status: ready ? "ready" : "degraded",
            provider: providerStatus,
            warnings,
            timestamp: new Date().toISOString(),
        },
        { statusCode, meta: { requestId: req.id } }
    );
}

export function metricsHandler(req, res) {
    const provider = getInstagramProvider();
    const wantsJson = req.query.format === "json" || req.get("accept")?.includes("application/json");
    if (wantsJson) {
        return sendSuccess(res, getMetricsSnapshot(provider.status()), { meta: { requestId: req.id } });
    }
    res.setHeader("content-type", "text/plain; version=0.0.4; charset=utf-8");
    return res.send(getPrometheusMetrics(provider.status()));
}

export function capabilitiesHandler(req, res) {
    const provider = getInstagramProvider();
    return sendSuccess(
        res,
        {
            activeProvider: env.igProvider,
            provider: provider.status(),
            supportedProviders: PROVIDER_CAPABILITIES,
            warnings: getEnvironmentWarnings(),
        },
        { meta: { requestId: req.id } }
    );
}

systemRouter.get("/health", healthHandler);
systemRouter.get("/ready", readyHandler);
systemRouter.get("/live", liveHandler);
systemRouter.get("/metrics", metricsHandler);
systemRouter.get("/capabilities", capabilitiesHandler);
