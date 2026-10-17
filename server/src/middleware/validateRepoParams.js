import { isValidOwner, isValidRepo } from '../utils/githubUrlParser.js';

/**
 * Express middleware to validate :owner and :repo route parameters.
 * Automatically cleans optional trailing .git in repo name and returns 400 Bad Request on invalid input.
 */
export function validateRepoParams(req, res, next) {
  let { owner, repo } = req.params;

  if (!owner || !isValidOwner(owner)) {
    return res.status(400).json({
      error: `Invalid repository owner identifier: '${owner || ''}'. Expected a valid GitHub username or organization name.`,
      statusCode: 400,
    });
  }

  // Strip trailing .git if provided in route param
  if (repo && repo.toLowerCase().endsWith('.git')) {
    repo = repo.slice(0, -4);
    req.params.repo = repo;
  }

  if (!repo || !isValidRepo(repo)) {
    return res.status(400).json({
      error: `Invalid repository name: '${repo || ''}'. Expected a valid GitHub repository name.`,
      statusCode: 400,
    });
  }

  req.repoTarget = {
    owner,
    repo,
    fullName: `${owner}/${repo}`,
  };

  next();
}
