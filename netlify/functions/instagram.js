// Netlify Function adapter for official Meta API mode.
// It intentionally avoids Puppeteer because Netlify Functions are better for lightweight official API calls.

const json = (statusCode, body) => ({
  statusCode,
  headers: {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'public, max-age=60'
  },
  body: JSON.stringify(body)
});

function getUsername(event) {
  const pathParts = event.path.split('/').filter(Boolean);
  return event.queryStringParameters?.username || pathParts[pathParts.length - 1];
}

export async function handler(event) {
  if (event.httpMethod !== 'GET') {
    return json(405, { success: false, error: { code: 'METHOD_NOT_ALLOWED', message: 'Only GET is allowed.' } });
  }

  const username = getUsername(event);
  const limit = Math.min(Number(event.queryStringParameters?.limit || 12), Number(process.env.MAX_FEED_LIMIT || 35));

  if (!username) {
    return json(400, { success: false, error: { code: 'USERNAME_INVALID', message: 'Username is required.' } });
  }

  if (process.env.META_USERNAME && username.toLowerCase() !== process.env.META_USERNAME.toLowerCase()) {
    return json(404, { success: false, error: { code: 'META_USERNAME_MISMATCH', message: 'Configured Meta account does not match requested username.' } });
  }

  if (!process.env.META_ACCESS_TOKEN || !process.env.META_IG_USER_ID) {
    return json(500, { success: false, error: { code: 'META_CONFIG_MISSING', message: 'Meta credentials are missing.' } });
  }

  const version = process.env.META_API_VERSION || 'v23.0';
  const fields = 'id,caption,media_type,media_url,permalink,timestamp,thumbnail_url';
  const url = new URL(`https://graph.facebook.com/${version}/${process.env.META_IG_USER_ID}/media`);
  url.searchParams.set('fields', fields);
  url.searchParams.set('limit', String(limit));
  url.searchParams.set('access_token', process.env.META_ACCESS_TOKEN);

  const response = await fetch(url);
  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    return json(response.status, { success: false, error: { code: 'META_API_ERROR', message: 'Meta API error.', details: body.error || body } });
  }

  return json(200, {
    success: true,
    mode: 'official',
    source: 'official',
    username,
    count: body.data?.length || 0,
    data: body.data || [],
    generatedAt: new Date().toISOString()
  });
}
