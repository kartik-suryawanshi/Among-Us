export interface FrequentFileItem {
  filename: string;
  modifications: number;
  additions: number;
  deletions: number;
  changes: number;
}

export interface FrequentFilesResponse {
  isSampled: boolean;
  sampleCommits: number;
  analyzedCommits: number;
  totalUniqueFiles: number;
  note: string;
  files: FrequentFileItem[];
}
