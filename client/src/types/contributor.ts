export interface Contributor {
  id: number | null;
  login: string | null;
  name?: string | null;
  email?: string | null;
  avatarUrl: string | null;
  htmlUrl: string | null;
  contributions: number;
  percentage: number;
  rank: number;
  badge: string;
  type?: string;
}

export interface ContributorStats {
  totalContributors: number;
  totalContributions: number;
  contributors: Contributor[];
}
