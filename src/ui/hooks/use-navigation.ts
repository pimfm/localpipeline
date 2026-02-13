import { useState, useCallback } from "react";
import { useInput, useApp } from "ink";

export type DashboardMode = "normal" | "time-expanded" | "agents";

interface NavigationCallbacks {
  onEnter?: () => void;
  onComplete?: () => void;
  onDispatch?: () => void;
  onRefresh?: () => void;
}

export function useNavigation(itemCount: number, callbacks?: NavigationCallbacks) {
  const { exit } = useApp();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [history, setHistory] = useState<DashboardMode[]>(["normal"]);
  const [forward, setForward] = useState<DashboardMode[]>([]);

  const mode = history[history.length - 1]!;

  const navigateTo = useCallback((target: DashboardMode) => {
    setHistory((h) => [...h, target]);
    setForward([]);
  }, []);

  const navigateBack = useCallback(() => {
    setHistory((h) => {
      if (h.length <= 1) return h;
      const popped = h[h.length - 1]!;
      setForward((f) => [popped, ...f]);
      return h.slice(0, -1);
    });
  }, []);

  const navigateForward = useCallback(() => {
    setForward((f) => {
      if (f.length === 0) return f;
      const next = f[0]!;
      setHistory((h) => [...h, next]);
      return f.slice(1);
    });
  }, []);

  useInput((input, key) => {
    if (input === "q" || key.escape) {
      exit();
      return;
    }

    if (key.leftArrow) {
      navigateBack();
      return;
    }
    if (key.rightArrow) {
      navigateForward();
      return;
    }

    if (key.upArrow) {
      setSelectedIndex((i) => Math.max(0, i - 1));
    }
    if (key.downArrow) {
      setSelectedIndex((i) => Math.min(itemCount - 1, i + 1));
    }
    if (key.return) {
      callbacks?.onEnter?.();
    }
    if (input === "t") {
      if (mode === "time-expanded") {
        navigateBack();
      } else {
        navigateTo("time-expanded");
      }
    }
    if (input === "c") {
      callbacks?.onComplete?.();
    }
    if (input === "d") {
      callbacks?.onDispatch?.();
    }
    if (input === "a") {
      if (mode === "agents") {
        navigateBack();
      } else {
        navigateTo("agents");
      }
    }
    if (input === "r") {
      callbacks?.onRefresh?.();
    }
  });

  const clampedIndex = Math.min(selectedIndex, Math.max(0, itemCount - 1));

  const breadcrumbs = history.map((m) =>
    m === "normal" ? "Dashboard" : m === "time-expanded" ? "Time" : "Agents",
  );

  return {
    selectedIndex: clampedIndex,
    mode,
    breadcrumbs,
    canGoBack: history.length > 1,
    canGoForward: forward.length > 0,
  };
}
