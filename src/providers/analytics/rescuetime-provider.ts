import type { RescueTimeStats } from "../../model/analytics.js";
import type { RescueTimeDailySummary, RescueTimeDataResponse } from "./rescuetime-types.js";

const BASE_URL = "https://www.rescuetime.com/anapi";

export class RescueTimeProvider {
  constructor(private apiKey: string) {}

  private async request<T>(path: string, params: Record<string, string> = {}): Promise<T> {
    const url = new URL(`${BASE_URL}${path}`);
    url.searchParams.set("key", this.apiKey);
    url.searchParams.set("format", "json");
    for (const [k, v] of Object.entries(params)) {
      url.searchParams.set(k, v);
    }
    const res = await fetch(url.toString());
    if (!res.ok) throw new Error(`RescueTime API error: ${res.status}`);
    return res.json() as Promise<T>;
  }

  async fetchStats(): Promise<RescueTimeStats> {
    const [summaries, categories] = await Promise.all([
      this.request<RescueTimeDailySummary[]>("/daily_summary_feed"),
      this.request<RescueTimeDataResponse>("/data", {
        perspective: "rank",
        restrict_kind: "category",
      }),
    ]);

    const recent = summaries.slice(0, 7);
    const totalHours = recent.reduce((sum, s) => sum + s.total_hours, 0);
    const avgProductivity =
      recent.length > 0
        ? Math.round(recent.reduce((sum, s) => sum + s.productivity_pulse, 0) / recent.length)
        : 0;

    const cats = categories.rows.slice(0, 5).map((row) => ({
      name: row[0],
      hours: row[1] / 3600,
      productivityLevel: row[3],
    }));

    return {
      totalHours,
      productivityScore: avgProductivity,
      categories: cats,
      dailySummaries: recent.map((s) => ({
        date: s.date,
        totalHours: s.total_hours,
        productivityScore: s.productivity_pulse,
      })),
    };
  }
}
