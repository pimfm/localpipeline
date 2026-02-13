import type { WorkItem } from "../../model/work-item.js";

interface LinearWebhookBody {
  type?: string;
  action?: string;
  data?: {
    id?: string;
    identifier?: string;
    title?: string;
    description?: string;
    priority?: number;
    url?: string;
    state?: { name?: string };
    team?: { name?: string };
    labels?: Array<{ name?: string }>;
  };
  updatedFrom?: {
    labelIds?: string[];
  };
}

const PRIORITY_MAP: Record<number, string> = {
  1: "Urgent",
  2: "High",
  3: "Medium",
  4: "Low",
};

export function parseLinearWebhook(body: LinearWebhookBody): WorkItem | undefined {
  if (body.type !== "Issue") return undefined;
  if (body.action !== "update") return undefined;

  // Only trigger on label changes (Linear doesn't support assignment webhooks well)
  if (!body.updatedFrom?.labelIds) return undefined;

  const data = body.data;
  if (!data?.identifier || !data?.title) return undefined;

  return {
    id: data.identifier,
    title: data.title,
    description: data.description,
    status: data.state?.name,
    priority: data.priority ? PRIORITY_MAP[data.priority] : undefined,
    labels: data.labels?.map((l) => l.name).filter((n): n is string => !!n) ?? [],
    source: "Linear",
    team: data.team?.name,
    url: data.url,
  };
}
