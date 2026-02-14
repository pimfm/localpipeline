import React from "react";
import { Box, Text } from "ink";
import type { DashboardMode, AgentSubMode } from "./hooks/use-navigation.js";

interface Props {
  canGoBack?: boolean;
  mode?: DashboardMode;
  agentSubMode?: AgentSubMode;
}

export function Footer({ canGoBack, mode, agentSubMode }: Props) {
  let hints: string;

  if (mode === "agents" && agentSubMode === "detail") {
    hints = "[↑/↓] scroll  [esc] back  [q] quit";
  } else if (mode === "agents") {
    hints = "[↑/↓] select agent  [enter] view log  [a/esc] back  [q] quit";
  } else {
    hints =
      (canGoBack ? "[esc/b] back  " : "") +
      "[↑/↓] navigate  [enter] start/stop  [d] dispatch  [a] agents  [t] time  [r] refresh  [c] complete" +
      (canGoBack ? "" : "  [q/esc] quit");
  }

  return (
    <Box paddingX={1}>
      <Text dimColor>{hints}</Text>
    </Box>
  );
}
