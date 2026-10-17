import { Router, Request, Response, NextFunction } from 'express';
import { githubService, GitHubApiError } from '../services/githubService.js';
import { isValidOwner, isValidRepo, isValidSha, parsePaginationParams } from '../utils/validators.js';

export const repositoriesRouter = Router();

// GET /api/repositories/:owner/:repo
repositoriesRouter.get('/:owner/:repo', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { owner, repo } = req.params;

    if (!isValidOwner(owner) || !isValidRepo(repo)) {
      res.status(400).json({
        error: 'Invalid repository identifier. Repository owner and name must follow GitHub naming rules.',
        statusCode: 400,
      });
      return;
    }

    const repository = await githubService.fetchRepository(owner, repo);
    res.status(200).json(repository);
  } catch (error) {
    if (error instanceof GitHubApiError) {
      res.status(error.statusCode).json({
        error: error.message,
        statusCode: error.statusCode,
        isRateLimit: error.isRateLimit,
        resetAt: error.rateLimitReset,
      });
      return;
    }
    next(error);
  }
});

// GET /api/repositories/:owner/:repo/commits
repositoriesRouter.get('/:owner/:repo/commits', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { owner, repo } = req.params;

    if (!isValidOwner(owner) || !isValidRepo(repo)) {
      res.status(400).json({
        error: 'Invalid repository identifier. Repository owner and name must follow GitHub naming rules.',
        statusCode: 400,
      });
      return;
    }

    const { page, perPage } = parsePaginationParams(req.query.page, req.query.per_page);

    const paginatedCommits = await githubService.fetchCommits(owner, repo, page, perPage);
    res.status(200).json(paginatedCommits);
  } catch (error) {
    if (error instanceof GitHubApiError) {
      res.status(error.statusCode).json({
        error: error.message,
        statusCode: error.statusCode,
        isRateLimit: error.isRateLimit,
        resetAt: error.rateLimitReset,
      });
      return;
    }
    next(error);
  }
});

// GET /api/repositories/:owner/:repo/commits/:sha
repositoriesRouter.get('/:owner/:repo/commits/:sha', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { owner, repo, sha } = req.params;

    if (!isValidOwner(owner) || !isValidRepo(repo)) {
      res.status(400).json({
        error: 'Invalid repository identifier. Repository owner and name must follow GitHub naming rules.',
        statusCode: 400,
      });
      return;
    }

    if (!isValidSha(sha)) {
      res.status(400).json({
        error: 'Invalid commit SHA format. Expected 7 to 40 hexadecimal characters.',
        statusCode: 400,
      });
      return;
    }

    const commitDetail = await githubService.fetchCommit(owner, repo, sha);
    res.status(200).json(commitDetail);
  } catch (error) {
    if (error instanceof GitHubApiError) {
      res.status(error.statusCode).json({
        error: error.message,
        statusCode: error.statusCode,
        isRateLimit: error.isRateLimit,
        resetAt: error.rateLimitReset,
      });
      return;
    }
    next(error);
  }
});
