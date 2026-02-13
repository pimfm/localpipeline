import type { WorkItem } from "../../model/work-item.js";

interface GitHubWebhookBody {
  action?: string;
  issue?: {
    number?: number;
    title?: string;
    body?: string;
    html_url?: string;
    labels?: Array<{ name?: string }>;
    state?: string;
  };
  repository?: {
    full_name?: string;
  };
}

export function parseGitHubWebhook(body: GitHubWebhookBody): WorkItem | undefined {
  const action = body.action;
  if (action !== "assigned" && action !== "labeled") return undefined;

  const issue = body.issue;
  if (!issue?.number || !issue?.title) return undefined;

  return {
    id: `#${issue.number}`,
    title: issue.title,
    description: issue.body ?? undefined,
    status: issue.state,
    labels: issue.labels?.map((l) => l.name).filter((n): n is string => !!n) ?? [],
    source: "GitHub",
    team: body.repository?.full_name,
    url: issue.html_url,
  };
}
