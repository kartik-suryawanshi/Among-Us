export interface Contributor {
  id: number;
  login: string;
  avatarUrl: string;
  htmlUrl: string;
  contributions: number;
  percentage: number;
  rank: number;
  badge: string;
}

export interface ContributorStats {
  totalContributors: number;
  totalContributions: number;
  contributors: Contributor[];
}
