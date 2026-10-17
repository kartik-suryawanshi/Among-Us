export interface WeeklyActivity {
  week: string;
  count: number;
}

export interface DayOfWeekDistribution {
  Sunday: number;
  Monday: number;
  Tuesday: number;
  Wednesday: number;
  Thursday: number;
  Friday: number;
  Saturday: number;
}

export interface CommitActivityResponse {
  period: string;
  isSampled: boolean;
  totalCommits: number;
  weeklyTimeline: WeeklyActivity[];
  byDayOfWeek: DayOfWeekDistribution;
}
