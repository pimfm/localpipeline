import type { AgentName } from "../model/agent.js";

export function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
}

export function branchName(agentName: AgentName, itemId: string, title: string): string {
  const slug = slugify(title);
  const shortId = itemId.slice(0, 8);
  return `agent/${agentName}/${shortId}-${slug}`;
}

export function worktreePath(repoRoot: string, agentName: AgentName): string {
  // Sibling directory: /Users/pim/fm/workflow/agent-ember/
  const parts = repoRoot.split("/");
  parts[parts.length - 1] = `agent-${agentName}`;
  return parts.join("/");
}
