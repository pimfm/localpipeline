import type { TimeEntry, TimeStats } from "../model/time-entry.js";

export function computeTimeStats(entries: TimeEntry[]): TimeStats {
  let totalMinutes = 0;
  const entriesByDay = new Map<string, number>();
  const entriesByWorkItem = new Map<string, { title: string; source: string; minutes: number }>();
  const entriesBySource = new Map<string, number>();

  for (const entry of entries) {
    const mins = entry.durationMinutes ?? 0;
    totalMinutes += mins;

    const day = entry.startTime.slice(0, 10);
    entriesByDay.set(day, (entriesByDay.get(day) ?? 0) + mins);

    const key = `${entry.workItemSource}:${entry.workItemId}`;
    const existing = entriesByWorkItem.get(key);
    if (existing) {
      existing.minutes += mins;
    } else {
      entriesByWorkItem.set(key, { title: entry.workItemTitle, source: entry.workItemSource, minutes: mins });
    }

    entriesBySource.set(entry.workItemSource, (entriesBySource.get(entry.workItemSource) ?? 0) + mins);
  }

  return { totalMinutes, entriesByDay, entriesByWorkItem, entriesBySource };
}

export function formatMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}
