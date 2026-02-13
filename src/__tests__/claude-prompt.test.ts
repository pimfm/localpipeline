import { describe, it, expect } from "vitest";
import { buildClaudePrompt } from "../agents/claude-prompt.js";
import type { WorkItem } from "../model/work-item.js";

describe("buildClaudePrompt", () => {
  const item: WorkItem = {
    id: "LIN-123",
    title: "Fix login bug",
    description: "Users can't log in with OAuth",
    status: "In Progress",
    priority: "High",
    labels: ["bug", "auth"],
    source: "Linear",
    team: "Platform",
    url: "https://linear.app/team/LIN-123",
  };

  it("includes item title and ID", () => {
    const prompt = buildClaudePrompt(item, "Ember");
    expect(prompt).toContain("# Fix login bug");
    expect(prompt).toContain("ID: LIN-123");
  });

  it("includes agent name", () => {
    const prompt = buildClaudePrompt(item, "Ember");
    expect(prompt).toContain('agent "Ember"');
  });

  it("includes source and URL", () => {
    const prompt = buildClaudePrompt(item, "Tide");
    expect(prompt).toContain("Source: Linear");
    expect(prompt).toContain("URL: https://linear.app/team/LIN-123");
  });

  it("includes labels and priority", () => {
    const prompt = buildClaudePrompt(item, "Gale");
    expect(prompt).toContain("Labels: bug, auth");
    expect(prompt).toContain("Priority: High");
  });

  it("includes description", () => {
    const prompt = buildClaudePrompt(item, "Terra");
    expect(prompt).toContain("Users can't log in with OAuth");
  });

  it("includes implementation instructions", () => {
    const prompt = buildClaudePrompt(item, "Ember");
    expect(prompt).toContain("CLAUDE.md");
    expect(prompt).toContain("npm test");
    expect(prompt).toContain("git push");
    expect(prompt).toContain("gh pr create");
  });

  it("handles minimal item", () => {
    const minimal: WorkItem = { id: "1", title: "Do thing", labels: [], source: "Test" };
    const prompt = buildClaudePrompt(minimal, "Ember");
    expect(prompt).toContain("# Do thing");
    expect(prompt).not.toContain("URL:");
    expect(prompt).not.toContain("Priority:");
  });
});
