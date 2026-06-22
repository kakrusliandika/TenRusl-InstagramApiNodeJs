import test from 'node:test';
import assert from 'node:assert/strict';
import { assertEnvelope, requestJson, withServer } from './test-client.js';

const instagramLink = encodeURIComponent('https://www.instagram.com/p/ABC123def45/');
const storyLink = encodeURIComponent('https://www.instagram.com/stories/tenrusl/123456789/');
const profileLink = encodeURIComponent('https://www.instagram.com/tenrusl/');
const validPublishBody = { mediaUrl: 'https://example.com/image.jpg', mediaType: 'IMAGE', caption: 'Dry run publish', dryRun: true };
const validReplyBody = { text: 'Dry run reply', dryRun: true };
const validMessageBody = { username: 'tenrusl', text: 'Dry run message', dryRun: true };

const routes = [
  ['GET', '/v1/get/accounts/123456'],
  ['GET', '/v1/get/accounts/tenrusl'],
  ['GET', '/v1/get/profiles/123456'],
  ['GET', '/v1/get/profiles/tenrusl'],
  ['GET', `/v1/get/profiles/by-link?link=${profileLink}`],
  ['GET', '/v1/get/followers/tenrusl?limit=2'],
  ['GET', '/v1/get/following/123456?limit=2'],
  ['POST', '/v1/actions/follow/tenrusl', { dryRun: true }],
  ['POST', '/v1/actions/unfollow/123456', { dryRun: true }],
  ['GET', '/v1/get/photos/users/tenrusl?limit=2'],
  ['GET', '/v1/get/feeds/users/123456?limit=2'],
  ['GET', '/v1/get/statuses/users/tenrusl?limit=2'],
  ['GET', `/v1/get/photos/by-link?link=${instagramLink}`],
  ['GET', `/v1/get/feeds/by-link?link=${instagramLink}`],
  ['GET', `/v1/get/statuses/by-link?link=${storyLink}`],
  ['GET', '/v1/get/posts/users/tenrusl?limit=2'],
  ['GET', '/v1/get/posts/users/123456?limit=2'],
  ['GET', `/v1/get/posts/by-link?link=${instagramLink}`],
  ['GET', '/v1/get/posts/post_123'],
  ['GET', '/v1/get/reels/users/tenrusl?limit=2'],
  ['GET', '/v1/get/reels/users/123456?limit=2'],
  ['GET', `/v1/get/reels/by-link?link=${instagramLink}`],
  ['GET', '/v1/get/media/users/tenrusl?limit=2'],
  ['GET', '/v1/get/media/users/123456?limit=2'],
  ['GET', `/v1/get/media/by-link?link=${instagramLink}`],
  ['POST', '/v1/publish/media', validPublishBody],
  ['POST', '/v1/publish/reels', { ...validPublishBody, mediaType: 'REEL' }],
  ['POST', '/v1/publish/photos', validPublishBody],
  ['POST', '/v1/publish/feeds', { ...validPublishBody, mediaType: 'FEED' }],
  ['POST', '/v1/publish/statuses', { ...validPublishBody, mediaType: 'STORY' }],
  ['GET', `/v1/comments?link=${instagramLink}`],
  ['POST', '/v1/comments/comment_123/reply', validReplyBody],
  ['POST', '/v1/comments/reply', { ...validReplyBody, id: 'comment_123' }],
  ['GET', '/v1/mentions?limit=2'],
  ['GET', '/v1/hashtags/media?hashtag=tenrusl&limit=2'],
  ['GET', '/v1/insights'],
  ['GET', '/v1/conversations?limit=2'],
  ['GET', '/v1/messages?limit=2'],
  ['GET', '/v1/messages/thread_123?limit=2'],
  ['POST', '/v1/messages/thread_123/send', validMessageBody]
];

test('all required /v1 routes return non-404 standard envelopes in mock mode', async () => {
  await withServer(async ({ baseUrl }) => {
    for (const [method, path, body] of routes) {
      const result = await requestJson(baseUrl, path, {
        method,
        body: body ? JSON.stringify(body) : undefined
      });
      assert.notEqual(result.response.status, 404, `${method} ${path}`);
      assert.ok(result.response.status < 500, `${method} ${path}`);
      assertEnvelope(result.body, result.response.status < 400);
    }
  });
});

test('comment reply by body id returns dry-run target', async () => {
  await withServer(async ({ baseUrl }) => {
    const { response, body } = await requestJson(baseUrl, '/v1/comments/reply', {
      method: 'POST',
      body: JSON.stringify({ id: 'comment_123', text: 'Dry run reply', dryRun: true })
    });

    assert.equal(response.status, 202);
    assertEnvelope(body, true);
    assert.equal(body.data.accepted, true);
    assert.equal(body.data.target.type, 'id');
    assert.equal(body.data.target.id, 'comment_123');
  });
});

test('comment reply by link returns dry-run link target', async () => {
  await withServer(async ({ baseUrl }) => {
    const { response, body } = await requestJson(baseUrl, '/v1/comments/reply', {
      method: 'POST',
      body: JSON.stringify({
        link: 'https://www.instagram.com/p/ABC123def45/',
        text: 'Dry run reply by link',
        dryRun: true
      })
    });

    assert.equal(response.status, 202);
    assertEnvelope(body, true);
    assert.equal(body.data.accepted, true);
    assert.equal(body.data.target.type, 'link');
    assert.equal(body.data.target.link.kind, 'post');
    assert.equal(body.data.target.link.shortcode, 'ABC123def45');
  });
});

test('comment reply body id takes priority over link', async () => {
  await withServer(async ({ baseUrl }) => {
    const { response, body } = await requestJson(baseUrl, '/v1/comments/reply', {
      method: 'POST',
      body: JSON.stringify({
        id: 'comment_456',
        link: 'https://www.instagram.com/p/ABC123def45/',
        text: 'Dry run reply by id',
        dryRun: true
      })
    });

    assert.equal(response.status, 202);
    assertEnvelope(body, true);
    assert.equal(body.data.target.type, 'id');
    assert.equal(body.data.target.id, 'comment_456');
    assert.equal(body.data.target.priority, 'id');
  });
});
