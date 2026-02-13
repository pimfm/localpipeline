export interface JiraSearchResponse {
  issues: JiraIssue[];
}

export interface JiraIssue {
  key: string;
  self: string;
  fields: {
    summary: string;
    description?: unknown;
    status?: { name: string };
    priority?: { name: string };
    labels: string[];
    project?: { key: string; name: string };
  };
}
