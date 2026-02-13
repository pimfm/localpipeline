import React from "react";
import { Box, Text } from "ink";

export function Footer() {
  return (
    <Box paddingX={1}>
      <Text dimColor>[↑/↓] navigate  [enter] start/stop  [d] dispatch  [a] agents  [t] time  [r] refresh  [c] complete  [q/esc] quit</Text>
    </Box>
  );
}
