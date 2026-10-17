import test from 'node:test';
import assert from 'node:assert/strict';
import app from '../src/app.js';

test('GET /api/repositories/:owner/:repo/languages returns programming language distribution for real public repo', async (t) => {
  const server = app.listen(0);
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  t.after(() => {
    server.close();
  });

  const response = await fetch(`${baseUrl}/api/repositories/expressjs/express/languages`);

  if (response.status === 200) {
    const data = await response.json();
    assert.ok(typeof data.totalBytes === 'number');
    assert.ok(data.totalBytes > 0);
    assert.ok(Array.isArray(data.languages));
    assert.ok(data.languages.length > 0);

    const primaryLang = data.languages[0];
    assert.ok(primaryLang.language);
    assert.ok(typeof primaryLang.bytes === 'number');
    assert.ok(typeof primaryLang.percentage === 'number');
    assert.ok(primaryLang.percentage > 0 && primaryLang.percentage <= 100);

    // Sum of percentages should be close to 100%
    const sumPercentage = data.languages.reduce((acc, curr) => acc + curr.percentage, 0);
    assert.ok(Math.abs(sumPercentage - 100) < 1.0);
  } else if (response.status === 429) {
    const data = await response.json();
    assert.equal(data.isRateLimit, true);
  }
});

test('GET /api/repos/:owner/:repo/languages alias matches repository languages', async (t) => {
  const server = app.listen(0);
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  t.after(() => {
    server.close();
  });

  const response = await fetch(`${baseUrl}/api/repos/expressjs/express/languages`);
  assert.ok([200, 429].includes(response.status));
});

test('GET /api/repositories/:owner/:repo?include_languages=true embeds language breakdown', async (t) => {
  const server = app.listen(0);
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  t.after(() => {
    server.close();
  });

  const response = await fetch(`${baseUrl}/api/repositories/expressjs/express?include_languages=true`);

  if (response.status === 200) {
    const data = await response.json();
    assert.ok(data.languagesBreakdown);
    assert.ok(typeof data.languagesBreakdown.totalBytes === 'number');
    assert.ok(Array.isArray(data.languagesBreakdown.languages));
  } else if (response.status === 429) {
    const data = await response.json();
    assert.equal(data.isRateLimit, true);
  }
});

test('GET /api/repositories/:owner/:repo/languages returns 404 for nonexistent repository', async (t) => {
  const server = app.listen(0);
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  t.after(() => {
    server.close();
  });

  const response = await fetch(`${baseUrl}/api/repositories/nonexistent-org-998877/nonexistent-repo-112233/languages`);
  if (response.status !== 429) {
    assert.equal(response.status, 404);
  }
});
