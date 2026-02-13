import { describe, it, expect } from "vitest";
import { parseTrelloWebhook } from "../webhooks/handlers/trello-handler.js";
import { parseJiraWebhook } from "../webhooks/handlers/jira-handler.js";
import { parseLinearWebhook } from "../webhooks/handlers/linear-handler.js";
import { parseClickUpWebhook } from "../webhooks/handlers/clickup-handler.js";
import { parseAsanaWebhook } from "../webhooks/handlers/asana-handler.js";
import { parseGitHubWebhook } from "../webhooks/handlers/github-handler.js";

describe("Trello webhook handler", () => {
  it("parses addMemberToCard event", () => {
    const result = parseTrelloWebhook({
      action: {
        type: "addMemberToCard",
        data: {
          card: { id: "abc12345678", name: "Fix bug", desc: "Description", shortUrl: "https://trello.com/c/abc" },
          board: { name: "Dev Board" },
        },
      },
    });
    expect(result).toBeDefined();
    expect(result!.id).toBe("abc12345");
    expect(result!.title).toBe("Fix bug");
    expect(result!.source).toBe("Trello");
    expect(result!.team).toBe("Dev Board");
  });

  it("parses addLabelToCard event", () => {
    const result = parseTrelloWebhook({
      action: {
        type: "addLabelToCard",
        data: {
          card: { id: "xyz98765432", name: "Add feature" },
          label: { name: "urgent" },
        },
      },
    });
    expect(result).toBeDefined();
    expect(result!.labels).toEqual(["urgent"]);
  });

  it("ignores unknown events", () => {
    expect(parseTrelloWebhook({ action: { type: "updateCard" } })).toBeUndefined();
  });
});

describe("Jira webhook handler", () => {
  it("parses assignee change", () => {
    const result = parseJiraWebhook({
      webhookEvent: "jira:issue_updated",
      issue: {
        key: "PROJ-42",
        self: "https://mycompany.atlassian.net/rest/api/3/issue/12345",
        fields: {
          summary: "Login broken",
          status: { name: "To Do" },
          priority: { name: "High" },
          labels: ["backend"],
          project: { name: "Project X" },
        },
      },
      changelog: {
        items: [{ field: "assignee", toString: "user@example.com" }],
      },
    });
    expect(result).toBeDefined();
    expect(result!.id).toBe("PROJ-42");
    expect(result!.title).toBe("Login broken");
    expect(result!.source).toBe("Jira");
    expect(result!.priority).toBe("High");
    expect(result!.url).toBe("https://mycompany.atlassian.net/browse/PROJ-42");
  });

  it("parses label change", () => {
    const result = parseJiraWebhook({
      webhookEvent: "jira:issue_updated",
      issue: { key: "PROJ-1", fields: { summary: "Task" } },
      changelog: { items: [{ field: "labels" }] },
    });
    expect(result).toBeDefined();
  });

  it("ignores non-relevant changes", () => {
    const result = parseJiraWebhook({
      webhookEvent: "jira:issue_updated",
      issue: { key: "PROJ-1" },
      changelog: { items: [{ field: "status" }] },
    });
    expect(result).toBeUndefined();
  });

  it("ignores non-update events", () => {
    expect(parseJiraWebhook({ webhookEvent: "jira:issue_created" })).toBeUndefined();
  });
});

describe("Linear webhook handler", () => {
  it("parses label change on issue", () => {
    const result = parseLinearWebhook({
      type: "Issue",
      action: "update",
      data: {
        identifier: "LIN-99",
        title: "Refactor auth",
        priority: 2,
        url: "https://linear.app/team/LIN-99",
        state: { name: "In Progress" },
        team: { name: "Backend" },
        labels: [{ name: "tech-debt" }],
      },
      updatedFrom: { labelIds: ["old-label-id"] },
    });
    expect(result).toBeDefined();
    expect(result!.id).toBe("LIN-99");
    expect(result!.priority).toBe("High");
    expect(result!.labels).toEqual(["tech-debt"]);
  });

  it("ignores non-label updates", () => {
    const result = parseLinearWebhook({
      type: "Issue",
      action: "update",
      data: { identifier: "LIN-1", title: "Task" },
    });
    expect(result).toBeUndefined();
  });
});

describe("ClickUp webhook handler", () => {
  it("parses taskAssigneeUpdated", () => {
    const result = parseClickUpWebhook({
      event: "taskAssigneeUpdated",
      task_id: "abc123",
    });
    expect(result).toBeDefined();
    expect(result!.id).toBe("abc123");
    expect(result!.source).toBe("ClickUp");
  });

  it("parses taskTagUpdated", () => {
    const result = parseClickUpWebhook({
      event: "taskTagUpdated",
      task_id: "def456",
    });
    expect(result).toBeDefined();
  });

  it("ignores unknown events", () => {
    expect(parseClickUpWebhook({ event: "taskCreated", task_id: "x" })).toBeUndefined();
  });
});

describe("Asana webhook handler", () => {
  it("parses assignee change", () => {
    const result = parseAsanaWebhook({
      events: [
        {
          resource: { gid: "12345", resource_type: "task" },
          action: "changed",
          change: { field: "assignee", new_value: { gid: "user1" } },
        },
      ],
    });
    expect(result).toBeDefined();
    expect(result!.id).toBe("12345");
    expect(result!.source).toBe("Asana");
  });

  it("ignores non-assignee changes", () => {
    const result = parseAsanaWebhook({
      events: [
        {
          resource: { gid: "12345", resource_type: "task" },
          action: "changed",
          change: { field: "name" },
        },
      ],
    });
    expect(result).toBeUndefined();
  });
});

describe("GitHub webhook handler", () => {
  it("parses issue assigned event", () => {
    const result = parseGitHubWebhook({
      action: "assigned",
      issue: {
        number: 42,
        title: "Bug in login",
        body: "Steps to reproduce...",
        html_url: "https://github.com/org/repo/issues/42",
        labels: [{ name: "bug" }],
        state: "open",
      },
      repository: { full_name: "org/repo" },
    });
    expect(result).toBeDefined();
    expect(result!.id).toBe("#42");
    expect(result!.title).toBe("Bug in login");
    expect(result!.source).toBe("GitHub");
    expect(result!.labels).toEqual(["bug"]);
    expect(result!.team).toBe("org/repo");
  });

  it("parses issue labeled event", () => {
    const result = parseGitHubWebhook({
      action: "labeled",
      issue: { number: 10, title: "Feature request" },
    });
    expect(result).toBeDefined();
  });

  it("ignores other actions", () => {
    expect(parseGitHubWebhook({ action: "opened", issue: { number: 1, title: "New" } })).toBeUndefined();
  });
});
