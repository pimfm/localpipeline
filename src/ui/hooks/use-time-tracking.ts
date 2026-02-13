import { useState, useCallback } from "react";
import type { ActiveTimer } from "../../model/time-entry.js";
import type { WorkItem } from "../../model/work-item.js";
import type { TimeStore } from "../../persistence/time-store.js";

export function useTimeTracking(store: TimeStore) {
  const [activeTimer, setActiveTimer] = useState<ActiveTimer | undefined>(store.getActiveTimer());

  const toggleTimer = useCallback(
    (item: WorkItem) => {
      if (activeTimer && activeTimer.workItemId === item.id && activeTimer.workItemSource === item.source) {
        store.stopTimer();
        setActiveTimer(undefined);
      } else {
        const timer = store.startTimer(item.id, item.source, item.title);
        setActiveTimer(timer);
      }
    },
    [activeTimer, store]
  );

  const stopTimer = useCallback(() => {
    if (activeTimer) {
      store.stopTimer();
      setActiveTimer(undefined);
    }
  }, [activeTimer, store]);

  const isTrackingItem = useCallback(
    (item: WorkItem) =>
      activeTimer !== undefined &&
      activeTimer.workItemId === item.id &&
      activeTimer.workItemSource === item.source,
    [activeTimer]
  );

  return { activeTimer, toggleTimer, stopTimer, isTrackingItem };
}
