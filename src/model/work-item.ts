export interface WorkItem {
  id: string;
  title: string;
  description?: string;
  status?: string;
  priority?: string;
  labels: string[];
  source: string;
  team?: string;
  url?: string;
}
