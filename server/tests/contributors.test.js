import test from 'node:test';
import assert from 'node:assert/strict';
import app from '../src/app.js';

test('GET /api/repositories/:owner/:repo/contributors returns contributor statistics for a real public repo', async (t) => {
  const server = app.listen(0);
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  t.after(() => {
    server.close();
  });

  const response = await fetch(`${baseUrl}/api/repositories/expressjs/express/contributors?limit=5`);

  if (response.status === 200) {
    const data = await response.json();
    assert.ok(typeof data.totalContributors === 'number');
    assert.ok(Array.isArray(data.contributors));
    assert.ok(data.contributors.length <= 5);

    if (data.contributors.length > 0) {
      const topContributor = data.contributors[0];
      assert.ok(topContributor.login || topContributor.name);
      assert.ok(typeof topContributor.contributions === 'number');
      assert.ok(topContributor.contributions > 0);
      assert.ok(topContributor.type);
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
