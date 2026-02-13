export interface LinearGraphQLResponse {
  data?: {
    viewer: {
      assignedIssues: {
        nodes: LinearIssue[];
      };
    };
  };
}

export interface LinearIssue {
  id: string;
  identifier: string;
  title: string;
  description?: string;
  priority: number;
  url: string;
  state?: { name: string };
  team?: { name: string };
  labels?: { nodes: { name: string }[] };
}
