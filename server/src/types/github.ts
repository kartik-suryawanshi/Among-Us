export interface GitHubRepositoryResponse {
  id: number;
  name: string;
  full_name: string;
  owner: {
    login: string;
    avatar_url: string;
    html_url: string;
  };
  html_url: string;
  description: string | null;
  fork: boolean;
  created_at: string;
  updated_at: string;
  pushed_at: string;
  homepage: string | null;
  size: number;
  stargazers_count: number;
  watchers_count: number;
  language: string | null;
  forks_count: number;
  open_issues_count: number;
  default_branch: string;
  topics?: string[];
  visibility?: string;
}

export interface NormalizedRepository {
  id: number;
  name: string;
  fullName: string;
  owner: {
    login: string;
    avatarUrl: string;
    htmlUrl: string;
  };
  htmlUrl: string;
  description: string | null;
  isFork: boolean;
  createdAt: string;
  updatedAt: string;
  pushedAt: string;
  starsCount: number;
  forksCount: number;
  openIssuesCount: number;
  language: string | null;
  defaultBranch: string;
  topics: string[];
}

export interface GitHubCommitItemResponse {
  sha: string;
  node_id: string;
  commit: {
    author: {
      name: string;
      email: string;
      date: string;
    } | null;
    committer: {
      name: string;
      email: string;
      date: string;
    } | null;
    message: string;
    comment_count: number;
  };
  url: string;
  html_url: string;
  comments_url: string;
  author: {
    login: string;
    id: number;
    avatar_url: string;
    html_url: string;
  } | null;
  committer: {
    login: string;
    id: number;
    avatar_url: string;
    html_url: string;
  } | null;
  parents: Array<{
    sha: string;
    url: string;
    html_url: string;
  }>;
}

export interface GitHubCommitDetailResponse extends GitHubCommitItemResponse {
  stats?: {
    total: number;
    additions: number;
    deletions: number;
  };
  files?: Array<{
    sha: string;
    filename: string;
    status: 'added' | 'removed' | 'modified' | 'renamed' | 'copied' | 'changed' | 'unchanged';
    additions: number;
    deletions: number;
    changes: number;
    blob_url?: string;
    raw_url?: string;
    contents_url?: string;
    patch?: string;
    previous_filename?: string;
  }>;
}

export interface NormalizedCommitSummary {
  sha: string;
  shortSha: string;
  message: string;
  author: {
    name: string | null;
    email: string | null;
    date: string | null;
    login: string | null;
    avatarUrl: string | null;
    htmlUrl: string | null;
  };
  committer: {
    name: string | null;
    email: string | null;
    date: string | null;
    login: string | null;
    avatarUrl: string | null;
    htmlUrl: string | null;
  };
  htmlUrl: string;
  parentShas: string[];
}

export interface ChangedFile {
  filename: string;
  status: string;
  additions: number;
  deletions: number;
  changes: number;
  rawUrl?: string;
  patch?: string;
  previousFilename?: string;
}

export interface NormalizedCommitDetail extends NormalizedCommitSummary {
  stats: {
    total: number;
    additions: number;
    deletions: number;
  } | null;
  files: ChangedFile[];
}

export interface PaginatedCommitsResponse {
  commits: NormalizedCommitSummary[];
  page: number;
  perPage: number;
  hasMore: boolean;
}
