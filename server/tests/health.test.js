import test from 'node:test';
import assert from 'node:assert/strict';
import app from '../src/app.js';

test('GET /api/health returns status ok', async (t) => {
  const server = app.listen(0);
  const address = server.address();
  const port = address.port;
  const baseUrl = `http://127.0.0.1:${port}`;

  t.after(() => {
    server.close();
  });

  const response = await fetch(`${baseUrl}/api/health`);
  assert.equal(response.status, 200);

  const data = await response.json();
  assert.equal(data.status, 'ok');
  assert.equal(data.service, 'gitstory-api');
  assert.ok(data.timestamp);
});

test('GET /health alias returns status ok', async (t) => {
  const server = app.listen(0);
  const address = server.address();
  const port = address.port;
  const baseUrl = `http://127.0.0.1:${port}`;

  t.after(() => {
    server.close();
  });

  const response = await fetch(`${baseUrl}/health`);
  assert.equal(response.status, 200);

  const data = await response.json();
  assert.equal(data.status, 'ok');
});

test('GET /unknown-route returns 404 with standard error format', async (t) => {
  const server = app.listen(0);
  const address = server.address();
  const port = address.port;
  const baseUrl = `http://127.0.0.1:${port}`;

  t.after(() => {
    server.close();
  });

  const response = await fetch(`${baseUrl}/unknown-route`);
  assert.equal(response.status, 404);

  const data = await response.json();
  assert.equal(data.statusCode, 404);
  assert.ok(data.error.includes('Resource not found'));
});
