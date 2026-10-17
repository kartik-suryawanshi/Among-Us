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

