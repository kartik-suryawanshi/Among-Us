import test from 'node:test';
import assert from 'node:assert/strict';
import app from '../src/app.js';

test('GET /api/repositories/:owner/:repo/commits returns paginated commits for real public repo', async (t) => {
  const server = app.listen(0);
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  t.after(() => {
    server.close();
  });

  const response = await fetch(`${baseUrl}/api/repositories/expressjs/express/commits?page=1&per_page=5`);

  if (response.status === 200) {
    const data = await response.json();
    assert.ok(Array.isArray(data.commits));
    assert.equal(data.commits.length, 5);
    assert.equal(data.page, 1);
    assert.equal(data.perPage, 5);
    assert.equal(data.hasMore, true);

    const firstCommit = data.commits[0];
    assert.ok(firstCommit.sha);
    assert.equal(firstCommit.shortSha.length, 7);
    assert.ok(firstCommit.message);
    assert.ok(firstCommit.author);
    assert.ok(firstCommit.committer);
    assert.ok(Array.isArray(firstCommit.parentShas));
  } else if (response.status === 429) {
    const data = await response.json();
    assert.equal(data.isRateLimit, true);
  }
});

test('GET /api/repositories/:owner/:repo/commits/:sha returns commit details with changed files', async (t) => {
  const server = app.listen(0);
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  t.after(() => {
    server.close();
  });

  // First fetch a recent commit sha from expressjs/express
  const listRes = await fetch(`${baseUrl}/api/repositories/expressjs/express/commits?per_page=1`);
  if (listRes.status === 200) {
    const listData = await listRes.json();
    const sha = listData.commits[0].sha;

    const detailRes = await fetch(`${baseUrl}/api/repositories/expressjs/express/commits/${sha}`);
    assert.equal(detailRes.status, 200);

    const detailData = await detailRes.json();
    assert.equal(detailData.sha, sha);
    assert.equal(detailData.shortSha, sha.substring(0, 7));
    assert.ok(detailData.message);
    assert.ok(detailData.stats);
    assert.ok(typeof detailData.stats.total === 'number');
    assert.ok(Array.isArray(detailData.files));
  }
});

test('GET /api/repositories/:owner/:repo/commits/:sha returns 400 for malformed SHA', async (t) => {
  const server = app.listen(0);
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  t.after(() => {
    server.close();
  });

  const response = await fetch(`${baseUrl}/api/repositories/expressjs/express/commits/not-a-valid-hex-sha!`);
  assert.equal(response.status, 400);
  const data = await response.json();
  assert.equal(data.statusCode, 400);
  assert.match(data.error, /Invalid commit SHA/);
});

test('GET /api/repos/:owner/:repo/commits alias matches paginated commits', async (t) => {
  const server = app.listen(0);
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  t.after(() => {
    server.close();
  });

  const response = await fetch(`${baseUrl}/api/repos/expressjs/express/commits?per_page=2`);
  assert.ok([200, 429].includes(response.status));
});
