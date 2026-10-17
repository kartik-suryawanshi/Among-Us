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
    assert.ok(data.period);
    assert.ok(typeof data.isSampled === 'boolean');
    assert.ok(typeof data.totalCommits === 'number');
    assert.ok(Array.isArray(data.weeklyTimeline));
    assert.ok(data.byDayOfWeek);

    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    days.forEach((day) => {
      assert.ok(typeof data.byDayOfWeek[day] === 'number');
    });
  } else if (response.status === 429) {
    const data = await response.json();
    assert.equal(data.isRateLimit, true);
  }
});

test('GET /api/repos/:owner/:repo/activity alias matches activity endpoint', async (t) => {
  const server = app.listen(0);
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  t.after(() => {
    server.close();
  });

  const response = await fetch(`${baseUrl}/api/repos/expressjs/express/activity`);
  assert.ok([200, 429].includes(response.status));
});

test('GET /api/repositories/:owner/:repo/activity returns 404 for nonexistent repository', async (t) => {
  const server = app.listen(0);
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  t.after(() => {
    server.close();
  });

  const response = await fetch(`${baseUrl}/api/repositories/nonexistent-org-998877/nonexistent-repo-112233/activity`);
  if (response.status !== 429) {
    assert.equal(response.status, 404);
  }
});

test('GET /api/repositories/:owner/:repo/activity returns 400 for invalid identifier', async (t) => {
  const server = app.listen(0);
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  t.after(() => {
    server.close();
  });

  const response = await fetch(`${baseUrl}/api/repositories/.invalid/repo/activity`);
  assert.equal(response.status, 400);
});

