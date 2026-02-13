export type AgentName = "ember" | "tide" | "gale" | "terra";

export type AgentStatus = "idle" | "provisioning" | "working" | "done" | "error";

export interface Agent {
  name: AgentName;
  status: AgentStatus;
  workItemId?: string;
  workItemTitle?: string;
  branch?: string;
  worktreePath?: string;
  pid?: number;
  startedAt?: string;
  error?: string;
}

export const AGENTS: Record<AgentName, { display: string; emoji: string; color: string }> = {
  ember: { display: "Ember", emoji: "🔥", color: "#FF7043" },
  tide: { display: "Tide", emoji: "🌊", color: "#4FC3F7" },
  gale: { display: "Gale", emoji: "💨", color: "#CE93D8" },
  terra: { display: "Terra", emoji: "🌿", color: "#81C784" },
};

export const AGENT_NAMES: AgentName[] = ["ember", "tide", "gale", "terra"];
