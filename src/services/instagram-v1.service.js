import { env } from '../config/env.js';
import { sha256 } from '../utils/hash.js';

function now() {
  return new Date().toISOString();
}

function stableId(prefix, seed) {
  return `${prefix}_${sha256(seed).slice(0, 16)}`;
}

function providerStatus() {
  const officialConfigured = Boolean(env.metaApiEnabled && env.metaAccessToken && env.metaIgUserId);
  return {
    mode: env.appMode,
    adapter: officialConfigured ? 'meta-official-ready' : 'safe-placeholder',
    officialConfigured,
    writeOperations: 'dry-run',
    note: officialConfigured
      ? 'Official Meta adapter can be wired for supported account-owned resources.'
      : 'No live Instagram provider is configured. Endpoint contract is active and returns safe placeholder data.'
  };
}

function basePayload(resource, operation, meta = {}) {
  return {
    version: 'v1',
    resource,
    operation,
    provider: providerStatus(),
    ...meta,
    generatedAt: now()
  };
}

function selfUsername() {
  return env.metaUsername || 'self';
}

function makeResourceRecord(resource, seed, extra = {}) {
  return {
    id: stableId(resource.slice(0, 4), seed),
    resource,
    status: 'available-contract',
    ...extra,
    links: {
      self: `/v1/${resource}/${encodeURIComponent(extra.id || stableId(resource.slice(0, 4), seed))}`
    }
  };
}

export async function listResource(resource, query = {}) {
  const username = query.username || (['profiles', 'posts', 'media', 'comments', 'mentions', 'insights', 'conversations', 'messages'].includes(resource) ? selfUsername() : undefined);
  const seed = `${resource}:${username || query.q || query.tag || 'collection'}`;
  const record = makeResourceRecord(resource, seed, {
    username,
    q: query.q,
    tag: query.tag,
    postId: query.postId,
    conversationId: query.conversationId,
    limit: query.limit,
    cursor: query.cursor || null
  });

  return {
    ...basePayload(resource, 'list', {
      count: 1,
      page: {
        limit: query.limit,
        cursor: query.cursor || null,
        nextCursor: null
      }
    }),
    data: [record]
  };
}

export async function getResourceById(resource, id) {
  return {
    ...basePayload(resource, 'detail-by-id', { id }),
    data: makeResourceRecord(resource, id, { id })
  };
}

export async function getUserCollection(resource, username, query = {}) {
  const seed = `${resource}:${username}`;
  return {
    ...basePayload(resource, 'list-by-username', {
      username,
      count: 1,
      page: {
        limit: query.limit,
        cursor: query.cursor || null,
        nextCursor: null
      }
    }),
    data: [makeResourceRecord(resource, seed, {
      username,
      limit: query.limit,
      cursor: query.cursor || null
    })]
  };
}

export async function getSelfCollection(resource, query = {}) {
  return getUserCollection(resource, selfUsername(), query);
}

export async function getPostById(id) {
  return {
    ...basePayload('posts', 'detail-by-post-id', { id }),
    data: {
      id,
      shortcode: id,
      mediaType: 'UNKNOWN',
      caption: null,
      permalink: null,
      ownerUsername: null,
      metrics: null,
      status: 'adapter-required',
      note: 'Hubungkan adapter resmi untuk mengambil detail post nyata berdasarkan Post ID.'
    }
  };
}

export async function getPostByLink(link) {
  const parsed = new URL(link);
  const [, type, shortcode] = parsed.pathname.split('/').filter(Boolean);
  return {
    ...basePayload('posts', 'detail-by-link', { link }),
    data: {
      id: stableId('post', link),
      shortcode,
      type: type?.toUpperCase() || 'POST',
      permalink: link,
      mediaType: type === 'reel' ? 'REEL' : 'UNKNOWN',
      caption: null,
      ownerUsername: null,
      metrics: null,
      status: 'adapter-required',
      note: 'Hubungkan adapter resmi untuk mengambil detail post nyata berdasarkan link.'
    }
  };
}

export async function executeDryRunAction(action, body = {}, params = {}) {
  const targetUsername = body.targetUsername || body.username || params.username || null;
  return {
    ...basePayload('actions', action, {
      accepted: true,
      dryRun: true,
      targetUsername,
      params
    }),
    data: {
      action,
      targetUsername,
      body,
      status: 'dry-run-only',
      note: 'Operasi tulis sengaja tidak mengeksekusi follow, unfollow, publish, reply, atau send message. Hubungkan adapter resmi dan izin eksplisit sebelum mengaktifkan operasi nyata.'
    }
  };
}
