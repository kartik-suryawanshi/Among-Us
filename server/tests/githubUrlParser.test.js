import test from 'node:test';
import assert from 'node:assert/strict';
import { parseGitHubUrl, isValidOwner, isValidRepo } from '../src/utils/githubUrlParser.js';
import { validateRepoParams } from '../src/middleware/validateRepoParams.js';

test('parseGitHubUrl correctly parses standard HTTPS repository URL', () => {
  const result = parseGitHubUrl('https://github.com/expressjs/express');
  assert.deepEqual(result, {
    owner: 'expressjs',
    repo: 'express',
    fullName: 'expressjs/express',
  });
});

test('parseGitHubUrl correctly parses URL with www and trailing .git', () => {
  const result = parseGitHubUrl('https://www.github.com/facebook/react.git');
  assert.deepEqual(result, {
    owner: 'facebook',
    repo: 'react',
    fullName: 'facebook/react',
  });
});

test('parseGitHubUrl handles shorthand owner/repo input', () => {
  const result = parseGitHubUrl('torvalds/linux');
  assert.deepEqual(result, {
    owner: 'torvalds',
    repo: 'linux',
    fullName: 'torvalds/linux',
  });
});

test('parseGitHubUrl handles shorthand with .git', () => {
  const result = parseGitHubUrl('vercel/next.js.git');
  assert.deepEqual(result, {
    owner: 'vercel',
    repo: 'next.js',
    fullName: 'vercel/next.js',
  });
});

test('parseGitHubUrl handles URLs with query parameters and hash anchors', () => {
  const result = parseGitHubUrl('https://github.com/owner/repo?tab=readme-ov-file#installation');
  assert.deepEqual(result, {
    owner: 'owner',
    repo: 'repo',
    fullName: 'owner/repo',
  });
});

test('parseGitHubUrl rejects non-GitHub domains', () => {
  assert.throws(() => {
    parseGitHubUrl('https://gitlab.com/owner/repo');
  }, (err) => {
    assert.equal(err.statusCode, 400);
    assert.match(err.message, /Only public repositories on github.com are supported/);
    return true;
  });
});

test('parseGitHubUrl rejects incomplete or malformed URLs', () => {
  assert.throws(() => parseGitHubUrl('https://github.com/only-owner'), /GitHub URL must include both owner and repository name/);
  assert.throws(() => parseGitHubUrl(''), /cannot be empty/);
  assert.throws(() => parseGitHubUrl('invalid_string_without_slash'), /Expected format: owner\/repo/);
  assert.throws(() => parseGitHubUrl(null), /is required/);
});

test('isValidOwner and isValidRepo validate GitHub naming constraints', () => {
  assert.equal(isValidOwner('facebook'), true);
  assert.equal(isValidOwner('123org'), true);
  assert.equal(isValidOwner(''), false);
  assert.equal(isValidOwner('.'), false);
  assert.equal(isValidOwner('..'), false);
  assert.equal(isValidOwner('-invalid-start'), false);

  assert.equal(isValidRepo('react'), true);
  assert.equal(isValidRepo('next.js'), true);
  assert.equal(isValidRepo('my_awesome-repo.v2'), true);
  assert.equal(isValidRepo(''), false);
  assert.equal(isValidRepo('.'), false);
  assert.equal(isValidRepo('..'), false);
});

test('validateRepoParams middleware passes valid parameters and sets req.repoTarget', () => {
  const req = { params: { owner: 'expressjs', repo: 'express.git' } };
  let nextCalled = false;
  const res = {
    status() { return this; },
    json() { return this; },
  };

  validateRepoParams(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, true);
  assert.equal(req.params.repo, 'express');
  assert.deepEqual(req.repoTarget, {
    owner: 'expressjs',
    repo: 'express',
    fullName: 'expressjs/express',
  });
});

test('validateRepoParams middleware returns 400 on invalid owner or repo', () => {
  let status = null;
  let responseData = null;
  const req = { params: { owner: '..', repo: 'valid-repo' } };
  const res = {
    status(code) {
      status = code;
      return this;
    },
    json(data) {
      responseData = data;
      return this;
    },
  };

  validateRepoParams(req, res, () => {
    assert.fail('next() should not have been called');
  });

  assert.equal(status, 400);
  assert.equal(responseData.statusCode, 400);
  assert.match(responseData.error, /Invalid repository owner/);
});
