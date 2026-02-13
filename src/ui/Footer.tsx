import React from "react";
import { Box, Text } from "ink";

interface FooterProps {
  canGoBack?: boolean;
  canGoForward?: boolean;
}

export function Footer({ canGoBack = false, canGoForward = false }: FooterProps) {
  return (
    <Box paddingX={1}>
      <Text dimColor>
        {canGoBack && "[←] back  "}
        {canGoForward && "[→] forward  "}
        [↑/↓] navigate  [enter] start/stop  [d] dispatch  [a] agents  [t] time  [r] refresh  [c] complete  [q/esc] quit
      </Text>
    </Box>
  );
}
