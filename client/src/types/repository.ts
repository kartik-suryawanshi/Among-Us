export interface RepositoryOwner {
  login: string;
  avatarUrl: string;
  htmlUrl: string;
}

export interface Repository {
  id: number;
  name: string;
  fullName: string;
  owner: RepositoryOwner;
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
