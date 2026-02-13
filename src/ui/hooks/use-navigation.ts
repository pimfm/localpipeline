import { useState, useCallback } from "react";
import { useInput, useApp } from "ink";

export type DashboardMode = "normal" | "time-expanded" | "agents";

const MODE_LABELS: Record<DashboardMode, string> = {
  normal: "Dashboard",
  "time-expanded": "Time Analytics",
  agents: "Agents",
};

interface NavigationCallbacks {
  onEnter?: () => void;
  onComplete?: () => void;
  onDispatch?: () => void;
  onRefresh?: () => void;
}

export function useNavigation(itemCount: number, callbacks?: NavigationCallbacks) {
  const { exit } = useApp();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [mode, setMode] = useState<DashboardMode>("normal");
  const [history, setHistory] = useState<DashboardMode[]>([]);
  const [forward, setForward] = useState<DashboardMode[]>([]);

  const navigateTo = useCallback((target: DashboardMode) => {
    setMode((current) => {
      if (current === target) return current;
      setHistory((h) => [...h, current]);
      setForward([]);
      return target;
    });
  }, []);

  const navigateBack = useCallback(() => {
    setHistory((h) => {
      if (h.length === 0) return h;
      const prev = h[h.length - 1]!;
      setMode((current) => {
        setForward((f) => [current, ...f]);
        return prev;
      });
      return h.slice(0, -1);
    });
  }, []);

  const navigateForward = useCallback(() => {
    setForward((f) => {
      if (f.length === 0) return f;
      const next = f[0]!;
      setMode((current) => {
        setHistory((h) => [...h, current]);
        return next;
      });
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
      navigateTo(mode === "time-expanded" ? "normal" : "time-expanded");
    }
    if (input === "c") {
      callbacks?.onComplete?.();
    }
    if (input === "d") {
      callbacks?.onDispatch?.();
    }
    if (input === "a") {
      navigateTo(mode === "agents" ? "normal" : "agents");
    }
    if (input === "r") {
      callbacks?.onRefresh?.();
    }
  });

  const clampedIndex = Math.min(selectedIndex, Math.max(0, itemCount - 1));

  const breadcrumbs = [...history.map((m) => MODE_LABELS[m]), MODE_LABELS[mode]];
  const canGoBack = history.length > 0;
  const canGoForward = forward.length > 0;

  return { selectedIndex: clampedIndex, mode, breadcrumbs, canGoBack, canGoForward };
}
