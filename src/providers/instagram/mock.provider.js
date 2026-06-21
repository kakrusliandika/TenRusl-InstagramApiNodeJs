import crypto from 'node:crypto';

function stableId(prefix, seed) {
  return `${prefix}_${crypto.createHash('sha256').update(String(seed)).digest('hex').slice(0, 16)}`;
}

function now() {
  return new Date().toISOString();
}

function targetFromIdentifier(identifier) {
  const raw = String(identifier || 'tenrusl').replace(/^@/, '');
  const isId = /^[0-9]+$/.test(raw) || raw.startsWith('ig_');
  return {
    identifier: raw,
    identifierType: isId ? 'id' : 'username',
    id: isId ? raw : stableId('user', raw),
    username: isId ? `user_${String(raw).slice(-6)}` : raw
  };
}

function pageMeta(query = {}) {
  return {
    limit: query.limit ?? 25,
    page: query.page ?? 1,
    cursor: query.cursor ?? null,
    nextCursor: null,
    all: Boolean(query.all)
  };
}

export class MockInstagramProvider {
  constructor(options = {}) {
    this.name = options.name || 'mock';
    this.mode = options.mode || 'mock';
    this.ready = true;
    this.safeMode = true;
  }

  status() {
    return {
      provider: this.name,
      mode: this.mode,
      ready: this.ready,
      safeMode: this.safeMode,
      officialConfigured: false,
      writeMode: 'dry-run-first',
      generatedAt: now()
    };
  }

  base(resource, operation, extra = {}) {
    return {
      provider: this.status(),
      resource,
      operation,
      ...extra
    };
  }

  accountShape(identifier) {
    const target = targetFromIdentifier(identifier);
    return {
      id: target.id,
      username: target.username,
      displayName: 'TenRusl Mock Account',
      accountType: 'MOCK',
      isVerified: false,
      profileUrl: `https://www.instagram.com/${target.username}/`,
      note: 'Mock data for development, testing, CI/CD, and deployment previews.'
    };
  }

  profileShape(identifier) {
    const account = this.accountShape(identifier);
    return {
      ...account,
      biography: 'Safe mock profile returned by TenRusl Instagram API Gateway.',
      followersCount: 1234,
      followingCount: 321,
      mediaCount: 42,
      avatarUrl: 'https://example.com/mock-avatar.png'
    };
  }

  mediaShape(resource, seed, extra = {}) {
    const id = stableId(resource, seed);
    return {
      id,
      shortcode: stableId('code', seed).replace('code_', '').slice(0, 11),
      resource,
      mediaType: resource === 'reels' ? 'REEL' : resource === 'photos' ? 'IMAGE' : 'MEDIA',
      caption: `Mock ${resource} item generated for safe testing.`,
      permalink: `https://www.instagram.com/p/${id.slice(-11)}/`,
      createdAt: now(),
      metrics: {
        likes: 100,
        comments: 12,
        shares: 3
      },
      ...extra
    };
  }

  async getAccount(identifier) {
    return this.base('accounts', 'get-account', {
      account: this.accountShape(identifier)
    });
  }

  async getProfile(identifier) {
    return this.base('profiles', 'get-profile', {
      profile: this.profileShape(identifier)
    });
  }

  async getProfileByLink(parsedLink) {
    return this.base('profiles', 'get-profile-by-link', {
      link: parsedLink,
      profile: this.profileShape(parsedLink.username || 'profile_link')
    });
  }

  async getFollowers(identifier, query = {}) {
    const target = targetFromIdentifier(identifier);
    return this.base('followers', 'get-followers', {
      target,
      page: pageMeta(query),
      items: [this.profileShape(`${target.username}_follower`)]
    });
  }

  async getFollowing(identifier, query = {}) {
    const target = targetFromIdentifier(identifier);
    return this.base('following', 'get-following', {
      target,
      page: pageMeta(query),
      items: [this.profileShape(`${target.username}_following`)]
    });
  }

  async performAction(action, identifier, body = {}) {
    const dryRun = body.dryRun !== false;
    return this.base('actions', action, {
      accepted: true,
      dryRun: true,
      requestedDryRun: dryRun,
      target: targetFromIdentifier(identifier || body.username || 'unknown'),
      result: {
        status: 'dry-run',
        message: 'Write actions are intentionally dry-run by default. No Instagram state was changed.'
      }
    });
  }

  async getUserCollection(resource, identifier, query = {}) {
    const target = targetFromIdentifier(identifier);
    const count = query.all ? Math.min(query.limit ?? 25, 5) : 1;
    const items = Array.from({ length: count }, (_, index) => this.mediaShape(resource, `${resource}:${target.username}:${index}`, {
      owner: target,
      index
    }));
    return this.base(resource, `get-${resource}-by-user`, {
      target,
      page: pageMeta(query),
      items
    });
  }

  async getByLink(resource, parsedLink) {
    return this.base(resource, `get-${resource}-by-link`, {
      link: parsedLink,
      item: this.mediaShape(resource, parsedLink.shortcode || parsedLink.storyId || parsedLink.url, {
        permalink: parsedLink.url,
        linkKind: parsedLink.kind
      })
    });
  }

  async getPostById(id) {
    return this.base('posts', 'get-post-by-id', {
      post: this.mediaShape('posts', id, { id })
    });
  }

  async publish(resource, body = {}) {
    return this.base(resource, `publish-${resource}`, {
      accepted: true,
      dryRun: true,
      requestedDryRun: body.dryRun !== false,
      draft: {
        id: stableId('draft', `${resource}:${body.mediaUrl}:${body.caption}`),
        mediaType: body.mediaType,
        mediaUrl: body.mediaUrl,
        caption: body.caption ?? '',
        status: 'dry-run'
      }
    });
  }

  async getComments(query = {}) {
    return this.base('comments', 'get-comments', {
      link: query.link ?? null,
      page: pageMeta(query),
      items: [{
        id: stableId('comment', query.link || 'mock'),
        text: 'Mock comment for endpoint testing.',
        username: 'mock_commenter',
        createdAt: now()
      }]
    });
  }

  async replyComment(id, body = {}) {
    return this.base('comments', 'reply-comment', {
      accepted: true,
      dryRun: true,
      commentId: id || body.id || null,
      text: body.text,
      result: { status: 'dry-run' }
    });
  }

  async getMentions(query = {}) {
    return this.base('mentions', 'get-mentions', {
      page: pageMeta(query),
      items: [{ id: stableId('mention', 'mock'), username: 'mock_user', text: '@tenrusl mentioned in mock mode.' }]
    });
  }

  async getHashtagMedia(query = {}) {
    const hashtag = query.hashtag || query.tag || 'tenrusl';
    return this.base('hashtags', 'get-hashtag-media', {
      hashtag,
      page: pageMeta(query),
      items: [this.mediaShape('hashtag-media', hashtag)]
    });
  }

  async getInsights(query = {}) {
    return this.base('insights', 'get-insights', {
      range: query.range || '7d',
      metrics: {
        impressions: 1000,
        reach: 750,
        engagement: 120
      }
    });
  }

  async getConversations(query = {}) {
    return this.base('conversations', 'get-conversations', {
      page: pageMeta(query),
      items: [{ id: stableId('thread', 'mock'), participants: ['tenrusl', 'mock_user'], updatedAt: now() }]
    });
  }

  async getMessages(query = {}) {
    return this.base('messages', 'get-messages', {
      conversationId: query.conversationId || null,
      page: pageMeta(query),
      items: [{ id: stableId('message', 'mock'), text: 'Mock message.', direction: 'inbound', createdAt: now() }]
    });
  }

  async getMessageThread(id, query = {}) {
    return this.base('messages', 'get-message-thread', {
      conversationId: id,
      page: pageMeta(query),
      items: [{ id: stableId('message', id), text: 'Mock message in thread.', direction: 'inbound', createdAt: now() }]
    });
  }

  async sendMessage(id, body = {}) {
    return this.base('messages', 'send-message', {
      accepted: true,
      dryRun: true,
      conversationId: id,
      recipientId: body.recipientId || null,
      username: body.username || null,
      text: body.text,
      result: { status: 'dry-run' }
    });
  }
}
