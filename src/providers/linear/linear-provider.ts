import type { WorkItem } from "../../model/work-item.js";
import type { WorkItemProvider, CardStatus } from "../provider.js";
import type { LinearGraphQLResponse } from "./linear-types.js";

const STATUS_TO_STATE: Record<CardStatus, string> = {
  in_progress: "In Progress",
  in_review: "In Review",
  done: "Done",
};

export class LinearProvider implements WorkItemProvider {
  name = "Linear";

  constructor(private apiKey: string) {}

  async fetchAssignedItems(): Promise<WorkItem[]> {
    const query = `{
      viewer {
        assignedIssues(
          filter: { state: { type: { nin: ["completed", "canceled"] } } }
          first: 50
        ) {
          nodes {
            id
            identifier
            title
            description
            priority
            url
            state { name }
            team { name }
            labels { nodes { name } }
          }
        }
      }
    }`;

    const res = await fetch("https://api.linear.app/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: this.apiKey,
      },
      body: JSON.stringify({ query }),
    });

    if (!res.ok) {
      throw new Error(`Linear API error: ${res.status} ${res.statusText}`);
    }

    const json: LinearGraphQLResponse = await res.json();
    const nodes = json.data?.viewer.assignedIssues.nodes ?? [];

    return nodes.map((issue) => ({
      id: issue.identifier,
      title: issue.title,
      description: issue.description?.slice(0, 500),
      status: issue.state?.name,
      priority: priorityLabel(issue.priority),
      labels: issue.labels?.nodes.map((l) => l.name) ?? [],
      source: "Linear",
      team: issue.team?.name,
      url: issue.url,
    }));
  }
  async addComment(itemId: string, comment: string): Promise<void> {
    // Linear work items use `identifier` (e.g. LIN-42) but comments need the internal UUID
    const lookupQuery = `{
      issues(filter: { identifier: { eq: "${itemId}" } }, first: 1) {
        nodes { id }
      }
    }`;

    const lookupRes = await fetch("https://api.linear.app/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: this.apiKey,
      },
      body: JSON.stringify({ query: lookupQuery }),
    });

    if (!lookupRes.ok) {
      throw new Error(`Linear API error: ${lookupRes.status} ${lookupRes.statusText}`);
    }

    const lookupJson = await lookupRes.json() as { data?: { issues: { nodes: { id: string }[] } } };
    const issueId = lookupJson.data?.issues.nodes[0]?.id;
    if (!issueId) {
      throw new Error(`Linear issue not found: ${itemId}`);
    }

    const mutation = `mutation {
      commentCreate(input: { issueId: "${issueId}", body: ${JSON.stringify(comment)} }) {
        success
      }
    }`;

    const res = await fetch("https://api.linear.app/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: this.apiKey,
      },
      body: JSON.stringify({ query: mutation }),
    });

    if (!res.ok) {
      throw new Error(`Linear API error: ${res.status} ${res.statusText}`);
    }
  }

  async moveItem(itemId: string, status: CardStatus): Promise<void> {
    const targetStateName = STATUS_TO_STATE[status];

    // Lookup the issue's internal UUID and team ID by identifier
    const lookupQuery = `{
      issues(filter: { identifier: { eq: "${itemId}" } }, first: 1) {
        nodes { id, team { id } }
      }
    }`;

    const lookupRes = await this.gql<{ issues: { nodes: { id: string; team: { id: string } }[] } }>(lookupQuery);
    const issue = lookupRes.issues.nodes[0];
    if (!issue) {
      throw new Error(`Linear issue not found: ${itemId}`);
    }

    // Find the workflow state by name for this team
    const stateQuery = `{
      workflowStates(filter: { team: { id: { eq: "${issue.team.id}" } }, name: { eq: "${targetStateName}" } }, first: 1) {
        nodes { id }
      }
    }`;

    const stateRes = await this.gql<{ workflowStates: { nodes: { id: string }[] } }>(stateQuery);
    const stateId = stateRes.workflowStates.nodes[0]?.id;
    if (!stateId) {
      throw new Error(`Linear workflow state "${targetStateName}" not found`);
    }

    // Update the issue state
    const mutation = `mutation {
      issueUpdate(id: "${issue.id}", input: { stateId: "${stateId}" }) {
        success
      }
    }`;

    await this.gql<{ issueUpdate: { success: boolean } }>(mutation);
  }

  private async gql<T>(query: string): Promise<T> {
    const res = await fetch("https://api.linear.app/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: this.apiKey,
      },
      body: JSON.stringify({ query }),
    });

    if (!res.ok) {
      throw new Error(`Linear API error: ${res.status} ${res.statusText}`);
    }

    const json = await res.json() as { data?: T };
    if (!json.data) {
      throw new Error("Linear API returned no data");
    }
    return json.data;
  }
}

function priorityLabel(priority: number): string {
  switch (priority) {
    case 1: return "Urgent";
    case 2: return "High";
    case 3: return "Medium";
    case 4: return "Low";
    default: return "None";
  }
}
