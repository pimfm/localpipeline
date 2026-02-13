import { useState } from "react";
import { useInput, useApp } from "ink";

export type DashboardMode = "normal" | "time-expanded";

interface NavigationCallbacks {
  onEnter?: () => void;
  onComplete?: () => void;
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
      setMode((m) => (m === "normal" ? "time-expanded" : "normal"));
    }
    if (input === "c") {
      callbacks?.onComplete?.();
    }
  });

  const clampedIndex = Math.min(selectedIndex, Math.max(0, itemCount - 1));

  return { selectedIndex: clampedIndex, mode };
}
