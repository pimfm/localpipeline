import { useState, useEffect, useCallback, useRef } from "react";
import type { Agent, AgentName } from "../../model/agent.js";
import type { WorkItem } from "../../model/work-item.js";
import { AgentStore } from "../../agents/agent-store.js";
import { dispatchToAgent } from "../../agents/dispatch.js";

interface UseAgentsResult {
  agents: Agent[];
  dispatchItem: (item: WorkItem) => void;
  isDispatching: boolean;
  flashMessage?: string;
  agentForItem: (item: WorkItem) => Agent | undefined;
  releaseAgent: (name: AgentName) => void;
}

export function useAgents(repoRoot?: string): UseAgentsResult {
  const storeRef = useRef<AgentStore | null>(null);
  if (!storeRef.current) {
    storeRef.current = new AgentStore();
  }
  const store = storeRef.current;

  const [agents, setAgents] = useState<Agent[]>(store.getAll());
  const [isDispatching, setIsDispatching] = useState(false);
  const [flashMessage, setFlashMessage] = useState<string | undefined>();

  // Poll for updates every 2s
  useEffect(() => {
    const interval = setInterval(() => {
      store.reload();
      setAgents(store.getAll());
    }, 2000);
    return () => clearInterval(interval);
  }, [store]);

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
      store.release(name);
      setAgents(store.getAll());
    },
    [store],
  );

  return { agents, dispatchItem, isDispatching, flashMessage, agentForItem, releaseAgent };
}
