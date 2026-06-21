function json(body, status = 200, headers = {}) {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      ...headers
    }
  });
}

function getUsernameFromPath(pathname) {
  const match = pathname.match(/^\/api\/v1\/instagram\/([^/]+)$/);
  return match ? decodeURIComponent(match[1]) : null;
}

async function fetchOfficial(username, limit, env) {
  if (!env.META_ACCESS_TOKEN || !env.META_IG_USER_ID) {
    return json({ success: false, error: { code: 'META_CONFIG_MISSING', message: 'Meta credentials are missing.' } }, 500);
  }

  if (env.META_USERNAME && username.toLowerCase() !== env.META_USERNAME.toLowerCase()) {
    return json({ success: false, error: { code: 'META_USERNAME_MISMATCH', message: 'Configured Meta account does not match requested username.' } }, 404);
  }

  const version = env.META_API_VERSION || 'v23.0';
  const fields = 'id,caption,media_type,media_url,permalink,timestamp,thumbnail_url';
  const url = new URL(`https://graph.facebook.com/${version}/${env.META_IG_USER_ID}/media`);
  url.searchParams.set('fields', fields);
  url.searchParams.set('limit', String(limit));
  url.searchParams.set('access_token', env.META_ACCESS_TOKEN);

  const response = await fetch(url);
  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    return json({ success: false, error: { code: 'META_API_ERROR', message: 'Meta API error.', details: body.error || body } }, response.status);
  }

  return json({
    success: true,
    mode: 'official',
    source: 'official',
    username,
    count: body.data?.length || 0,
    data: body.data || [],
    generatedAt: new Date().toISOString()
  }, 200, { 'cache-control': 'public, max-age=300' });
}

async function fetchScraperProxy(username, limit, env, request) {
  if (!env.SCRAPER_API_URL) {
    return json({ success: false, error: { code: 'SCRAPER_PROXY_MISSING', message: 'SCRAPER_API_URL is not configured.' } }, 503);
  }

  const url = new URL(`/api/v1/instagram/${encodeURIComponent(username)}`, env.SCRAPER_API_URL);
  url.searchParams.set('limit', String(limit));

  const headers = new Headers();
  if (env.SCRAPER_API_KEY) headers.set('x-api-key', env.SCRAPER_API_KEY);
  const requestId = request.headers.get('x-request-id');
  if (requestId) headers.set('x-request-id', requestId);

  return fetch(url, { headers });
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === '/' || url.pathname === '/health') {
      return json({ success: true, status: 'ok', service: 'tenrusl-cloudflare-gateway', timestamp: new Date().toISOString() });
    }

    const username = getUsernameFromPath(url.pathname) || url.searchParams.get('username');
    if (!username) {
      return json({ success: false, error: { code: 'NOT_FOUND', message: 'Route not found.' } }, 404);
    }

    const limit = Math.min(Number(url.searchParams.get('limit') || 12), Number(env.MAX_FEED_LIMIT || 35));
    const source = url.searchParams.get('source') || env.APP_MODE || 'official';

    const cacheKey = new Request(url.toString(), request);
    const cached = await caches.default.match(cacheKey);
    if (cached) return cached;

    let response;
    if (source === 'scraper') {
      response = await fetchScraperProxy(username, limit, env, request);
    } else if (source === 'hybrid') {
      response = await fetchOfficial(username, limit, env);
      if (!response.ok) response = await fetchScraperProxy(username, limit, env, request);
    } else {
      response = await fetchOfficial(username, limit, env);
    }

    if (response.ok) ctx.waitUntil(caches.default.put(cacheKey, response.clone()));
    return response;
  }
};
