import { githubService } from '../services/github.service.js';

/**
 * Controller to fetch repository overview metadata.
 * Uses validated parameters from req.repoTarget.
 */
export async function getRepository(req, res, next) {
  try {
    const { owner, repo } = req.repoTarget;
    const metadata = await githubService.getRepositoryMetadata(owner, repo);

    // If query includes languages=true, attach languages breakdown
    if (req.query.include_languages === 'true' || req.query.languages === 'true') {
      const languages = await githubService.getLanguageStatistics(owner, repo);
      metadata.languagesBreakdown = languages;
    }

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
    const { owner, repo } = req.repoTarget;
    const languages = await githubService.getLanguageStatistics(owner, repo);
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
    const { owner, repo } = req.repoTarget;
    const { page, per_page } = req.query;
    const result = await githubService.getCommits(owner, repo, { page, perPage: per_page });
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
    const { owner, repo } = req.repoTarget;
    const { sha } = req.params;

    if (!sha || !/^[a-fA-F0-9]{4,40}$/.test(sha)) {
      return res.status(400).json({
        error: `Invalid commit SHA '${sha || ''}'. Must be 4 to 40 hexadecimal characters.`,
        statusCode: 400,
      });
    }

    const detail = await githubService.getCommitDetail(owner, repo, sha);
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
    const { owner, repo } = req.repoTarget;
    const contributors = await githubService.getContributors(owner, repo);
    return res.status(200).json(contributors);
  } catch (err) {
    next(err);
  }
}

/**
 * Controller to fetch frequently changed files (code churn hotspots).
 */
export async function getFileHotspots(req, res, next) {
  try {
    const { owner, repo } = req.repoTarget;
    const limit = parseInt(req.query.limit || '15', 10);
    const hotspots = await githubService.getFileHotspots(owner, repo, limit);
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
    const { owner, repo } = req.repoTarget;
    const activity = await githubService.getActivity(owner, repo);
    return res.status(200).json(activity);
  } catch (err) {
    next(err);
  }
}

/**
 * Controller to fetch frequently changed files with additions/deletions (Task 4).
 */
export async function getFrequentFiles(req, res, next) {
  try {
    const { owner, repo } = req.repoTarget;
    const sampleCommits = parseInt(req.query.sample_commits || '20', 10);
    const limit = parseInt(req.query.limit || '10', 10);
    const frequentFiles = await githubService.getFrequentFiles(owner, repo, sampleCommits, limit);
    return res.status(200).json(frequentFiles);
  } catch (err) {
    next(err);
  }
}



