import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import { homedir } from "os";
import { randomUUID } from "crypto";
import type { TimeEntry, ActiveTimer } from "../model/time-entry.js";

interface StoreData {
  entries: TimeEntry[];
  activeTimer?: ActiveTimer;
}

export class TimeStore {
  private filePath: string;
  private data: StoreData;

  constructor(customPath?: string) {
    if (customPath) {
      this.filePath = customPath;
    } else {
      const dir = join(homedir(), ".localpipeline");
      mkdirSync(dir, { recursive: true });
      this.filePath = join(dir, "time.json");
    }
    this.data = this.load();
  }

  private load(): StoreData {
    try {
      const content = readFileSync(this.filePath, "utf-8");
      const parsed = JSON.parse(content);
      return {
        entries: parsed.entries ?? [],
        activeTimer: parsed.activeTimer ?? undefined,
      };
    } catch {
      return { entries: [] };
    }
  }

  private save(): void {
    writeFileSync(this.filePath, JSON.stringify(this.data, null, 2));
  }

  getActiveTimer(): ActiveTimer | undefined {
    return this.data.activeTimer;
  }

  startTimer(workItemId: string, workItemSource: string, workItemTitle: string): ActiveTimer {
    // Stop any running timer first
    if (this.data.activeTimer) {
      this.stopTimer();
    }

    const timer: ActiveTimer = {
      entryId: randomUUID(),
      workItemId,
      workItemSource,
      workItemTitle,
      startTime: new Date().toISOString(),
    };
    this.data.activeTimer = timer;
    this.save();
    return timer;
  }

  stopTimer(): TimeEntry | undefined {
    const timer = this.data.activeTimer;
    if (!timer) return undefined;

    const endTime = new Date().toISOString();
    const durationMinutes = Math.round(
      (new Date(endTime).getTime() - new Date(timer.startTime).getTime()) / 60000
    );

    const entry: TimeEntry = {
      id: timer.entryId,
      workItemId: timer.workItemId,
      workItemSource: timer.workItemSource,
      workItemTitle: timer.workItemTitle,
      startTime: timer.startTime,
      endTime,
      durationMinutes,
    };

    this.data.entries.push(entry);
    this.data.activeTimer = undefined;
    this.save();
    return entry;
  }

  getAllEntries(): TimeEntry[] {
    return this.data.entries;
  }

  getEntriesForDateRange(start: Date, end: Date): TimeEntry[] {
    return this.data.entries.filter((e) => {
      const t = new Date(e.startTime).getTime();
      return t >= start.getTime() && t <= end.getTime();
    });
  }
}
