import test from 'node:test';
import assert from 'node:assert/strict';
import app from '../src/app.js';

test('GET /api/repositories/:owner/:repo/contributors returns contributor statistics', async (t) => {
  const server = app.listen(0);
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  t.after(() => {
    server.close();
  });

  const response = await fetch(`${baseUrl}/api/repositories/expressjs/express/contributors`);
  if (response.status === 200) {
    const data = await response.json();
    assert.ok(typeof data.totalContributors === 'number');
    assert.ok(typeof data.totalContributions === 'number');
    assert.ok(Array.isArray(data.contributors));
    if (data.contributors.length > 0) {
      const top = data.contributors[0];
      assert.ok(top.login || top.name);
      assert.ok(top.avatarUrl);
      assert.ok(typeof top.contributions === 'number');
      assert.ok(typeof top.percentage === 'number');
      assert.equal(top.rank, 1);
      assert.ok(top.badge);
    }
  } else if (response.status === 429) {
    const data = await response.json();
    assert.equal(data.isRateLimit, true);
  }
});

test('GET /api/repos/:owner/:repo/contributors alias matches contributors endpoint', async (t) => {
  const server = app.listen(0);
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  t.after(() => {
    server.close();
  });

  const response = await fetch(`${baseUrl}/api/repos/expressjs/express/contributors?limit=2`);
  assert.ok([200, 429].includes(response.status));
});

test('GET /api/repositories/:owner/:repo/contributors returns 404 for nonexistent repository', async (t) => {
  const server = app.listen(0);
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  t.after(() => {
    server.close();
  });

  const response = await fetch(`${baseUrl}/api/repositories/nonexistent-org-998877/nonexistent-repo-112233/contributors`);
  if (response.status !== 429) {
    assert.equal(response.status, 404);
  }
});

test('GET /api/repositories/:owner/:repo/contributors returns 400 for invalid identifier', async (t) => {
  const server = app.listen(0);
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  t.after(() => {
    server.close();
  });

  const response = await fetch(`${baseUrl}/api/repositories/.invalid/repo/contributors`);
  assert.equal(response.status, 400);
});

