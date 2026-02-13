import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import { homedir } from "os";
import type { WorkItem } from "../model/work-item.js";
import { AgentStore } from "../agents/agent-store.js";
import { dispatchToAgent } from "../agents/dispatch.js";

const queuePath = join(homedir(), ".localpipeline", "queue.json");

interface QueueData {
  items: WorkItem[];
}

function loadQueue(): QueueData {
  try {
    return JSON.parse(readFileSync(queuePath, "utf-8"));
  } catch {
    return { items: [] };
  }
}

function saveQueue(data: QueueData): void {
  const dir = join(homedir(), ".localpipeline");
  mkdirSync(dir, { recursive: true });
  writeFileSync(queuePath, JSON.stringify(data, null, 2));
}

export async function webhookDispatch(item: WorkItem, repoRoot: string): Promise<{ dispatched: boolean; agent?: string }> {
  const store = new AgentStore();
  const freeAgent = store.getNextFreeAgent();

  if (!freeAgent) {
    const queue = loadQueue();
    queue.items.push(item);
    saveQueue(queue);
    return { dispatched: false };
  }

  await dispatchToAgent(freeAgent, item, repoRoot, store);
  return { dispatched: true, agent: freeAgent };
}

export function getQueue(): WorkItem[] {
  return loadQueue().items;
}

export function clearQueue(): void {
  saveQueue({ items: [] });
}
