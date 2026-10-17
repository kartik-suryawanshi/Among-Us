/**
 * GitHub repository URL parser and validation utilities.
 * Validates repository owners, names, and parses various URL/shorthand formats.
 */

// GitHub username/organization: 1-39 characters, alphanumeric with hyphens, dots, underscores
const OWNER_REGEX = /^[a-zA-Z0-9](?:[a-zA-Z0-9-._]{0,38})$/;

// GitHub repository name: 1-100 characters, alphanumeric, hyphens, underscores, dots
const REPO_REGEX = /^[a-zA-Z0-9_.-]{1,100}$/;

/**
 * Validates a GitHub owner (user or organization name).
 * @param {string} owner
 * @returns {boolean}
 */
export function isValidOwner(owner) {
  if (!owner || typeof owner !== 'string') return false;
  const trimmed = owner.trim();
  if (trimmed === '.' || trimmed === '..') return false;
  return OWNER_REGEX.test(trimmed);
}

/**
 * Validates a GitHub repository name.
 * @param {string} repo
 * @returns {boolean}
 */
export function isValidRepo(repo) {
  if (!repo || typeof repo !== 'string') return false;
  const trimmed = repo.trim();
  if (trimmed === '.' || trimmed === '..') return false;
  return REPO_REGEX.test(trimmed);
}

/**
 * Parses and validates a GitHub URL or "owner/repo" shorthand string.
 * Supports:
 * - "https://github.com/owner/repo"
 * - "http://www.github.com/owner/repo.git"
 * - "owner/repo"
 * - "owner/repo.git"
 * 
 * @param {string} input - Raw input string to parse
 * @returns {{ owner: string, repo: string, fullName: string }}
 * @throws {Error} if input is invalid or missing
 */
export function parseGitHubUrl(input) {
  if (input === undefined || input === null) {
    const error = new Error('Repository identifier or URL is required.');
    error.statusCode = 400;
    throw error;
  }

  if (typeof input !== 'string' || !input.trim()) {
    const error = new Error('Repository identifier or URL cannot be empty.');
    error.statusCode = 400;
    throw error;
  }

  const trimmed = input.trim();
  let owner = '';
  let repo = '';

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    let parsedUrl;
    try {
      parsedUrl = new URL(trimmed);
    } catch {
      const error = new Error('Invalid URL format provided.');
      error.statusCode = 400;
      throw error;
    }

    const hostname = parsedUrl.hostname.toLowerCase();
    if (hostname !== 'github.com' && hostname !== 'www.github.com') {
      const error = new Error('Only public repositories on github.com are supported.');
      error.statusCode = 400;
      throw error;
    }

    const segments = parsedUrl.pathname.split('/').filter(Boolean);
    if (segments.length < 2) {
      const error = new Error('GitHub URL must include both owner and repository name (e.g., github.com/owner/repo).');
      error.statusCode = 400;
      throw error;
    }

    owner = segments[0];
    repo = segments[1];
  } else {
    // Shorthand format: "owner/repo"
    const parts = trimmed.split('/');
    if (parts.length === 2) {
      owner = parts[0].trim();
      repo = parts[1].trim();
    } else {
      const error = new Error('Invalid repository identifier. Expected format: owner/repo or full GitHub URL.');
      error.statusCode = 400;
      throw error;
    }
  }

  // Strip trailing .git if present
  if (repo.toLowerCase().endsWith('.git')) {
    repo = repo.slice(0, -4);
  }

  if (!isValidOwner(owner)) {
    const error = new Error(`Invalid GitHub repository owner '${owner}'.`);
    error.statusCode = 400;
    throw error;
  }

  if (!isValidRepo(repo)) {
    const error = new Error(`Invalid GitHub repository name '${repo}'.`);
    error.statusCode = 400;
    throw error;
  }

  return {
    owner,
    repo,
    fullName: `${owner}/${repo}`,
  };
}
