export interface WakaTimeStatsResponse {
  data: {
    total_seconds: number;
    daily_average: number;
    languages: { name: string; total_seconds: number; percent: number }[];
    projects: { name: string; total_seconds: number; percent: number }[];
  };
}

export interface WakaTimeSummariesResponse {
  data: {
    range: { date: string };
    grand_total: { total_seconds: number };
  }[];
}
