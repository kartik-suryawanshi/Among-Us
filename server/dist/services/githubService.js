"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.githubService = exports.GitHubApiError = void 0;
const axios_1 = __importDefault(require("axios"));
class GitHubApiError extends Error {
    statusCode;
    isRateLimit;
    rateLimitReset;
    constructor(message, statusCode = 500, isRateLimit = false, rateLimitReset) {
        super(message);
        this.name = 'GitHubApiError';
        this.statusCode = statusCode;
        this.isRateLimit = isRateLimit;
        this.rateLimitReset = rateLimitReset;
    }
}
exports.GitHubApiError = GitHubApiError;
class GitHubService {
    client;
    constructor() {
        const headers = {
            Accept: 'application/vnd.github.v3+json',
            'User-Agent': 'GitStory-Explorer-v1.0',
        };
        const token = process.env.GITHUB_TOKEN?.trim();
        if (token) {
            headers.Authorization = `Bearer ${token}`;
        }
        this.client = axios_1.default.create({
            baseURL: 'https://api.github.com',
            headers,
            timeout: 10000,
        });
    }
    handleError(error, resourceName) {
        if (axios_1.default.isAxiosError(error)) {
            const axiosError = error;
            const status = axiosError.response?.status;
            const headers = axiosError.response?.headers;
            if (axiosError.code === 'ECONNABORTED' || axiosError.message.includes('timeout')) {
                throw new GitHubApiError('GitHub API request timed out after 10 seconds. Please try again.', 504);
            }
            if (status === 403) {
                const remaining = headers?.['x-ratelimit-remaining'];
                const resetHeader = headers?.['x-ratelimit-reset'];
                let resetDate;
                if (resetHeader) {
                    resetDate = new Date(Number(resetHeader) * 1000);
                }
                if (remaining === '0') {
                    const resetMsg = resetDate ? ` Rate limit resets at ${resetDate.toLocaleTimeString()}.` : '';
                    throw new GitHubApiError(`GitHub API rate limit exceeded for unauthenticated requests.${resetMsg} Set GITHUB_TOKEN on the server for higher limits.`, 429, true, resetDate);
                }
                throw new GitHubApiError(axiosError.response?.data?.message || 'Access to this GitHub resource is forbidden.', 403);
            }
            if (status === 404) {
                throw new GitHubApiError(`${resourceName} was not found on GitHub. Verify the owner and repository name, and ensure it is public.`, 404);
            }
            if (status === 422) {
                throw new GitHubApiError(axiosError.response?.data?.message || 'GitHub could not process the request with the provided parameters.', 422);
            }
            if (status && status >= 500) {
                throw new GitHubApiError('GitHub is currently experiencing an internal error. Please try again later.', 502);
            }
            throw new GitHubApiError(axiosError.response?.data?.message || axiosError.message || 'Failed to communicate with GitHub API.', status || 500);
        }
        throw new GitHubApiError(error instanceof Error ? error.message : 'An unexpected error occurred while communicating with GitHub.', 500);
    }
    async fetchRepository(owner, repo) {
        try {
            const response = await this.client.get(`/repos/${owner}/${repo}`);
            const data = response.data;
            const normalized = {
                id: data.id,
                name: data.name,
                fullName: data.full_name,
                owner: {
                    login: data.owner.login,
                    avatarUrl: data.owner.avatar_url,
                    htmlUrl: data.owner.html_url,
                },
                htmlUrl: data.html_url,
                description: data.description ?? null,
                isFork: data.fork,
                createdAt: data.created_at,
                updatedAt: data.updated_at,
                pushedAt: data.pushed_at,
                starsCount: data.stargazers_count,
                forksCount: data.forks_count,
                openIssuesCount: data.open_issues_count,
                language: data.language ?? null,
                defaultBranch: data.default_branch || 'main',
                topics: Array.isArray(data.topics) ? data.topics : [],
            };
            return normalized;
        }
        catch (error) {
            this.handleError(error, `Repository '${owner}/${repo}'`);
        }
    }
    async fetchCommits(owner, repo, page, perPage) {
        try {
            const response = await this.client.get(`/repos/${owner}/${repo}/commits`, {
                params: {
                    page,
                    per_page: perPage,
                },
            });
            const rawCommits = Array.isArray(response.data) ? response.data : [];
            const linkHeader = response.headers?.link || '';
            const hasMoreFromLink = typeof linkHeader === 'string' && linkHeader.includes('rel="next"');
            // If no link header, fallback to checking if we received exactly perPage items
            const hasMore = hasMoreFromLink || rawCommits.length === perPage;
            const commits = rawCommits.map((item) => ({
                sha: item.sha,
                shortSha: item.sha.substring(0, 7),
                message: item.commit?.message?.trim() || '(No commit message provided)',
                author: {
                    name: item.commit?.author?.name ?? item.author?.login ?? null,
                    email: item.commit?.author?.email ?? null,
                    date: item.commit?.author?.date ?? null,
                    login: item.author?.login ?? null,
                    avatarUrl: item.author?.avatar_url ?? null,
                    htmlUrl: item.author?.html_url ?? null,
                },
                committer: {
                    name: item.commit?.committer?.name ?? item.committer?.login ?? null,
                    email: item.commit?.committer?.email ?? null,
                    date: item.commit?.committer?.date ?? null,
                    login: item.committer?.login ?? null,
                    avatarUrl: item.committer?.avatar_url ?? null,
                    htmlUrl: item.committer?.html_url ?? null,
                },
                htmlUrl: item.html_url,
                parentShas: Array.isArray(item.parents) ? item.parents.map((p) => p.sha) : [],
            }));
            return {
                commits,
                page,
                perPage,
                hasMore,
            };
        }
        catch (error) {
            this.handleError(error, `Commit history for '${owner}/${repo}'`);
        }
    }
    async fetchCommit(owner, repo, sha) {
        try {
            const response = await this.client.get(`/repos/${owner}/${repo}/commits/${sha}`);
            const item = response.data;
            const normalized = {
                sha: item.sha,
                shortSha: item.sha.substring(0, 7),
                message: item.commit?.message?.trim() || '(No commit message provided)',
                author: {
                    name: item.commit?.author?.name ?? item.author?.login ?? null,
                    email: item.commit?.author?.email ?? null,
                    date: item.commit?.author?.date ?? null,
                    login: item.author?.login ?? null,
                    avatarUrl: item.author?.avatar_url ?? null,
                    htmlUrl: item.author?.html_url ?? null,
                },
                committer: {
                    name: item.commit?.committer?.name ?? item.committer?.login ?? null,
                    email: item.commit?.committer?.email ?? null,
                    date: item.commit?.committer?.date ?? null,
                    login: item.committer?.login ?? null,
                    avatarUrl: item.committer?.avatar_url ?? null,
                    htmlUrl: item.committer?.html_url ?? null,
                },
                htmlUrl: item.html_url,
                parentShas: Array.isArray(item.parents) ? item.parents.map((p) => p.sha) : [],
                stats: item.stats
                    ? {
                        total: item.stats.total ?? 0,
                        additions: item.stats.additions ?? 0,
                        deletions: item.stats.deletions ?? 0,
                    }
                    : null,
                files: Array.isArray(item.files)
                    ? item.files.map((file) => ({
                        filename: file.filename,
                        status: file.status,
                        additions: file.additions ?? 0,
                        deletions: file.deletions ?? 0,
                        changes: file.changes ?? 0,
                        rawUrl: file.raw_url,
                        patch: file.patch,
                        previousFilename: file.previous_filename,
                    }))
                    : [],
            };
            return normalized;
        }
        catch (error) {
            this.handleError(error, `Commit '${sha}' in '${owner}/${repo}'`);
        }
    }
}
exports.githubService = new GitHubService();
