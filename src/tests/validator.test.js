import test from 'node:test';
import assert from 'node:assert/strict';
import { validateInstagramRequest } from '../validators/instagram.validator.js';

test('validates username from params', () => {
  const result = validateInstagramRequest({ username: 'kakrusliandika' }, { limit: '5' });
  assert.equal(result.username, 'kakrusliandika');
  assert.equal(result.limit, 5);
});

test('removes @ prefix', () => {
  const result = validateInstagramRequest({ username: '@kakrusliandika' }, {});
  assert.equal(result.username, 'kakrusliandika');
});

test('rejects invalid username', () => {
  assert.throws(() => validateInstagramRequest({ username: 'bad/user' }, {}), /tidak valid/);
});
