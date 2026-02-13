import type { WorkItem } from "../model/work-item.js";

export interface WorkItemProvider {
  name: string;
  fetchAssignedItems(): Promise<WorkItem[]>;
}
