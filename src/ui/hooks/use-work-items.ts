import { useState, useEffect, useCallback, useRef } from "react";
import type { WorkItem } from "../../model/work-item.js";
import type { WorkItemProvider } from "../../providers/provider.js";

export type FetchState =
  | { status: "loading" }
  | { status: "ready"; items: WorkItem[] }
  | { status: "refreshing"; items: WorkItem[] }
  | { status: "error"; message: string };

export function useWorkItems(providers: WorkItemProvider[]): FetchState & { refresh: () => void } {
  const [state, setState] = useState<FetchState>({ status: "loading" });
  const providersRef = useRef(providers);
  providersRef.current = providers;

  const fetchItems = useCallback((isRefresh: boolean) => {
    const ps = providersRef.current;
    if (ps.length === 0) {
      setState({ status: "ready", items: [] });
      return;
    }

    if (isRefresh) {
      setState((prev) => {
        const prevItems = "items" in prev ? prev.items : [];
        return { status: "refreshing", items: prevItems };
      });
    }

    Promise.allSettled(
      ps.map((p) => p.fetchAssignedItems()),
    ).then((results) => {
      const items: WorkItem[] = [];
      for (const result of results) {
        if (result.status === "fulfilled") {
          items.push(...result.value);
        }
      }
      setState({ status: "ready", items });
    });
  }, []);

  useEffect(() => {
    fetchItems(false);
  }, [fetchItems]);

  const refresh = useCallback(() => {
    fetchItems(true);
  }, [fetchItems]);

  return { ...state, refresh };
}
