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
  pull_request?: {
    merged?: boolean;
    title?: string;
    body?: string;
    html_url?: string;
  };
  repository?: {
    full_name?: string;
  };
}

export interface PrMergeEvent {
  workItemId: string;
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

/**
 * Detect a PR merge event and extract the associated work item ID
 * from the branch name (agent/{name}/{itemId}-{slug}).
 */
export function parseGitHubPrMerge(body: GitHubWebhookBody & { pull_request?: { merged?: boolean; head?: { ref?: string } } }): PrMergeEvent | undefined {
  if (body.action !== "closed") return undefined;
  if (!body.pull_request?.merged) return undefined;

  const branch = body.pull_request.head?.ref;
  if (!branch) return undefined;

  // Branch format: agent/{agentName}/{shortId}-{slug}
  // shortId can contain hyphens (e.g. LIN-42), slug is always lowercase
  const match = branch.match(/^agent\/\w+\/(.+?)-[a-z]/);
  if (!match) return undefined;

  return { workItemId: match[1]! };
}
