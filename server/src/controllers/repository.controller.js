import { githubService } from '../services/github.service.js';

/**
 * Controller to fetch repository overview metadata.
 * Uses validated parameters from req.repoTarget.
 */
export async function getRepository(req, res, next) {
  try {
    const { owner, repo } = req.repoTarget;
    const metadata = await githubService.getRepositoryMetadata(owner, repo);
    return res.status(200).json(metadata);
  } catch (err) {
    next(err);
  }
}
