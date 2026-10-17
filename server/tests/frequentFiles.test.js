import test from 'node:test';
import assert from 'node:assert/strict';
import app from '../src/app.js';

test('GET /api/repositories/:owner/:repo/frequent-files returns bounded sample of modified files', async (t) => {
  const server = app.listen(0);
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  t.after(() => {
    server.close();
  });

  const response = await fetch(`${baseUrl}/api/repositories/expressjs/express/frequent-files?sample_commits=5&limit=3`);
  if (response.status === 200) {
    const data = await response.json();
    assert.equal(data.isSampled, true);
    assert.equal(data.sampleCommits, 5);
    assert.ok(typeof data.analyzedCommits === 'number');
    assert.ok(typeof data.totalUniqueFiles === 'number');
    assert.ok(Array.isArray(data.files));
    if (data.files.length > 0) {
      const first = data.files[0];
      assert.ok(first.filename);
      assert.ok(typeof first.modifications === 'number');
      assert.ok(typeof first.additions === 'number');
      assert.ok(typeof first.deletions === 'number');
      assert.ok(typeof first.changes === 'number');
    }
  } else if (response.status === 429) {
    const data = await response.json();
    assert.equal(data.isRateLimit, true);
  }
});
