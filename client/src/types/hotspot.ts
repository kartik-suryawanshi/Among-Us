export interface FileHotspot {
  filename: string;
  changesCount: number;
  additions: number;
  deletions: number;
  primaryAuthor: string;
  churnLevel: 'high' | 'medium' | 'low';
}

export interface FileHotspotsResponse {
  files: FileHotspot[];
  analyzedCommitsCount: number;
}
