import { describe, it, expect, vi } from "vitest";
import { transitionCard } from "../agents/card-transitions.js";
import type { WorkItemProvider, CardStatus } from "../providers/provider.js";
import { parseGitHubPrMerge } from "../webhooks/handlers/github-handler.js";

function mockProvider(name: string, moveItem?: (id: string, status: CardStatus) => Promise<void>): WorkItemProvider {
  return {
    name,
    fetchAssignedItems: vi.fn().mockResolvedValue([]),
    moveItem,
  };
}

describe("transitionCard", () => {
  it("calls moveItem on the first provider that supports it", async () => {
    const move = vi.fn().mockResolvedValue(undefined);
    const providers = [
      mockProvider("NoMove"),
      mockProvider("WithMove", move),
    ];

    const result = await transitionCard("ITEM-1", "in_progress", providers);

    expect(result).toBe(true);
    expect(move).toHaveBeenCalledWith("ITEM-1", "in_progress");
  });

  it("tries next provider when first one throws", async () => {
    const failMove = vi.fn().mockRejectedValue(new Error("not found"));
    const successMove = vi.fn().mockResolvedValue(undefined);
    const providers = [
      mockProvider("Failing", failMove),
      mockProvider("Working", successMove),
    ];

    const result = await transitionCard("ITEM-2", "in_review", providers);

    expect(result).toBe(true);
    expect(failMove).toHaveBeenCalledWith("ITEM-2", "in_review");
    expect(successMove).toHaveBeenCalledWith("ITEM-2", "in_review");
  });

  it("returns false when no provider supports moveItem", async () => {
    const providers = [mockProvider("NoMove")];
    const result = await transitionCard("ITEM-3", "done", providers);
    expect(result).toBe(false);
  });

  it("returns false when all providers fail", async () => {
    const failMove = vi.fn().mockRejectedValue(new Error("failed"));
    const providers = [mockProvider("Fail1", failMove)];
    const result = await transitionCard("ITEM-4", "done", providers);
    expect(result).toBe(false);
  });

  it("returns false for empty providers list", async () => {
    const result = await transitionCard("ITEM-5", "in_progress", []);
    expect(result).toBe(false);
  });

  it("supports all CardStatus values", async () => {
    const move = vi.fn().mockResolvedValue(undefined);
    const providers = [mockProvider("P", move)];

    const statuses: CardStatus[] = ["in_progress", "in_review", "done"];
    for (const status of statuses) {
      await transitionCard("ITEM", status, providers);
      expect(move).toHaveBeenCalledWith("ITEM", status);
    }
  });
});

describe("parseGitHubPrMerge", () => {
  it("extracts work item ID from merged PR branch", () => {
    const result = parseGitHubPrMerge({
      action: "closed",
      pull_request: {
        merged: true,
        head: { ref: "agent/ember/LIN-42-fix-auth-flow" },
      },
    });
    expect(result).toEqual({ workItemId: "LIN-42" });
  });

  it("extracts short item ID from branch", () => {
    const result = parseGitHubPrMerge({
      action: "closed",
      pull_request: {
        merged: true,
        head: { ref: "agent/tide/abc12345-some-title" },
      },
    });
    expect(result).toEqual({ workItemId: "abc12345" });
  });

  it("returns undefined for non-closed actions", () => {
    const result = parseGitHubPrMerge({
      action: "opened",
      pull_request: {
        merged: false,
        head: { ref: "agent/ember/LIN-42-fix" },
      },
    });
    expect(result).toBeUndefined();
  });

  it("returns undefined for closed but not merged PRs", () => {
    const result = parseGitHubPrMerge({
      action: "closed",
      pull_request: {
        merged: false,
        head: { ref: "agent/ember/LIN-42-fix" },
      },
    });
    expect(result).toBeUndefined();
  });

  it("returns undefined for non-agent branches", () => {
    const result = parseGitHubPrMerge({
      action: "closed",
      pull_request: {
        merged: true,
        head: { ref: "feature/some-feature" },
      },
    });
    expect(result).toBeUndefined();
  });

  it("returns undefined when head ref is missing", () => {
    const result = parseGitHubPrMerge({
      action: "closed",
      pull_request: {
        merged: true,
      },
    });
    expect(result).toBeUndefined();
  });

  it("handles item IDs with hash prefix", () => {
    const result = parseGitHubPrMerge({
      action: "closed",
      pull_request: {
        merged: true,
        head: { ref: "agent/gale/#42-fix-issue" },
      },
    });
    expect(result).toEqual({ workItemId: "#42" });
  });
});
