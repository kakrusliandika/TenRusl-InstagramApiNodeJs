// Lightweight Netlify API adapter for the route contract.
// For full Express middleware behavior, deploy the Node server to Docker/VPS/Render/Railway/Kubernetes.

const json = (statusCode, body, headers = {}) => ({
  statusCode,
  headers: {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    ...headers
  },
  body: JSON.stringify(body)
});

const text = (statusCode, body, headers = {}) => ({
  statusCode,
  headers: {
    'content-type': 'text/plain; charset=utf-8',
    ...headers
  },
  body
});

function payload(resource, operation, extra = {}) {
  return {
    success: true,
    version: 'v1',
    resource,
    operation,
    provider: {
      adapter: process.env.META_ACCESS_TOKEN && process.env.META_IG_USER_ID ? 'meta-official-ready' : 'safe-placeholder',
      writeOperations: 'dry-run'
    },
    ...extra,
    generatedAt: new Date().toISOString()
  };
}

function getPath(event) {
  const raw = event.path.replace(/^\/\.netlify\/functions\/api\/?/, '/');
  return raw === '/' ? '/health' : raw;
}

export async function handler(event) {
  const path = getPath(event);
  const method = event.httpMethod;

  if (method === 'GET' && ['/health', '/ready', '/live'].includes(path)) {
    return json(200, { success: true, status: path.slice(1) || 'ok', service: 'tenrusl-instagram-api-netlify', timestamp: new Date().toISOString() });
  }

  if (method === 'GET' && path === '/metrics') {
    return text(200, 'tenrusl_up 1\n');
  }

  if (method === 'GET' && /^\/(api\/)?v1\//.test(path)) {
    return json(200, payload(path.split('/').filter(Boolean).pop() || 'v1', 'contract', {
      path,
      query: event.queryStringParameters || {},
      data: []
    }));
  }

  if (method === 'POST' && /^\/(api\/)?v1\//.test(path)) {
    return json(202, payload('actions', 'dry-run', {
      path,
      dryRun: true,
      data: event.body ? JSON.parse(event.body) : {}
    }));
  }

  return json(404, { success: false, error: { code: 'NOT_FOUND', message: 'Route not found.' } });
}
