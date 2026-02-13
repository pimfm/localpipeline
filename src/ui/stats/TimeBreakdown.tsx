import React from "react";
import { Box, Text } from "ink";
import { formatMinutes } from "../../utils/time-stats.js";

interface Props {
  items: { label: string; minutes: number }[];
  title: string;
  limit?: number;
}

export function TimeBreakdown({ items, title, limit = 5 }: Props) {
  const sorted = [...items].sort((a, b) => b.minutes - a.minutes).slice(0, limit);

  return (
    <Box flexDirection="column">
      <Text bold>{title}</Text>
      {sorted.length === 0 && <Text dimColor>No entries yet</Text>}
      {sorted.map((item, i) => (
        <Box key={i}>
          <Text dimColor>{String(i + 1).padStart(2)}. </Text>
          <Text>{formatMinutes(item.minutes)} </Text>
          <Text>{item.label}</Text>
        </Box>
      ))}
    </Box>
  );
}
