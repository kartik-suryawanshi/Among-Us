export interface CommitUser {
  name: string | null;
  email: string | null;
  date: string | null;
  login: string | null;
  avatarUrl: string | null;
  htmlUrl: string | null;
}

export interface CommitSummary {
  sha: string;
  shortSha: string;
  message: string;
  author: CommitUser;
  committer: CommitUser;
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

export interface CommitDetail extends CommitSummary {
  stats: {
    total: number;
    additions: number;
    deletions: number;
  } | null;
  files: ChangedFile[];
}

export interface PaginatedCommits {
  commits: CommitSummary[];
  page: number;
  perPage: number;
  hasMore: boolean;
}
