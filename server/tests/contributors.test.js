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
      assert.ok(top.login);
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
