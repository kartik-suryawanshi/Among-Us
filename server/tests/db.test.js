import test from 'node:test';
import assert from 'node:assert/strict';
import { getPool, query, checkDbConnection } from '../src/db/pool.js';
import { runMigrations } from '../src/db/migrations.js';
import { repositoryPersistenceService } from '../src/services/repositoryPersistence.service.js';
import app from '../src/app.js';

test('getPool returns null gracefully when DATABASE_URL is not set', () => {
  const originalUrl = process.env.DATABASE_URL;
  delete process.env.DATABASE_URL;

  const pool = getPool();
  assert.equal(pool, null);

  process.env.DATABASE_URL = originalUrl;
});

test('query function safely returns null without throwing when database is unavailable', async () => {
  const result = await query('SELECT 1');
  // When no DB is connected, it should return null gracefully
  assert.equal(result, null);
});

test('checkDbConnection returns boolean status', async () => {
  const isUp = await checkDbConnection();
  assert.equal(typeof isUp, 'boolean');
});

test('runMigrations handles disconnected database without throwing error', async () => {
  const status = await runMigrations();
  assert.equal(typeof status, 'boolean');
});

test('repositoryPersistenceService gracefully handles operations when database is offline', async () => {
  const mockRepo = {
    id: 12345,
    name: 'test-repo',
    fullName: 'test-owner/test-repo',
    owner: { login: 'test-owner' },
    starsCount: 10,
    forksCount: 2,
  };

  const upsertResult = await repositoryPersistenceService.upsertRepository(mockRepo);
  assert.equal(upsertResult, null);

  const snapshotResult = await repositoryPersistenceService.saveAnalyticsSnapshot(
    'test-owner/test-repo',
    'languages',
    { test: 1 }
  );
  assert.equal(snapshotResult, null);

  const getResult = await repositoryPersistenceService.getPersistedRepository('test-owner/test-repo');
  assert.equal(getResult, null);
});

test('GET /api/health includes database status field', async (t) => {
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
  assert.ok(['connected', 'disconnected'].includes(data.database));
});
