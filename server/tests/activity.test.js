import test from 'node:test';
import assert from 'node:assert/strict';
import app from '../src/app.js';

test('GET /api/repositories/:owner/:repo/activity returns 52-week activity and day-of-week breakdown', async (t) => {
  const server = app.listen(0);
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  t.after(() => {
    server.close();
  });

  const response = await fetch(`${baseUrl}/api/repositories/expressjs/express/activity`);
  if (response.status === 200) {
    const data = await response.json();
    assert.equal(data.period, 'last_52_weeks');
    assert.ok(typeof data.totalCommits === 'number');
    assert.ok(Array.isArray(data.weeklyTimeline));
    assert.ok(data.byDayOfWeek);
    assert.ok(typeof data.byDayOfWeek.Monday === 'number');
    assert.ok(typeof data.byDayOfWeek.Sunday === 'number');
  } else if (response.status === 429) {
    const data = await response.json();
    assert.equal(data.isRateLimit, true);
  }
});
