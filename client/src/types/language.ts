export interface LanguageItem {
  language: string;
  bytes: number;
  percentage: number;
}

export interface LanguageDistribution {
  totalBytes: number;
  languages: LanguageItem[];
}
