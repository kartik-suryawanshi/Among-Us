import type { Repository } from './repository';
import type { LanguageDistribution } from './language';
import type { CommitActivityResponse } from './activity';
import type { ContributorStats } from './contributor';
import type { CommitSummary } from './commit';
import type { FrequentFilesResponse } from './frequentFiles';

export interface CompleteAnalyticsResponse {
  repository: Repository;
  languages: LanguageDistribution;
  commitActivity: CommitActivityResponse;
  contributors: ContributorStats;
  recentCommits: CommitSummary[];
  frequentlyChangedFiles: FrequentFilesResponse;
  isPartial: boolean;
  warnings: string[];
  generatedAt: string;
}
