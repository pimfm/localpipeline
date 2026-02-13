export interface TimeEntry {
  id: string;
  workItemId: string;
  workItemSource: string;
  workItemTitle: string;
  startTime: string; // ISO 8601
  endTime?: string; // ISO 8601
  durationMinutes?: number;
}

export interface ActiveTimer {
  entryId: string;
  workItemId: string;
  workItemSource: string;
  workItemTitle: string;
  startTime: string;
}

export interface TimeStats {
  totalMinutes: number;
  entriesByDay: Map<string, number>; // "YYYY-MM-DD" -> minutes
  entriesByWorkItem: Map<string, { title: string; source: string; minutes: number }>;
  entriesBySource: Map<string, number>; // source -> minutes
}
