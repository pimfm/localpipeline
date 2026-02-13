import { useState } from "react";
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
  const [mode, setMode] = useState<DashboardMode>("normal");

  useInput((input, key) => {
    if (input === "q" || key.escape) {
      exit();
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
      setMode((m) => (m === "time-expanded" ? "normal" : "time-expanded"));
    }
    if (input === "c") {
      callbacks?.onComplete?.();
    }
    if (input === "d") {
      callbacks?.onDispatch?.();
    }
    if (input === "a") {
      setMode((m) => (m === "agents" ? "normal" : "agents"));
    }
    if (input === "r") {
      callbacks?.onRefresh?.();
    }
  });

  const clampedIndex = Math.min(selectedIndex, Math.max(0, itemCount - 1));

  return { selectedIndex: clampedIndex, mode };
}
