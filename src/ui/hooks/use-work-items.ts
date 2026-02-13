import { useState, useEffect } from "react";
import type { WorkItem } from "../../model/work-item.js";
import type { WorkItemProvider } from "../../providers/provider.js";

export type FetchState =
  | { status: "loading" }
  | { status: "ready"; items: WorkItem[] }
  | { status: "error"; message: string };

export function useWorkItems(providers: WorkItemProvider[]): FetchState {
  const [state, setState] = useState<FetchState>({ status: "loading" });

  useEffect(() => {
    if (providers.length === 0) {
      setState({ status: "ready", items: [] });
      return;
    }

    const controller = new AbortController();

    Promise.allSettled(
      providers.map((p) => p.fetchAssignedItems()),
    ).then((results) => {
      if (controller.signal.aborted) return;

      const items: WorkItem[] = [];
      for (const result of results) {
        if (result.status === "fulfilled") {
          items.push(...result.value);
        }
      }
      setState({ status: "ready", items });
    });

    return () => controller.abort();
  }, []);

  return state;
}
