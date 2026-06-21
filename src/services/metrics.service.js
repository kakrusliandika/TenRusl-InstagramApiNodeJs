import { env } from "../config/env.js";

const startedAt = Date.now();
const metrics = {
    requestCount: 0,
    byStatus: new Map(),
    byMethod: new Map(),
    byPath: new Map(),
};

function increment(map, key) {
    map.set(key, (map.get(key) || 0) + 1);
}

export function metricsMiddleware(req, res, next) {
    res.on("finish", () => {
        metrics.requestCount += 1;
        increment(metrics.byStatus, String(res.statusCode));
        increment(metrics.byMethod, req.method);
        increment(metrics.byPath, `${req.method} ${req.route?.path || req.path || req.originalUrl}`);
    });
    next();
}

export function getMetricsSnapshot(providerStatus = {}) {
    return {
        service: env.appName,
        appVersion: env.appVersion,
        environment: env.nodeEnv,
        providerActive: env.igProvider,
        provider: providerStatus,
        uptimeSeconds: Math.round(process.uptime()),
        startedAt: new Date(startedAt).toISOString(),
        requestCount: metrics.requestCount,
        nodeVersion: process.version,
        memory: process.memoryUsage(),
        http: {
            byStatus: Object.fromEntries(metrics.byStatus),
            byMethod: Object.fromEntries(metrics.byMethod),
            byPath: Object.fromEntries(metrics.byPath),
        },
    };
}

function labelsToString(labels = {}) {
    const entries = Object.entries(labels);
    if (entries.length === 0) return "";
    return `{${entries.map(([key, value]) => `${key}="${String(value).replace(/"/g, '\\"')}"`).join(",")}}`;
}

function line(name, value, labels = {}) {
    return `${name}${labelsToString(labels)} ${value}`;
}

export function getPrometheusMetrics(providerStatus = {}) {
    const snapshot = getMetricsSnapshot(providerStatus);
    const lines = [
        "# HELP tenrusl_up Service liveness indicator.",
        "# TYPE tenrusl_up gauge",
        line("tenrusl_up", 1),
        "# HELP tenrusl_uptime_seconds Process uptime in seconds.",
        "# TYPE tenrusl_uptime_seconds gauge",
        line("tenrusl_uptime_seconds", snapshot.uptimeSeconds),
        "# HELP tenrusl_requests_total Total HTTP requests.",
        "# TYPE tenrusl_requests_total counter",
        line("tenrusl_requests_total", snapshot.requestCount),
        "# HELP tenrusl_memory_rss_bytes RSS memory usage in bytes.",
        "# TYPE tenrusl_memory_rss_bytes gauge",
        line("tenrusl_memory_rss_bytes", snapshot.memory.rss),
        "# HELP tenrusl_node_info Node.js and application metadata.",
        "# TYPE tenrusl_node_info gauge",
        line("tenrusl_node_info", 1, {
            node: snapshot.nodeVersion,
            version: snapshot.appVersion,
            provider: snapshot.providerActive,
            environment: snapshot.environment,
        }),
    ];

    for (const [status, count] of Object.entries(snapshot.http.byStatus)) {
        lines.push(line("tenrusl_requests_by_status_total", count, { status }));
    }

    for (const [method, count] of Object.entries(snapshot.http.byMethod)) {
        lines.push(line("tenrusl_requests_by_method_total", count, { method }));
    }

    if (providerStatus.provider) {
        lines.push(line("tenrusl_provider_ready", providerStatus.ready ? 1 : 0, { provider: providerStatus.provider }));
    }

    return `${lines.join("\n")}\n`;
}
