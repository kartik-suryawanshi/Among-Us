import test from 'node:test';
import assert from 'node:assert/strict';
import app from '../src/app.js';

test('GET /api/repositories/:owner/:repo/frequent-files returns frequently changed files over bounded sample', async (t) => {
  const server = app.listen(0);
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  t.after(() => {
    server.close();
  });

  const response = await fetch(`${baseUrl}/api/repositories/expressjs/express/frequent-files?sample_commits=3&limit=5`);

  if (response.status === 200) {
    const data = await response.json();
    assert.equal(data.isSampled, true);
    assert.ok(typeof data.sampleCommits === 'number');
    assert.ok(typeof data.analyzedCommits === 'number');
    assert.ok(typeof data.totalUniqueFiles === 'number');
    assert.ok(data.note.includes('bounded sample'));
    assert.ok(Array.isArray(data.files));

    if (data.files.length > 0) {
      const topFile = data.files[0];
      assert.ok(topFile.filename);
      assert.ok(typeof topFile.modifications === 'number');
      assert.ok(topFile.modifications > 0);
      assert.ok(typeof topFile.changes === 'number');
    }
  } else if (response.status === 429) {
    const data = await response.json();
    assert.equal(data.isRateLimit, true);
  }
});

test('GET /api/repos/:owner/:repo/frequent-files alias matches frequent-files endpoint', async (t) => {
  const server = app.listen(0);
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  t.after(() => {
    server.close();
  });

  const response = await fetch(`${baseUrl}/api/repos/expressjs/express/frequent-files?sample_commits=2`);
  assert.ok([200, 429].includes(response.status));
});

test('GET /api/repositories/:owner/:repo/frequent-files returns 404 for nonexistent repository', async (t) => {
  const server = app.listen(0);
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  t.after(() => {
    server.close();
  });

  const response = await fetch(`${baseUrl}/api/repositories/nonexistent-org-998877/nonexistent-repo-112233/frequent-files`);
  if (response.status !== 429) {
    assert.equal(response.status, 404);
  }
});

test('GET /api/repositories/:owner/:repo/frequent-files returns 400 for invalid identifier', async (t) => {
  const server = app.listen(0);
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  t.after(() => {
    server.close();
  });

  const response = await fetch(`${baseUrl}/api/repositories/.invalid/repo/frequent-files`);
  assert.equal(response.status, 400);
});
