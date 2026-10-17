/**
 * GitHub REST API Service
 * Handles authenticated or unauthenticated communication with GitHub API
 * Includes rate-limit detection, timeouts, and error normalization.
 */

const GITHUB_API_BASE_URL = 'https://api.github.com';

export class GitHubService {
  constructor(options = {}) {
    this.token = options.token || process.env.GITHUB_TOKEN || '';
    this.timeoutMs = parseInt(options.timeoutMs || process.env.GITHUB_API_TIMEOUT_MS || '10000', 10);
  }

  /**
   * Helper to build standard GitHub request headers
   */
  _buildHeaders() {
    const headers = {
      Accept: 'application/vnd.github.v3+json',
      'User-Agent': 'GitStory-Visual-Repository-Explorer',
    };

    if (this.token && this.token.trim()) {
      headers.Authorization = `Bearer ${this.token.trim()}`;
    }

    return headers;
  }

  /**
   * Safe fetch with timeout and rate-limit parsing
   */
  async _fetchFromGitHub(endpoint) {
    const url = `${GITHUB_API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(url, {
        headers: this._buildHeaders(),
        signal: controller.signal,
      });

      // Handle Rate Limiting
      const remaining = response.headers.get('x-ratelimit-remaining');
      const reset = response.headers.get('x-ratelimit-reset');

      if (response.status === 403 || response.status === 429) {
        if (remaining === '0') {
          const resetDate = reset ? new Date(parseInt(reset, 10) * 1000).toISOString() : undefined;
          const error = new Error('GitHub API rate limit exceeded. Please try again later or configure a GITHUB_TOKEN.');
          error.statusCode = 429;
          error.isRateLimit = true;
          error.resetAt = resetDate;
          throw error;
        }
      }

      if (response.status === 404) {
        const error = new Error('The requested GitHub repository was not found or is private.');
        error.statusCode = 404;
        throw error;
      }

      if (!response.ok) {
        let errorMsg = `GitHub API request failed with HTTP ${response.status}`;
        try {
          const errorData = await response.json();
          if (errorData.message) errorMsg = errorData.message;
        } catch {
          // ignore json parse error on failure
        }
        const error = new Error(errorMsg);
        error.statusCode = response.status;
        throw error;
      }

      return await response.json();
    } catch (err) {
      if (err.name === 'AbortError') {
        const error = new Error(`GitHub API request timed out after ${this.timeoutMs}ms.`);
        error.statusCode = 504;
        throw error;
      }
      throw err;
    } finally {
      clearTimeout(timer);
    }
  }

  /**
   * Retrieves repository metadata and formats it for GitStory frontend
   * Matches frontend Repository interface exactly.
   * 
   * @param {string} owner
   * @param {string} repo
   * @returns {Promise<object>}
   */
  async getRepositoryMetadata(owner, repo) {
    const raw = await this._fetchFromGitHub(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`);

    return {
      id: raw.id,
      name: raw.name,
      fullName: raw.full_name,
      owner: {
        login: raw.owner?.login || owner,
        avatarUrl: raw.owner?.avatar_url || '',
        htmlUrl: raw.owner?.html_url || `https://github.com/${owner}`,
      },
      htmlUrl: raw.html_url,
      description: raw.description || null,
      isFork: Boolean(raw.fork),
      createdAt: raw.created_at,
      updatedAt: raw.updated_at,
      pushedAt: raw.pushed_at,
      starsCount: raw.stargazers_count || 0,
      forksCount: raw.forks_count || 0,
      openIssuesCount: raw.open_issues_count || 0,
      language: raw.language || null,
      defaultBranch: raw.default_branch || 'main',
      topics: Array.isArray(raw.topics) ? raw.topics : [],
    };
  }

  /**
   * Retrieves programming language breakdown and calculates distribution percentages.
   * 
   * @param {string} owner
   * @param {string} repo
   * @returns {Promise<{ totalBytes: number, languages: Array<{ language: string, bytes: number, percentage: number }>, raw: object }>}
   */
  async getLanguageStatistics(owner, repo) {
    const raw = await this._fetchFromGitHub(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/languages`);

    const totalBytes = Object.values(raw).reduce((sum, bytes) => sum + Number(bytes), 0);

    const languages = Object.entries(raw)
      .map(([language, bytes]) => ({
        language,
        bytes: Number(bytes),
        percentage: totalBytes > 0 ? Number(((Number(bytes) / totalBytes) * 100).toFixed(2)) : 0,
      }))
      .sort((a, b) => b.bytes - a.bytes);

    return {
      totalBytes,
      languages,
      raw,
    };
  }
}

export const githubService = new GitHubService();
