import type { WorkItem } from "../../model/work-item.js";

interface ClickUpWebhookBody {
  event?: string;
  task_id?: string;
  history_items?: Array<{
    field?: string;
    after?: unknown;
  }>;
}

export function parseClickUpWebhook(body: ClickUpWebhookBody): WorkItem | undefined {
  const event = body.event;
  if (event !== "taskAssigneeUpdated" && event !== "taskTagUpdated") return undefined;

  if (!body.task_id) return undefined;

  // ClickUp webhooks are minimal — we build a basic WorkItem from what's available
  const title = body.history_items?.[0]?.field === "tag"
    ? `Task ${body.task_id} (tag updated)`
    : `Task ${body.task_id} (assignee updated)`;

  return {
    id: body.task_id,
    title,
    labels: [],
    source: "ClickUp",
  };
}
