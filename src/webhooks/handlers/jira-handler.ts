import type { WorkItem } from "../../model/work-item.js";

interface JiraWebhookBody {
  webhookEvent?: string;
  issue?: {
    key?: string;
    self?: string;
    fields?: {
      summary?: string;
      description?: string;
      status?: { name?: string };
      priority?: { name?: string };
      labels?: string[];
      project?: { name?: string };
    };
  };
  changelog?: {
    items?: Array<{ field?: string; toString?: string }>;
  };
}

export function parseJiraWebhook(body: JiraWebhookBody): WorkItem | undefined {
  if (body.webhookEvent !== "jira:issue_updated") return undefined;

  const changelog = body.changelog?.items ?? [];
  const hasAssigneeChange = changelog.some((item) => item.field === "assignee");
  const hasLabelChange = changelog.some((item) => item.field === "labels");

  if (!hasAssigneeChange && !hasLabelChange) return undefined;

  const issue = body.issue;
  if (!issue?.key) return undefined;

  const fields = issue.fields;
  const domain = issue.self ? new URL(issue.self).origin : "";

  return {
    id: issue.key,
    title: fields?.summary ?? issue.key,
    description: typeof fields?.description === "string" ? fields.description : undefined,
    status: fields?.status?.name,
    priority: fields?.priority?.name,
    labels: fields?.labels ?? [],
    source: "Jira",
    team: fields?.project?.name,
    url: domain ? `${domain}/browse/${issue.key}` : undefined,
  };
}
