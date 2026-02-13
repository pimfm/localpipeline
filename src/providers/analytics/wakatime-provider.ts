import type { WakaTimeStats } from "../../model/analytics.js";
import type { WakaTimeStatsResponse, WakaTimeSummariesResponse } from "./wakatime-types.js";

const BASE_URL = "https://api.wakatime.com/api/v1/users/current";

export class WakaTimeProvider {
  constructor(private apiKey: string) {}

  private async request<T>(path: string): Promise<T> {
    const res = await fetch(`${BASE_URL}${path}`, {
      headers: { Authorization: `Bearer ${this.apiKey}` },
    });
    if (!res.ok) throw new Error(`WakaTime API error: ${res.status}`);
    return res.json() as Promise<T>;
  }

  async fetchStats(range = "last_7_days"): Promise<WakaTimeStats> {
    const [statsRes, summariesRes] = await Promise.all([
      this.request<WakaTimeStatsResponse>(`/stats/${range}`),
      this.fetchSummariesRaw(range),
    ]);

    const { data } = statsRes;
    return {
      totalSeconds: data.total_seconds,
      dailyAverageSeconds: data.daily_average,
      languages: data.languages.slice(0, 5).map((l) => ({
        name: l.name,
        totalSeconds: l.total_seconds,
        percent: l.percent,
      })),
      projects: data.projects.slice(0, 5).map((p) => ({
        name: p.name,
        totalSeconds: p.total_seconds,
        percent: p.percent,
      })),
      dailyTotals: summariesRes,
    };
  }

  private async fetchSummariesRaw(
    range: string
  ): Promise<{ date: string; totalSeconds: number }[]> {
    const end = new Date();
    const start = new Date();
    if (range === "last_7_days") start.setDate(end.getDate() - 7);
    else if (range === "last_30_days") start.setDate(end.getDate() - 30);
    else start.setDate(end.getDate() - 7);

    const startStr = start.toISOString().slice(0, 10);
    const endStr = end.toISOString().slice(0, 10);

    const res = await this.request<WakaTimeSummariesResponse>(
      `/summaries?start=${startStr}&end=${endStr}`
    );
    return res.data.map((d) => ({
      date: d.range.date,
      totalSeconds: d.grand_total.total_seconds,
    }));
  }
}
