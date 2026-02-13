import { useState, useEffect } from "react";
import type { DashboardAnalytics } from "../../model/analytics.js";
import type { WakaTimeProvider } from "../../providers/analytics/wakatime-provider.js";
import type { RescueTimeProvider } from "../../providers/analytics/rescuetime-provider.js";
import type { TimeStore } from "../../persistence/time-store.js";
import type { TimeStats } from "../../model/time-entry.js";
import { computeTimeStats } from "../../utils/time-stats.js";

interface AnalyticsState {
  loading: boolean;
  analytics: DashboardAnalytics;
  localStats: TimeStats;
}

export function useAnalytics(
  store: TimeStore,
  wakatime?: WakaTimeProvider,
  rescuetime?: RescueTimeProvider
): AnalyticsState {
  const [state, setState] = useState<AnalyticsState>({
    loading: true,
    analytics: {},
    localStats: { totalMinutes: 0, entriesByDay: new Map(), entriesByWorkItem: new Map(), entriesBySource: new Map() },
  });

  useEffect(() => {
    const promises: Promise<void>[] = [];

    const analytics: DashboardAnalytics = {};

    if (wakatime) {
      promises.push(
        wakatime
          .fetchStats()
          .then((stats) => { analytics.wakatime = stats; })
          .catch(() => {})
      );
    }

    if (rescuetime) {
      promises.push(
        rescuetime
          .fetchStats()
          .then((stats) => { analytics.rescuetime = stats; })
          .catch(() => {})
      );
    }

    Promise.allSettled(promises).then(() => {
      const entries = store.getAllEntries();
      const localStats = computeTimeStats(entries);
      setState({ loading: false, analytics, localStats });
    });
  }, [store, wakatime, rescuetime]);

  return state;
}
