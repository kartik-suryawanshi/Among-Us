export function isValidOwner(owner: string): boolean {
  if (!owner || typeof owner !== 'string') return false;
  // GitHub usernames/orgs are 1-39 characters, alphanumeric with single hyphens, not beginning or ending with a hyphen
  const ownerRegex = /^[a-zA-Z0-9](?:[a-zA-Z0-9-._]{0,38})$/;
  return ownerRegex.test(owner);
}

export function isValidRepo(repo: string): boolean {
  if (!repo || typeof repo !== 'string') return false;
  // Repo names are 1-100 characters, alphanumeric, hyphens, underscores, and dots
  const repoRegex = /^[a-zA-Z0-9_.-]{1,100}$/;
  return repoRegex.test(repo);
}

export function isValidSha(sha: string): boolean {
  if (!sha || typeof sha !== 'string') return false;
  // Git SHAs are 7 to 40 hexadecimal characters
  const shaRegex = /^[0-9a-fA-F]{7,40}$/;
  return shaRegex.test(sha);
}

export function parsePaginationParams(pageQuery?: unknown, perPageQuery?: unknown): { page: number; perPage: number } {
  let page = 1;
  let perPage = 20;

  if (typeof pageQuery === 'string' || typeof pageQuery === 'number') {
    const parsedPage = parseInt(String(pageQuery), 10);
    if (!Number.isNaN(parsedPage) && parsedPage >= 1 && parsedPage <= 1000) {
      page = parsedPage;
    }
  }

  if (typeof perPageQuery === 'string' || typeof perPageQuery === 'number') {
    const parsedPerPage = parseInt(String(perPageQuery), 10);
    if (!Number.isNaN(parsedPerPage) && parsedPerPage >= 1 && parsedPerPage <= 100) {
      perPage = parsedPerPage;
    }
  }

  return { page, perPage };
}
