function json(body, status = 200, headers = {}) {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      ...headers
    }
  });
}

function text(body, status = 200, headers = {}) {
  return new Response(body, {
    status,
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      ...headers
    }
  });
}

function payload(resource, operation, env, extra = {}) {
  return {
    success: true,
    version: 'v1',
    resource,
    operation,
    provider: {
      adapter: env.META_ACCESS_TOKEN && env.META_IG_USER_ID ? 'meta-official-ready' : 'safe-placeholder',
      writeOperations: 'dry-run'
    },
    ...extra,
    generatedAt: new Date().toISOString()
  };
}

async function proxyToOrigin(request, env) {
  if (!env.ORIGIN_API_URL) return null;
  const incoming = new URL(request.url);
  const upstream = new URL(incoming.pathname + incoming.search, env.ORIGIN_API_URL);
  const headers = new Headers(request.headers);
  if (env.ORIGIN_API_KEY) headers.set('x-api-key', env.ORIGIN_API_KEY);
  return fetch(upstream, { method: request.method, headers, body: request.body });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (['/health', '/ready', '/live'].includes(url.pathname)) {
      return json({ success: true, status: url.pathname.slice(1) || 'ok', service: 'tenrusl-cloudflare-gateway', timestamp: new Date().toISOString() });
    }

    if (url.pathname === '/metrics') {
      return text('tenrusl_up 1\n');
    }

    const isV1 = /^\/(api\/)?v1\//.test(url.pathname);
    if (isV1 && env.ORIGIN_API_URL) {
      const proxied = await proxyToOrigin(request, env);
      if (proxied) return proxied;
    }

    if (isV1 && request.method === 'GET') {
      return json(payload(url.pathname.split('/').filter(Boolean).pop() || 'v1', 'contract', env, {
        path: url.pathname,
        query: Object.fromEntries(url.searchParams),
        data: []
      }));
    }

    if (isV1 && request.method === 'POST') {
      const body = await request.json().catch(() => ({}));
      return json(payload('actions', 'dry-run', env, {
        path: url.pathname,
        dryRun: true,
        data: body
      }), 202);
    }

    if (url.pathname === '/') {
      return json({ success: true, service: 'tenrusl-cloudflare-gateway', endpoints: ['/health', '/ready', '/live', '/metrics', '/v1/*'] });
    }

    return json({ success: false, error: { code: 'NOT_FOUND', message: 'Route not found.' } }, 404);
  }
};
