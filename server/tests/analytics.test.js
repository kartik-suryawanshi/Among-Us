import test from 'node:test';
import assert from 'node:assert/strict';
import app from '../src/app.js';
import { githubService } from '../src/services/github.service.js';

test('GET /api/repositories/:owner/:repo/analytics returns unified analytics bundle', async (t) => {
  const server = app.listen(0);
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  t.after(() => {
    server.close();
  });

  const response = await fetch(`${baseUrl}/api/repositories/expressjs/express/analytics`);

  if (response.status === 200) {
    const data = await response.json();
    assert.ok(data.repository, 'Should have repository metadata');
    assert.equal(data.repository.name, 'express');
    assert.ok(data.languages, 'Should have languages data');
    assert.ok(Array.isArray(data.languages.languages), 'languages.languages should be an array');
    assert.ok(data.commitActivity, 'Should have commitActivity');
    assert.ok(Array.isArray(data.commitActivity.weeklyTimeline), 'commitActivity.weeklyTimeline should be an array');
    assert.ok(data.contributors, 'Should have contributors');
    assert.ok(Array.isArray(data.contributors.contributors), 'contributors.contributors should be an array');
    assert.ok(Array.isArray(data.recentCommits), 'recentCommits should be an array');
    assert.ok(data.frequentlyChangedFiles, 'Should have frequentlyChangedFiles');
    assert.ok(Array.isArray(data.frequentlyChangedFiles.files), 'frequentlyChangedFiles.files should be an array');
    assert.equal(typeof data.isPartial, 'boolean', 'isPartial should be a boolean');
    assert.ok(Array.isArray(data.warnings), 'warnings should be an array');
    assert.ok(data.generatedAt, 'generatedAt should be present');

    // Check X-Cache header is present
    const xCache = response.headers.get('x-cache');
    assert.ok(['HIT', 'MISS'].includes(xCache), 'Should include X-Cache header');

    // Second request should be a cache HIT
    const secondResponse = await fetch(`${baseUrl}/api/repositories/expressjs/express/analytics`);
    if (secondResponse.status === 200) {
      assert.equal(secondResponse.headers.get('x-cache'), 'HIT');
    }
  } else if (response.status === 429) {
    const data = await response.json();
    assert.equal(data.isRateLimit, true);
  }
});

test('GET /api/repos/:owner/:repo/analytics alias matches repository analytics', async (t) => {
  const server = app.listen(0);
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  t.after(() => {
    server.close();
  });

  const response = await fetch(`${baseUrl}/api/repos/expressjs/express/analytics`);
  assert.ok([200, 429].includes(response.status));
});

test('GET /api/repositories/:owner/:repo/analytics returns 404 for nonexistent repository', async (t) => {
  const server = app.listen(0);
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  t.after(() => {
    server.close();
  });

  const response = await fetch(`${baseUrl}/api/repositories/nonexistent-org-998877/nonexistent-repo-112233/analytics`);
  if (response.status !== 429) {
    assert.equal(response.status, 404);
  }
});

test('GET /api/repositories/:owner/:repo/analytics returns 400 for invalid identifier', async (t) => {
  const server = app.listen(0);
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  t.after(() => {
    server.close();
  });

  const response = await fetch(`${baseUrl}/api/repositories/inva..lid/repo!/analytics`);
  assert.equal(response.status, 400);
});

test('getCompleteAnalytics gracefully handles partial secondary failures with isPartial and warnings', async () => {
  const originalGetMeta = githubService.getRepositoryMetadata;
  const originalGetActivity = githubService.getActivity;
  const originalGetLanguages = githubService.getLanguageStatistics;
  const originalGetContributors = githubService.getContributors;
  const originalGetCommits = githubService.getCommits;
  const originalGetFrequentFiles = githubService.getFrequentFiles;

  try {
    githubService.getRepositoryMetadata = async () => ({
      name: 'express',
      fullName: 'expressjs/express',
      owner: { login: 'expressjs' },
      isMock: true,
    });
    githubService.getLanguageStatistics = async () => ({
      totalBytes: 1000,
      languages: [{ name: 'JavaScript', bytes: 1000, percentage: 100 }],
    });
    githubService.getActivity = async () => {
      throw new Error('Simulated upstream stats timeout');
    };
    githubService.getContributors = async () => ({
      totalContributors: 5,
      contributors: [],
    });
    githubService.getCommits = async () => ({
      commits: [],
      pagination: {},
    });
    githubService.getFrequentFiles = async () => ({
      isSampled: true,
      sampleCommits: 20,
      analyzedCommits: 20,
      totalUniqueFiles: 2,
      files: [],
    });

    const bundle = await githubService.getCompleteAnalytics('expressjs', 'express');
    assert.ok(bundle.repository);
    assert.equal(bundle.isPartial, true);
    assert.ok(bundle.warnings.some((w) => w.includes('Commit activity unavailable')));
    assert.ok(Array.isArray(bundle.commitActivity.weeklyTimeline));
    assert.equal(bundle.commitActivity.period, 'unavailable');
  } finally {
    githubService.getRepositoryMetadata = originalGetMeta;
    githubService.getActivity = originalGetActivity;
    githubService.getLanguageStatistics = originalGetLanguages;
    githubService.getContributors = originalGetContributors;
    githubService.getCommits = originalGetCommits;
    githubService.getFrequentFiles = originalGetFrequentFiles;
  }
});

