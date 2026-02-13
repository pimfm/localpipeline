import React from "react";
import { Box, Text } from "ink";

interface Props {
  items: string[];
  canGoBack: boolean;
  canGoForward: boolean;
}

export function Breadcrumbs({ items, canGoBack, canGoForward }: Props) {
  if (items.length <= 1) return null;

  return (
    <Box>
      {canGoBack && <Text dimColor>{"← "}</Text>}
      {items.map((item, i) => (
        <React.Fragment key={i}>
          {i > 0 && <Text dimColor>{" › "}</Text>}
          {i === items.length - 1 ? (
            <Text bold color="cyan">{item}</Text>
          ) : (
            <Text dimColor>{item}</Text>
          )}
        </React.Fragment>
      ))}
      {canGoForward && <Text dimColor>{" →"}</Text>}
    </Box>
  );
}
