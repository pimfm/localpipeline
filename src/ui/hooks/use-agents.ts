import { useState, useEffect, useCallback, useRef } from "react";
import type { Agent, AgentName } from "../../model/agent.js";
import type { WorkItem } from "../../model/work-item.js";
import type { WorkItemProvider } from "../../providers/provider.js";
import { AgentStore } from "../../agents/agent-store.js";
import { dispatchToAgent, retryAgent } from "../../agents/dispatch.js";
import { appendEvent } from "../../persistence/agent-log.js";
import { FailureStore } from "../../persistence/failure-store.js";
import { RetryScheduler } from "../../agents/retry-scheduler.js";
import { dequeue } from "../../webhooks/webhook-dispatcher.js";

export const MAX_RETRIES = 3;

interface UseAgentsResult {
  agents: Agent[];
  dispatchItem: (item: WorkItem) => void;
  isDispatching: boolean;
  flashMessage?: string;
  agentForItem: (item: WorkItem) => Agent | undefined;
  releaseAgent: (name: AgentName) => void;
  retryScheduler: RetryScheduler;
}

export function useAgents(repoRoot?: string, providers?: WorkItemProvider[]): UseAgentsResult {
  const storeRef = useRef<AgentStore | null>(null);
  if (!storeRef.current) {
    storeRef.current = new AgentStore();
  }
  const store = storeRef.current;

  const schedulerRef = useRef<RetryScheduler | null>(null);
  if (!schedulerRef.current) {
    schedulerRef.current = new RetryScheduler();
  }
  const scheduler = schedulerRef.current;

  const failureStoreRef = useRef<FailureStore | null>(null);
  if (!failureStoreRef.current) {
    failureStoreRef.current = new FailureStore();
  }
  const failureStore = failureStoreRef.current;

  const [agents, setAgents] = useState<Agent[]>(store.getAll());
  const [isDispatching, setIsDispatching] = useState(false);
  const [flashMessage, setFlashMessage] = useState<string | undefined>();
  const retryingRef = useRef<Set<AgentName>>(new Set());

  // Poll for updates every 2s
  useEffect(() => {
    const root = repoRoot ?? process.cwd();

    const interval = setInterval(() => {
      store.reload();
      const current = store.getAll();

      for (const agent of current) {
        // Auto-release done agents and try to drain the queue
        if (agent.status === "done") {
          appendEvent({
            timestamp: new Date().toISOString(),
            agent: agent.name,
            event: "released",
            workItemId: agent.workItemId,
            workItemTitle: agent.workItemTitle,
            message: "Auto-released after completion",
          });
          store.release(agent.name);
          drainQueue(store, root);
        }

        // Schedule retry for errored agents (with backoff)
        if (agent.status === "error" && !retryingRef.current.has(agent.name) && !scheduler.isScheduled(agent.name)) {
          const retryCount = agent.retryCount ?? 0;

          if (retryCount < MAX_RETRIES) {
            const attempt = retryCount + 1;
            const schedule = scheduler.schedule(agent.name, attempt);
            const delaySec = Math.ceil((schedule.retryAt - Date.now()) / 1000);
            appendEvent({
              timestamp: new Date().toISOString(),
              agent: agent.name,
              event: "retry",
              workItemId: agent.workItemId,
              workItemTitle: agent.workItemTitle,
              message: `Retry ${attempt}/${MAX_RETRIES} scheduled (${delaySec}s backoff): ${agent.error ?? "Unknown error"}`,
            });
          } else {
            // Max retries exceeded — log, comment, and release
            retryingRef.current.add(agent.name);
            appendEvent({
              timestamp: new Date().toISOString(),
              agent: agent.name,
              event: "max-retries",
              workItemId: agent.workItemId,
              workItemTitle: agent.workItemTitle,
              message: `Failed after ${MAX_RETRIES} attempts: ${agent.error ?? "Unknown error"}`,
            });

            // Record structured failure
            failureStore.record({
              id: agent.workItemId ?? "unknown",
              title: agent.workItemTitle ?? "Unknown",
              agent: agent.name,
              attempts: MAX_RETRIES,
              lastError: agent.error ?? "Unknown error",
              failedAt: new Date().toISOString(),
              branch: agent.branch,
            });

            handleMaxRetriesExceeded(agent, providers ?? [])
              .finally(() => {
                appendEvent({
                  timestamp: new Date().toISOString(),
                  agent: agent.name,
                  event: "released",
                  workItemId: agent.workItemId,
                  workItemTitle: agent.workItemTitle,
                  message: "Released after max retries exceeded",
                });
                store.release(agent.name);
                retryingRef.current.delete(agent.name);
                drainQueue(store, root);
              });
          }
        }

        // Fire scheduled retries whose backoff has elapsed
        const ready = scheduler.getReady();
        for (const schedule of ready) {
          if (retryingRef.current.has(schedule.agentName)) continue;
          const a = store.getAgent(schedule.agentName);
          if (a.status !== "error") {
            scheduler.cancel(schedule.agentName);
            continue;
          }

          retryingRef.current.add(schedule.agentName);
          scheduler.cancel(schedule.agentName);
          store.incrementRetry(schedule.agentName);

          appendEvent({
            timestamp: new Date().toISOString(),
            agent: schedule.agentName,
            event: "retry",
            workItemId: a.workItemId,
            workItemTitle: a.workItemTitle,
            message: `Retry ${schedule.attempt}/${MAX_RETRIES} starting now`,
          });

          retryAgent(schedule.agentName, root, store)
            .catch(() => {
              // retryAgent already marks error via markError
            })
            .finally(() => {
              retryingRef.current.delete(schedule.agentName);
            });
        }
      }

      setAgents(store.getAll());
    }, 2000);
    return () => clearInterval(interval);
  }, [store, repoRoot, providers, scheduler, failureStore]);

  const dispatchItem = useCallback(
    (item: WorkItem) => {
      const root = repoRoot ?? process.cwd();
      const freeAgent = store.getNextFreeAgent();
      if (!freeAgent) {
        setFlashMessage("All agents are busy");
        setTimeout(() => setFlashMessage(undefined), 3000);
        return;
      }

      setIsDispatching(true);
      dispatchToAgent(freeAgent, item, root, store).finally(() => {
        store.reload();
        setAgents(store.getAll());
        setIsDispatching(false);
      });
    },
    [store, repoRoot],
  );

  const agentForItem = useCallback(
    (item: WorkItem) => {
      return agents.find((a) => a.workItemId === item.id && a.status !== "idle");
    },
    [agents],
  );

  const releaseAgent = useCallback(
    (name: AgentName) => {
      scheduler.cancel(name);
      retryingRef.current.delete(name);
      store.release(name);
      setAgents(store.getAll());
      drainQueue(store, repoRoot ?? process.cwd());
    },
    [store, scheduler, repoRoot],
  );

  return { agents, dispatchItem, isDispatching, flashMessage, agentForItem, releaseAgent, retryScheduler: scheduler };
}

async function handleMaxRetriesExceeded(agent: Agent, providers: WorkItemProvider[]): Promise<void> {
  const errorMsg = agent.error ?? "Unknown error";
  const comment = `Agent ${agent.name} failed after ${MAX_RETRIES} attempts: ${errorMsg}`;

  // Comment on the work item if we can find a matching provider
  if (agent.workItemId) {
    for (const provider of providers) {
      if (provider.addComment) {
        try {
          await provider.addComment(agent.workItemId, comment);
          break;
        } catch {
          // Provider didn't match or API failed — try next
        }
      }
    }
  }
}

/** Pick the next queued work item and dispatch it if an agent is free. */
function drainQueue(store: AgentStore, repoRoot: string): void {
  const freeAgent = store.getNextFreeAgent();
  if (!freeAgent) return;

  const item = dequeue();
  if (!item) return;

  dispatchToAgent(freeAgent, item, repoRoot, store).catch(() => {
    // Dispatch failure is already handled by markError in dispatch.ts
  });
}
