import 'dotenv/config';

/**
 * GitHub REST API Service
 * Handles authenticated or unauthenticated communication with GitHub API
 * Includes rate-limit detection, timeouts, and error normalization.
 */

const GITHUB_API_BASE_URL = 'https://api.github.com';

export class GitHubService {
  constructor(options = {}) {
    this.token = options.token || '';
    this.timeoutMs = parseInt(options.timeoutMs || process.env.GITHUB_API_TIMEOUT_MS || '10000', 10);
  }

  /**
   * Helper to build standard GitHub request headers
   */
  _buildHeaders() {
    const token = (this.token || process.env.GITHUB_TOKEN || '').trim();
    const headers = {
      Accept: 'application/vnd.github.v3+json',
      'User-Agent': 'GitStory-Visual-Repository-Explorer',
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
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

  /**
   * Retrieves paginated commit list from the default branch.
   * Formats output to match PaginatedCommits interface expected by frontend.
   * 
   * @param {string} owner
   * @param {string} repo
   * @param {{ page?: number, perPage?: number }} options
   * @returns {Promise<{ commits: Array<object>, page: number, perPage: number, hasMore: boolean }>}
   */
  async getCommits(owner, repo, options = {}) {
    const page = Math.max(1, parseInt(options.page || '1', 10));
    const perPage = Math.min(100, Math.max(1, parseInt(options.perPage || options.per_page || '20', 10)));

    let rawList;
    try {
      rawList = await this._fetchFromGitHub(
        `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/commits?page=${page}&per_page=${perPage}`
      );
    } catch (err) {
      // GitHub returns 409 Conflict if repository is completely empty
      if (err.statusCode === 409 || err.message?.includes('empty')) {
        return {
          commits: [],
          page,
          perPage,
          hasMore: false,
        };
      }
      throw err;
    }

    if (!Array.isArray(rawList)) {
      return {
        commits: [],
        page,
        perPage,
        hasMore: false,
      };
    }

    const commits = rawList.map((item) => ({
      sha: item.sha,
      shortSha: item.sha.substring(0, 7),
      message: item.commit?.message || '',
      author: {
        name: item.commit?.author?.name || null,
        email: item.commit?.author?.email || null,
        date: item.commit?.author?.date || null,
        login: item.author?.login || null,
        avatarUrl: item.author?.avatar_url || null,
        htmlUrl: item.author?.html_url || null,
      },
      committer: {
        name: item.commit?.committer?.name || null,
        email: item.commit?.committer?.email || null,
        date: item.commit?.committer?.date || null,
        login: item.committer?.login || null,
        avatarUrl: item.committer?.avatar_url || null,
        htmlUrl: item.committer?.html_url || null,
      },
      htmlUrl: item.html_url || `https://github.com/${owner}/${repo}/commit/${item.sha}`,
      parentShas: Array.isArray(item.parents) ? item.parents.map((p) => p.sha) : [],
    }));

    return {
      commits,
      page,
      perPage,
      hasMore: commits.length >= perPage,
    };
  }

  /**
   * Retrieves single commit details including changed files and line stats.
   * Formats output to match CommitDetail interface expected by frontend.
   * 
   * @param {string} owner
   * @param {string} repo
   * @param {string} sha
   * @returns {Promise<object>}
   */
  async getCommitDetail(owner, repo, sha) {
    const raw = await this._fetchFromGitHub(
      `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/commits/${encodeURIComponent(sha)}`
    );

    return {
      sha: raw.sha,
      shortSha: raw.sha.substring(0, 7),
      message: raw.commit?.message || '',
      author: {
        name: raw.commit?.author?.name || null,
        email: raw.commit?.author?.email || null,
        date: raw.commit?.author?.date || null,
        login: raw.author?.login || null,
        avatarUrl: raw.author?.avatar_url || null,
        htmlUrl: raw.author?.html_url || null,
      },
      committer: {
        name: raw.commit?.committer?.name || null,
        email: raw.commit?.committer?.email || null,
        date: raw.commit?.committer?.date || null,
        login: raw.committer?.login || null,
        avatarUrl: raw.committer?.avatar_url || null,
        htmlUrl: raw.committer?.html_url || null,
      },
      htmlUrl: raw.html_url || `https://github.com/${owner}/${repo}/commit/${raw.sha}`,
      parentShas: Array.isArray(raw.parents) ? raw.parents.map((p) => p.sha) : [],
      stats: raw.stats
        ? {
            total: raw.stats.total || 0,
            additions: raw.stats.additions || 0,
            deletions: raw.stats.deletions || 0,
          }
        : null,
      files: Array.isArray(raw.files)
        ? raw.files.map((file) => ({
            filename: file.filename,
            status: file.status || 'modified',
            additions: file.additions || 0,
            deletions: file.deletions || 0,
            changes: file.changes || 0,
            rawUrl: file.raw_url,
            patch: file.patch,
            previousFilename: file.previous_filename,
          }))
        : [],
    };
  }
  /**
   * Retrieves repository contributors and contribution counts.
   * Calculates percentages, ranks, badges, and handles anonymous/empty repos.
   * 
   * @param {string} owner
   * @param {string} repo
   * @param {{ limit?: number, anon?: boolean }} [options={}]
   * @returns {Promise<{ totalContributors: number, totalContributions: number, contributors: Array<object> }>}
   */
  async getContributors(owner, repo, options = {}) {
    const limit = Math.min(100, Math.max(1, parseInt(options.limit || '100', 10)));
    const anon = options.anon !== false;

    let rawList;
    try {
      rawList = await this._fetchFromGitHub(
        `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contributors?per_page=${limit}&anon=${anon ? 'true' : 'false'}`
      );
    } catch (err) {
      if (err.statusCode === 204 || err.statusCode === 409 || err.message?.includes('empty')) {
        return { totalContributors: 0, totalContributions: 0, contributors: [] };
      }
      throw err;
    }

    if (!Array.isArray(rawList)) {
      return { totalContributors: 0, totalContributions: 0, contributors: [] };
    }

    const totalContributions = rawList.reduce((sum, item) => sum + Number(item.contributions || 0), 0);

    const contributors = rawList.map((item, index) => {
      const contributions = Number(item.contributions || 0);
      const percentage = totalContributions > 0 ? Number(((contributions / totalContributions) * 100).toFixed(1)) : 0;

      let badge = 'Contributor';
      if (index === 0) badge = 'Lead Contributor';
      else if (percentage >= 25) badge = 'Core Maintainer';
      else if (percentage >= 10) badge = 'Active Builder';

      return {
        id: item.id || null,
        login: item.login || null,
        name: item.name || null,
        email: item.email || null,
        avatarUrl: item.avatar_url || null,
        htmlUrl: item.html_url || (item.login ? `https://github.com/${item.login}` : null),
        contributions,
        percentage,
        rank: index + 1,
        badge,
        type: item.type || (item.login ? 'User' : 'Anonymous'),
      };
    });

    return {
      totalContributors: contributors.length,
      totalContributions,
      contributors,
    };
  }

  /**
   * Identifies frequently changed files (code churn hotspots) across recent commits.
   * 
   * @param {string} owner
   * @param {string} repo
   * @param {number} [limit=15]
   * @returns {Promise<{ files: Array<object>, analyzedCommitsCount: number }>}
   */
  async getFileHotspots(owner, repo, limit = 15) {
    try {
      const commitsResult = await this.getCommits(owner, repo, { page: 1, perPage: 12 });
      const commits = commitsResult.commits || [];
      if (commits.length === 0) {
        return { files: [], analyzedCommitsCount: 0 };
      }

      const detailsPromises = commits.slice(0, 10).map(async (c) => {
        try {
          return await this.getCommitDetail(owner, repo, c.sha);
        } catch {
          return null;
        }
      });

      const details = (await Promise.all(detailsPromises)).filter(Boolean);

      const fileMap = new Map();
      for (const commit of details) {
        const authorName = commit.author?.name || commit.author?.login || 'Unknown';
        for (const file of commit.files || []) {
          if (!file.filename) continue;
          const existing = fileMap.get(file.filename) || {
            filename: file.filename,
            changesCount: 0,
            additions: 0,
            deletions: 0,
            authors: {},
          };

          existing.changesCount += 1;
          existing.additions += (file.additions || 0);
          existing.deletions += (file.deletions || 0);
          existing.authors[authorName] = (existing.authors[authorName] || 0) + 1;

          fileMap.set(file.filename, existing);
        }
      }

      const files = Array.from(fileMap.values())
        .map((f) => {
          let topAuthor = 'Unknown';
          let maxCount = 0;
          for (const [author, count] of Object.entries(f.authors)) {
            if (count > maxCount) {
              maxCount = count;
              topAuthor = author;
            }
          }

          let churnLevel = 'low';
          if (f.changesCount >= 3) churnLevel = 'high';
          else if (f.changesCount >= 2) churnLevel = 'medium';

          return {
            filename: f.filename,
            changesCount: f.changesCount,
            additions: f.additions,
            deletions: f.deletions,
            primaryAuthor: topAuthor,
            churnLevel,
          };
        })
        .sort((a, b) => b.changesCount - a.changesCount || (b.additions + b.deletions) - (a.additions + a.deletions))
        .slice(0, limit);

      return {
        files,
        analyzedCommitsCount: details.length,
      };
    } catch (err) {
      if (err.statusCode === 409 || err.message?.includes('empty')) {
        return { files: [], analyzedCommitsCount: 0 };
      }
      throw err;
    }
  }

  /**
   * Retrieves commit velocity and day-of-week activity distribution (Task 3).
   * 
   * @param {string} owner
   * @param {string} repo
   * @returns {Promise<object>}
   */
  async getActivity(owner, repo) {
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const initialByDayOfWeek = {
      Sunday: 0,
      Monday: 0,
      Tuesday: 0,
      Wednesday: 0,
      Thursday: 0,
      Friday: 0,
      Saturday: 0,
    };

    try {
      let stats;
      try {
        stats = await this._fetchFromGitHub(
          `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/stats/commit_activity`
        );
      } catch {
        stats = null;
      }

      // If GitHub stats API returns 52-week array and has actual activity
      if (Array.isArray(stats) && stats.length > 0) {
        let totalCommits = 0;
        const byDayOfWeek = { ...initialByDayOfWeek };

        const weeklyTimeline = stats.map((item) => {
          const count = item.total || 0;
          totalCommits += count;

          if (Array.isArray(item.days)) {
            item.days.forEach((dayCount, dayIdx) => {
              const dayName = dayNames[dayIdx];
              if (dayName) {
                byDayOfWeek[dayName] += Number(dayCount || 0);
              }
            });
          }

          const date = new Date(item.week * 1000);
          return {
            week: date.toISOString().split('T')[0],
            count,
          };
        });

        if (totalCommits > 0) {
          return {
            period: 'last_52_weeks',
            isSampled: false,
            totalCommits,
            weeklyTimeline,
            byDayOfWeek,
          };
        }
      }

      // Fallback: Compute activity from real commits if stats API returned 0 / caching / empty
      const commitsResult = await this.getCommits(owner, repo, { page: 1, perPage: 100 });
      const commits = commitsResult.commits || [];

      if (commits.length === 0) {
        return {
          period: 'last_52_weeks',
          isSampled: false,
          totalCommits: 0,
          weeklyTimeline: [],
          byDayOfWeek: initialByDayOfWeek,
        };
      }

      const byDayOfWeek = { ...initialByDayOfWeek };
      const weekMap = new Map();

      for (const c of commits) {
        const commitDate = c.author?.date || c.committer?.date;
        if (!commitDate) continue;
        const d = new Date(commitDate);
        if (isNaN(d.getTime())) continue;

        const dayName = dayNames[d.getUTCDay()];
        if (dayName) byDayOfWeek[dayName] += 1;

        // Calculate start of week (Sunday)
        const sunday = new Date(d);
        sunday.setUTCDate(d.getUTCDate() - d.getUTCDay());
        sunday.setUTCHours(0, 0, 0, 0);
        const weekKey = sunday.toISOString().split('T')[0];
        weekMap.set(weekKey, (weekMap.get(weekKey) || 0) + 1);
      }

      // Generate a contiguous weekly timeline spanning the active commits
      const sortedWeeks = Array.from(weekMap.keys()).sort();
      const weeklyTimeline = [];

      if (sortedWeeks.length > 0) {
        const startDate = new Date(sortedWeeks[0]);
        const endDate = new Date(sortedWeeks[sortedWeeks.length - 1]);

        // Pad 2 weeks before and 2 weeks after so AreaChart draws a smooth curve
        startDate.setUTCDate(startDate.getUTCDate() - 14);
        endDate.setUTCDate(endDate.getUTCDate() + 14);

        const curr = new Date(startDate);
        while (curr <= endDate) {
          const key = curr.toISOString().split('T')[0];
          weeklyTimeline.push({
            week: key,
            count: weekMap.get(key) || 0,
          });
          curr.setUTCDate(curr.getUTCDate() + 7);
        }
      }

      return {
        period: 'all_time',
        isSampled: commits.length >= 100,
        totalCommits: commits.length,
        weeklyTimeline,
        byDayOfWeek,
      };
    } catch (err) {
      if (err.statusCode === 409 || err.message?.includes('empty')) {
        return {
          period: 'last_52_weeks',
          isSampled: false,
          totalCommits: 0,
          weeklyTimeline: [],
          byDayOfWeek: initialByDayOfWeek,
        };
      }
      throw err;
    }
  }

  /**
   * Alias for getActivity to satisfy alternative controller naming.
   */
  async getCommitActivity(owner, repo) {
    return this.getActivity(owner, repo);
  }

  /**
   * Retrieves frequently changed files across recent commits (Task 4).
   * 
   * @param {string} owner
   * @param {string} repo
   * @param {number|object} [sampleCommits=20]
   * @param {number} [limit=10]
   * @returns {Promise<object>}
   */
  async getFrequentFiles(owner, repo, sampleCommits = 20, limit = 10) {
    let resolvedSample = sampleCommits;
    let resolvedLimit = limit;
    if (typeof sampleCommits === 'object' && sampleCommits !== null) {
      resolvedSample = sampleCommits.sampleCommits || sampleCommits.sample_commits || 20;
      resolvedLimit = sampleCommits.limit || 10;
    }

    const boundedSample = Math.min(50, Math.max(1, parseInt(resolvedSample || '20', 10)));
    const boundedLimit = Math.min(50, Math.max(1, parseInt(resolvedLimit || '10', 10)));

    try {
      const commitsResult = await this.getCommits(owner, repo, { page: 1, perPage: boundedSample });
      const commits = commitsResult.commits || [];

      if (commits.length === 0) {
        return {
          isSampled: true,
          sampleCommits: boundedSample,
          analyzedCommits: 0,
          totalUniqueFiles: 0,
          note: `Analysis computed over a bounded sample of 0 commit details`,
          files: [],
        };
      }

      const detailsPromises = commits.slice(0, boundedSample).map(async (c) => {
        try {
          return await this.getCommitDetail(owner, repo, c.sha);
        } catch {
          return null;
        }
      });

      const details = (await Promise.all(detailsPromises)).filter(Boolean);

      const fileMap = new Map();
      for (const commit of details) {
        for (const file of commit.files || []) {
          if (!file.filename) continue;
          const existing = fileMap.get(file.filename) || {
            filename: file.filename,
            modifications: 0,
            additions: 0,
            deletions: 0,
            changes: 0,
          };

          const add = Number(file.additions || 0);
          const del = Number(file.deletions || 0);

          existing.modifications += 1;
          existing.additions += add;
          existing.deletions += del;
          existing.changes += (add + del);

          fileMap.set(file.filename, existing);
        }
      }

      const files = Array.from(fileMap.values())
        .sort((a, b) => b.modifications - a.modifications || b.changes - a.changes)
        .slice(0, boundedLimit);

      return {
        isSampled: true,
        sampleCommits: boundedSample,
        analyzedCommits: details.length,
        totalUniqueFiles: fileMap.size,
        note: `Analysis computed over a bounded sample of the most recent ${details.length} commit details`,
        files,
      };
    } catch (err) {
      if (err.statusCode === 409 || err.message?.includes('empty')) {
        return {
          isSampled: true,
          sampleCommits: boundedSample,
          analyzedCommits: 0,
          totalUniqueFiles: 0,
          note: `Analysis computed over a bounded sample of 0 commit details`,
          files: [],
        };
      }
      throw err;
    }
  }

  /**
   * Alias for getFrequentFiles to satisfy alternative controller naming.
   */
  async getFrequentlyChangedFiles(owner, repo, options = {}) {
    return this.getFrequentFiles(owner, repo, options);
  }
}

export const githubService = new GitHubService();
