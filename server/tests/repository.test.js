import test from 'node:test';
import assert from 'node:assert/strict';
import app from '../src/app.js';

test('GET /api/repositories/:owner/:repo returns repository metadata for a real public repo', async (t) => {
  const server = app.listen(0);
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  t.after(() => {
    server.close();
  });

  const response = await fetch(`${baseUrl}/api/repositories/expressjs/express`);
  
  // Either 200 (GitHub success) or 429 (unauthenticated rate limit if IP heavily throttled)
  if (response.status === 200) {
    const data = await response.json();
    assert.equal(data.name, 'express');
    assert.equal(data.fullName, 'expressjs/express');
    assert.equal(data.owner.login, 'expressjs');
    assert.ok(typeof data.starsCount === 'number');
    assert.ok(typeof data.forksCount === 'number');
    assert.ok(data.htmlUrl.includes('express'));
    assert.ok(data.defaultBranch);
    assert.ok(Array.isArray(data.topics));
  } else if (response.status === 429) {
    const data = await response.json();
    assert.equal(data.isRateLimit, true);
  }
});

test('GET /api/repos/:owner/:repo alias returns matching repository metadata', async (t) => {
  const server = app.listen(0);
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  t.after(() => {
    server.close();
  });

  const response = await fetch(`${baseUrl}/api/repos/expressjs/express`);
  assert.ok([200, 429].includes(response.status));
});

test('GET /api/repositories/:owner/:repo returns 404 for nonexistent repository', async (t) => {
  const server = app.listen(0);
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  t.after(() => {
    server.close();
  });

  const response = await fetch(`${baseUrl}/api/repositories/this-org-does-not-exist-998877/this-repo-does-not-exist-112233`);
  // GitHub returns 404 for nonexistent repo (or 429 if rate limited)
  if (response.status !== 429) {
    assert.equal(response.status, 404);
    const data = await response.json();
    assert.equal(data.statusCode, 404);
    assert.match(data.error, /not found/i);
  }
});

test('GET /api/repositories/:owner/:repo returns 400 for invalid identifier', async (t) => {
  const server = app.listen(0);
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  t.after(() => {
    server.close();
  });

  const response = await fetch(`${baseUrl}/api/repositories/.invalid/repo`);
  assert.equal(response.status, 400);
  const data = await response.json();
  assert.equal(data.statusCode, 400);
  assert.match(data.error, /Invalid repository owner/);
});
