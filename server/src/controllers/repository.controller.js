import { githubService } from '../services/github.service.js';
import { repositoryPersistenceService } from '../services/repositoryPersistence.service.js';
import { getCache, setCache, buildCacheKey } from '../cache/redis.js';

/**
 * Controller to fetch repository overview metadata.
 * Uses validated parameters from req.repoTarget with Redis caching.
 */
export async function getRepository(req, res, next) {
  try {
    const { owner, repo, fullName } = req.repoTarget;
    const includeLanguages = req.query.include_languages === 'true' || req.query.languages === 'true';
    const cacheKey = buildCacheKey('metadata', fullName, includeLanguages ? 'with-lang' : 'standard');

    // 1. Check Redis Cache
    const cached = await getCache(cacheKey);
    if (cached) {
      res.setHeader('X-Cache', 'HIT');
      return res.status(200).json(cached);
    }

    // 2. Fetch from GitHub REST API
    const metadata = await githubService.getRepositoryMetadata(owner, repo);

    // If query includes languages=true, attach languages breakdown
    if (includeLanguages) {
      const languages = await githubService.getLanguageStatistics(owner, repo);
      metadata.languagesBreakdown = languages;
    }

    // 3. Persist to PostgreSQL asynchronously in actual data flow
    repositoryPersistenceService.upsertRepository(metadata).catch(() => {});

    // 4. Cache in Redis (default 300s TTL)
    await setCache(cacheKey, metadata);

    res.setHeader('X-Cache', 'MISS');
    return res.status(200).json(metadata);
  } catch (err) {
    next(err);
  }
}

/**
 * Controller to fetch programming language distribution for a repository.
 */
export async function getLanguages(req, res, next) {
  try {
    const { owner, repo, fullName } = req.repoTarget;
    const cacheKey = buildCacheKey('languages', fullName);

    const cached = await getCache(cacheKey);
    if (cached) {
      res.setHeader('X-Cache', 'HIT');
      return res.status(200).json(cached);
    }

    const languages = await githubService.getLanguageStatistics(owner, repo);

    // Persist snapshot to PostgreSQL in actual data flow
    repositoryPersistenceService
      .saveAnalyticsSnapshot(fullName, 'languages', languages)
      .catch(() => {});

    await setCache(cacheKey, languages);

    res.setHeader('X-Cache', 'MISS');
    return res.status(200).json(languages);
  } catch (err) {
    next(err);
  }
}

/**
 * Controller to fetch paginated commits list.
 */
export async function getCommits(req, res, next) {
  try {
    const { owner, repo, fullName } = req.repoTarget;
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const perPage = Math.min(100, Math.max(1, parseInt(req.query.per_page || '20', 10)));
    const cacheKey = buildCacheKey('commits', fullName, page, perPage);

    const cached = await getCache(cacheKey);
    if (cached) {
      res.setHeader('X-Cache', 'HIT');
      return res.status(200).json(cached);
    }

    const result = await githubService.getCommits(owner, repo, { page, perPage });

    // Cache commits for shorter TTL (60s) since commits update frequently
    await setCache(cacheKey, result, 60);

    res.setHeader('X-Cache', 'MISS');
    return res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

/**
 * Controller to fetch details for a specific commit by SHA.
 */
export async function getCommitDetail(req, res, next) {
  try {
    const { owner, repo, fullName } = req.repoTarget;
    const { sha } = req.params;

    if (!sha || !/^[a-fA-F0-9]{4,40}$/.test(sha)) {
      return res.status(400).json({
        error: `Invalid commit SHA '${sha || ''}'. Must be 4 to 40 hexadecimal characters.`,
        statusCode: 400,
      });
    }

    const cacheKey = buildCacheKey('commit-detail', fullName, sha);
    const cached = await getCache(cacheKey);
    if (cached) {
      res.setHeader('X-Cache', 'HIT');
      return res.status(200).json(cached);
    }

    const detail = await githubService.getCommitDetail(owner, repo, sha);

    // Commit details are immutable by SHA: can be safely cached for long TTL
    await setCache(cacheKey, detail, 3600);

    res.setHeader('X-Cache', 'MISS');
    return res.status(200).json(detail);
  } catch (err) {
    next(err);
  }
}

/**
 * Controller to fetch contributor statistics for a repository.
 */
export async function getContributors(req, res, next) {
  try {
    const { owner, repo, fullName } = req.repoTarget;
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || '30', 10)));
    const anon = req.query.anon === 'false' ? false : true;
    const cacheKey = buildCacheKey('contributors', fullName, limit, anon ? 'anon' : 'noanon');

    const cached = await getCache(cacheKey);
    if (cached) {
      res.setHeader('X-Cache', 'HIT');
      return res.status(200).json(cached);
    }

    const result = await githubService.getContributors(owner, repo, { limit, anon });

    // Persist snapshot to PostgreSQL in actual data flow
    repositoryPersistenceService
      .saveAnalyticsSnapshot(fullName, 'contributors', result)
      .catch(() => {});

    await setCache(cacheKey, result);

    res.setHeader('X-Cache', 'MISS');
    return res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

/**
 * Controller to fetch frequently changed files (code churn hotspots).
 */
export async function getFileHotspots(req, res, next) {
  try {
    const { owner, repo, fullName } = req.repoTarget;
    const limit = parseInt(req.query.limit || '15', 10);
    const cacheKey = buildCacheKey('hotspots', fullName, limit);

    const cached = await getCache(cacheKey);
    if (cached) {
      res.setHeader('X-Cache', 'HIT');
      return res.status(200).json(cached);
    }

    const hotspots = await githubService.getFileHotspots(owner, repo, limit);

    await setCache(cacheKey, hotspots);

    res.setHeader('X-Cache', 'MISS');
    return res.status(200).json(hotspots);
  } catch (err) {
    next(err);
  }
}

/**
 * Controller to fetch commit velocity timeline and day-of-week distribution (Task 3).
 */
export async function getActivity(req, res, next) {
  try {
    const { owner, repo, fullName } = req.repoTarget;
    const cacheKey = buildCacheKey('activity', fullName);

    const cached = await getCache(cacheKey);
    if (cached) {
      res.setHeader('X-Cache', 'HIT');
      return res.status(200).json(cached);
    }

    const activity = await githubService.getActivity(owner, repo);

    // Persist snapshot to PostgreSQL in actual data flow
    repositoryPersistenceService
      .saveAnalyticsSnapshot(fullName, 'activity', activity)
      .catch(() => {});

    await setCache(cacheKey, activity);

    res.setHeader('X-Cache', 'MISS');
    return res.status(200).json(activity);
  } catch (err) {
    next(err);
  }
}

export const getCommitActivity = getActivity;

/**
 * Controller to fetch frequently changed files with additions/deletions (Task 4).
 */
export async function getFrequentFiles(req, res, next) {
  try {
    const { owner, repo, fullName } = req.repoTarget;
    const sampleCommits = parseInt(req.query.sample_commits || '20', 10);
    const limit = parseInt(req.query.limit || '10', 10);
    const cacheKey = buildCacheKey('frequent-files', fullName, sampleCommits, limit);

    const cached = await getCache(cacheKey);
    if (cached) {
      res.setHeader('X-Cache', 'HIT');
      return res.status(200).json(cached);
    }

    const frequentFiles = await githubService.getFrequentFiles(owner, repo, sampleCommits, limit);

    // Persist snapshot to PostgreSQL in actual data flow
    repositoryPersistenceService
      .saveAnalyticsSnapshot(fullName, 'frequent_files', frequentFiles)
      .catch(() => {});

    await setCache(cacheKey, frequentFiles);

    res.setHeader('X-Cache', 'MISS');
    return res.status(200).json(frequentFiles);
  } catch (err) {
    next(err);
  }
}

export const getFrequentlyChangedFiles = getFrequentFiles;

/**
 * Controller to fetch unified repository analytics bundle (Stage 12).
 * Aggregates metadata, languages, activity timeline, contributors, recent commits, and frequent files.
 * Supports Redis caching and PostgreSQL snapshot persistence.
 */
export async function getAnalytics(req, res, next) {
  try {
    const { owner, repo, fullName } = req.repoTarget;
    const cacheKey = buildCacheKey('analytics', fullName);

    // 1. Check Redis Cache
    const cached = await getCache(cacheKey);
    if (cached) {
      res.setHeader('X-Cache', 'HIT');
      return res.status(200).json(cached);
    }

    // 2. Aggregate analytics bundle from GitHub
    const analytics = await githubService.getCompleteAnalytics(owner, repo);

    // 3. Persist to PostgreSQL asynchronously
    if (analytics.repository) {
      repositoryPersistenceService.upsertRepository(analytics.repository).catch(() => {});
    }
    repositoryPersistenceService
      .saveAnalyticsSnapshot(fullName, 'full_analytics', analytics)
      .catch(() => {});

    // 4. Cache in Redis (300s TTL)
    await setCache(cacheKey, analytics, 300);

    res.setHeader('X-Cache', 'MISS');
    return res.status(200).json(analytics);
  } catch (err) {
    next(err);
  }
}

export const getCompleteAnalytics = getAnalytics;




