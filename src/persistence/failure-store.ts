import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import { homedir } from "os";
import type { AgentName } from "../model/agent.js";

export interface FailureRecord {
  id: string; // workItemId
  title: string;
  agent: AgentName;
  attempts: number;
  lastError: string;
  failedAt: string;
  branch?: string;
}

interface FailureData {
  failures: FailureRecord[];
}

/**
 * Persistent store for work items that exhausted all retry attempts.
 * Keeps a queryable JSON log so failures don't vanish when the agent
 * is released back to idle.
 */
export class FailureStore {
  private filePath: string;
  private data: FailureData;

  constructor(customPath?: string) {
    if (customPath) {
      this.filePath = customPath;
    } else {
      const dir = join(homedir(), ".localpipeline");
      mkdirSync(dir, { recursive: true });
      this.filePath = join(dir, "failures.json");
    }
    this.data = this.load();
  }

  private load(): FailureData {
    try {
      return JSON.parse(readFileSync(this.filePath, "utf-8"));
    } catch {
      return { failures: [] };
    }
  }

  private save(): void {
    writeFileSync(this.filePath, JSON.stringify(this.data, null, 2));
  }

  record(failure: FailureRecord): void {
    // Replace existing record for same work item, or append
    const idx = this.data.failures.findIndex((f) => f.id === failure.id);
    if (idx >= 0) {
      this.data.failures[idx] = failure;
    } else {
      this.data.failures.push(failure);
    }
    this.save();
  }

  getAll(): FailureRecord[] {
    return [...this.data.failures];
  }

  getByAgent(agent: AgentName): FailureRecord[] {
    return this.data.failures.filter((f) => f.agent === agent);
  }

  remove(workItemId: string): boolean {
    const before = this.data.failures.length;
    this.data.failures = this.data.failures.filter((f) => f.id !== workItemId);
    if (this.data.failures.length !== before) {
      this.save();
      return true;
    }
    return false;
  }

  clear(): void {
    this.data = { failures: [] };
    this.save();
  }

  reload(): void {
    this.data = this.load();
  }
}
