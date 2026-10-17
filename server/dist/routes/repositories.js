"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.repositoriesRouter = void 0;
const express_1 = require("express");
const githubService_js_1 = require("../services/githubService.js");
const validators_js_1 = require("../utils/validators.js");
exports.repositoriesRouter = (0, express_1.Router)();
// GET /api/repositories/:owner/:repo
exports.repositoriesRouter.get('/:owner/:repo', async (req, res, next) => {
    try {
        const { owner, repo } = req.params;
        if (!(0, validators_js_1.isValidOwner)(owner) || !(0, validators_js_1.isValidRepo)(repo)) {
            res.status(400).json({
                error: 'Invalid repository identifier. Repository owner and name must follow GitHub naming rules.',
                statusCode: 400,
            });
            return;
        }
        const repository = await githubService_js_1.githubService.fetchRepository(owner, repo);
        res.status(200).json(repository);
    }
    catch (error) {
        if (error instanceof githubService_js_1.GitHubApiError) {
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
exports.repositoriesRouter.get('/:owner/:repo/commits', async (req, res, next) => {
    try {
        const { owner, repo } = req.params;
        if (!(0, validators_js_1.isValidOwner)(owner) || !(0, validators_js_1.isValidRepo)(repo)) {
            res.status(400).json({
                error: 'Invalid repository identifier. Repository owner and name must follow GitHub naming rules.',
                statusCode: 400,
            });
            return;
        }
        const { page, perPage } = (0, validators_js_1.parsePaginationParams)(req.query.page, req.query.per_page);
        const paginatedCommits = await githubService_js_1.githubService.fetchCommits(owner, repo, page, perPage);
        res.status(200).json(paginatedCommits);
    }
    catch (error) {
        if (error instanceof githubService_js_1.GitHubApiError) {
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
exports.repositoriesRouter.get('/:owner/:repo/commits/:sha', async (req, res, next) => {
    try {
        const { owner, repo, sha } = req.params;
        if (!(0, validators_js_1.isValidOwner)(owner) || !(0, validators_js_1.isValidRepo)(repo)) {
            res.status(400).json({
                error: 'Invalid repository identifier. Repository owner and name must follow GitHub naming rules.',
                statusCode: 400,
            });
            return;
        }
        if (!(0, validators_js_1.isValidSha)(sha)) {
            res.status(400).json({
                error: 'Invalid commit SHA format. Expected 7 to 40 hexadecimal characters.',
                statusCode: 400,
            });
            return;
        }
        const commitDetail = await githubService_js_1.githubService.fetchCommit(owner, repo, sha);
        res.status(200).json(commitDetail);
    }
    catch (error) {
        if (error instanceof githubService_js_1.GitHubApiError) {
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
