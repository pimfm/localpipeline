export interface WakaTimeStats {
  totalSeconds: number;
  dailyAverageSeconds: number;
  languages: { name: string; totalSeconds: number; percent: number }[];
  projects: { name: string; totalSeconds: number; percent: number }[];
  dailyTotals: { date: string; totalSeconds: number }[];
}

export interface RescueTimeStats {
  totalHours: number;
  productivityScore: number; // 0-100
  categories: { name: string; hours: number; productivityLevel: number }[];
  dailySummaries: { date: string; totalHours: number; productivityScore: number }[];
}

export interface DashboardAnalytics {
  wakatime?: WakaTimeStats;
  rescuetime?: RescueTimeStats;
}
