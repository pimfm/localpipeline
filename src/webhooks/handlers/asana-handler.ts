import type { WorkItem } from "../../model/work-item.js";

interface AsanaWebhookBody {
  events?: Array<{
    resource?: { gid?: string; resource_type?: string };
    action?: string;
    change?: { field?: string; new_value?: unknown };
  }>;
}

export function parseAsanaWebhook(body: AsanaWebhookBody): WorkItem | undefined {
  const events = body.events ?? [];

  for (const event of events) {
    if (event.action !== "changed") continue;
    if (event.resource?.resource_type !== "task") continue;
    if (event.change?.field !== "assignee") continue;

    const gid = event.resource.gid;
    if (!gid) continue;

    return {
      id: gid,
      title: `Asana task ${gid}`,
      labels: [],
      source: "Asana",
    };
  }

  return undefined;
}
