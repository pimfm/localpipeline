import { appendFileSync, readFileSync, mkdirSync } from "fs";
import { join } from "path";
import { homedir } from "os";
import type { AgentName } from "../model/agent.js";

export type AgentEventType =
  | "dispatched"
  | "provisioning"
  | "working"
  | "done"
  | "error"
  | "retry"
  | "max-retries"
  | "released";

export interface AgentEvent {
  timestamp: string;
  agent: AgentName;
  event: AgentEventType;
  workItemId?: string;
  workItemTitle?: string;
  message?: string;
}

function logPath(): string {
  const dir = join(homedir(), ".localpipeline");
  mkdirSync(dir, { recursive: true });
  return join(dir, "agent-activity.jsonl");
}

export function appendEvent(event: AgentEvent): void {
  appendFileSync(logPath(), JSON.stringify(event) + "\n");
}

export function readEvents(agent?: AgentName, limit?: number): AgentEvent[] {
  let lines: string[];
  try {
    lines = readFileSync(logPath(), "utf-8").split("\n").filter(Boolean);
  } catch {
    return [];
  }

  let events: AgentEvent[] = [];
  for (const line of lines) {
    try {
      events.push(JSON.parse(line));
    } catch {
      // skip malformed lines
    }
  }

  if (agent) {
    events = events.filter((e) => e.agent === agent);
  }

  if (limit && limit > 0) {
    events = events.slice(-limit);
  }

  return events;
}

export function readEventsForAgent(agent: AgentName, limit?: number): AgentEvent[] {
  return readEvents(agent, limit);
}
