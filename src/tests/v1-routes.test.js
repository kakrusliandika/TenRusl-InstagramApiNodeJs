import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { createApp } from '../app.js';

const getEndpoints = [
  '/ready',
  '/live',
  '/metrics',
  '/v1/accounts',
  '/v1/accounts/acc_123',
  '/v1/profiles',
  '/v1/profiles/prof_123',
  '/v1/followers/self',
  '/v1/followers/users/kakrusliandika',
  '/v1/following/self',
  '/v1/following/users/kakrusliandika',
  '/v1/photos/users/kakrusliandika',
  '/v1/feeds/users/kakrusliandika',
  '/v1/statuses/users/kakrusliandika',
  '/v1/posts',
  '/v1/posts/post_123',
  '/v1/posts/by-link?link=https%3A%2F%2Fwww.instagram.com%2Fp%2FCODE123%2F',
  '/v1/posts?link=https%3A%2F%2Fwww.instagram.com%2Freel%2FCODE123%2F',
  '/v1/reels',
  '/v1/media',
  '/v1/comments',
  '/v1/mentions',
  '/v1/hashtags/media?tag=nodejs',
  '/v1/insights',
  '/v1/conversations',
  '/v1/messages'
];

const postEndpoints = [
  ['/v1/actions/follow/from-username', { targetUsername: 'kakrusliandika' }],
  ['/v1/actions/unfollow/from-username', { targetUsername: 'kakrusliandika' }],
  ['/v1/publish/media', { mediaUrl: 'https://example.com/photo.jpg', caption: 'demo' }],
  ['/v1/publish/reel', { mediaUrl: 'https://example.com/reel.mp4', caption: 'demo' }],
  ['/v1/comments/comment_123/reply', { text: 'Terima kasih' }],
  ['/v1/messages/send', { recipientUsername: 'kakrusliandika', message: 'Halo' }]
];

test('all requested GET endpoints are mounted', async () => {
  const app = createApp();
  for (const endpoint of getEndpoints) {
    const response = await request(app).get(endpoint).expect(200);
    if (endpoint !== '/metrics') assert.equal(response.body.success, true, endpoint);
  }
});

test('all requested POST endpoints are mounted as safe dry-run actions', async () => {
  const app = createApp();
  for (const [endpoint, body] of postEndpoints) {
    const response = await request(app).post(endpoint).send(body).expect(202);
    assert.equal(response.body.success, true, endpoint);
    assert.equal(response.body.dryRun, true, endpoint);
  }
});
