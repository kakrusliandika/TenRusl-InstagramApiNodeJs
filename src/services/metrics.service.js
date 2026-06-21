const startedAt = Date.now();
const httpMetrics = {
  total: 0,
  durationMsTotal: 0,
  byStatus: new Map(),
  byMethod: new Map(),
  byRoute: new Map()
};

function increment(map, key) {
  map.set(key, (map.get(key) || 0) + 1);
}

function normalizeRoute(req) {
  const base = req.baseUrl || '';
  const routePath = req.route?.path;
  if (!routePath) return req.path || req.originalUrl || 'unknown';
  return `${base}${routePath}`.replace(/\/+/g, '/');
}

export function metricsMiddleware(req, res, next) {
  const started = process.hrtime.bigint();

  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - started) / 1_000_000;
    httpMetrics.total += 1;
    httpMetrics.durationMsTotal += durationMs;
    increment(httpMetrics.byStatus, String(res.statusCode));
    increment(httpMetrics.byMethod, req.method);
    increment(httpMetrics.byRoute, `${req.method} ${normalizeRoute(req)}`);
  });

  next();
}

export function getMetricsSnapshot() {
  return {
    service: 'tenrusl-instagram-api',
    uptimeSeconds: Math.round(process.uptime()),
    startedAt: new Date(startedAt).toISOString(),
    http: {
      totalRequests: httpMetrics.total,
      averageDurationMs: httpMetrics.total === 0 ? 0 : Number((httpMetrics.durationMsTotal / httpMetrics.total).toFixed(3)),
      byStatus: Object.fromEntries(httpMetrics.byStatus),
      byMethod: Object.fromEntries(httpMetrics.byMethod),
      byRoute: Object.fromEntries(httpMetrics.byRoute)
    },
    memory: process.memoryUsage(),
    node: process.version
  };
}

function prometheusLine(name, labels, value) {
  const labelText = Object.entries(labels || {})
    .map(([key, val]) => `${key}="${String(val).replace(/"/g, '\\"')}"`)
    .join(',');
  return labelText ? `${name}{${labelText}} ${value}` : `${name} ${value}`;
}

export function getPrometheusMetrics() {
  const snapshot = getMetricsSnapshot();
  const lines = [
    '# HELP tenrusl_up Service liveness indicator.',
    '# TYPE tenrusl_up gauge',
    prometheusLine('tenrusl_up', {}, 1),
    '# HELP tenrusl_process_uptime_seconds Process uptime in seconds.',
    '# TYPE tenrusl_process_uptime_seconds gauge',
    prometheusLine('tenrusl_process_uptime_seconds', {}, snapshot.uptimeSeconds),
    '# HELP tenrusl_http_requests_total Total HTTP requests.',
    '# TYPE tenrusl_http_requests_total counter',
    prometheusLine('tenrusl_http_requests_total', {}, snapshot.http.totalRequests),
    '# HELP tenrusl_http_request_duration_ms_average Average HTTP request duration in milliseconds.',
    '# TYPE tenrusl_http_request_duration_ms_average gauge',
    prometheusLine('tenrusl_http_request_duration_ms_average', {}, snapshot.http.averageDurationMs),
    '# HELP tenrusl_memory_rss_bytes Resident memory usage in bytes.',
    '# TYPE tenrusl_memory_rss_bytes gauge',
    prometheusLine('tenrusl_memory_rss_bytes', {}, snapshot.memory.rss)
  ];

  for (const [status, count] of Object.entries(snapshot.http.byStatus)) {
    lines.push(prometheusLine('tenrusl_http_requests_by_status_total', { status }, count));
  }

  for (const [method, count] of Object.entries(snapshot.http.byMethod)) {
    lines.push(prometheusLine('tenrusl_http_requests_by_method_total', { method }, count));
  }

  return `${lines.join('\n')}\n`;
}
