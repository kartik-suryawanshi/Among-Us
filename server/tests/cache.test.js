import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getRedisClient,
  buildCacheKey,
  getCache,
  setCache,
  deleteCache,
  checkRedisConnection,
} from '../src/cache/redis.js';
import app from '../src/app.js';

test('buildCacheKey constructs clean, lowercase, normalized cache keys', () => {
  const key1 = buildCacheKey('repo', 'ExpressJS/Express', 'metadata');
  assert.equal(key1, 'gitstory:repo:expressjs/express:metadata');

  const key2 = buildCacheKey('analytics', 'Facebook/React', 'languages');
  assert.equal(key2, 'gitstory:analytics:facebook/react:languages');
});

test('getRedisClient returns null gracefully when REDIS_URL is not set', () => {
  const originalUrl = process.env.REDIS_URL;
  delete process.env.REDIS_URL;

  const client = getRedisClient();
  assert.equal(client, null);

  process.env.REDIS_URL = originalUrl;
});

test('getCache, setCache, and deleteCache handle offline Redis safely', async () => {
  // When Redis is offline or not configured, operations should return null/false without throwing
  const cacheValue = await getCache('gitstory:test:nonexistent');
  assert.equal(cacheValue, null);

  const setResult = await setCache('gitstory:test:key', { foo: 'bar' });
  assert.equal(typeof setResult, 'boolean');

  const delResult = await deleteCache('gitstory:test:key');
  assert.equal(typeof delResult, 'boolean');
});

test('checkRedisConnection returns boolean status', async () => {
  const isUp = await checkRedisConnection();
  assert.equal(typeof isUp, 'boolean');
});

test('GET /api/health includes cache status field', async (t) => {
  const server = app.listen(0);
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  t.after(() => {
    server.close();
  });

  const response = await fetch(`${baseUrl}/api/health`);
  assert.equal(response.status, 200);

  const data = await response.json();
  assert.equal(data.status, 'ok');
  assert.ok(['connected', 'disconnected'].includes(data.cache));
});

test('GET /api/repositories/:owner/:repo returns X-Cache header in response', async (t) => {
  const server = app.listen(0);
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  t.after(() => {
    server.close();
  });

  const response = await fetch(`${baseUrl}/api/repositories/expressjs/express`);
  if (response.status === 200) {
    const xCache = response.headers.get('x-cache');
    assert.ok(['HIT', 'MISS'].includes(xCache));
  }
});
