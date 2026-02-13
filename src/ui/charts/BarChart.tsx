import React from "react";
import { Box, Text } from "ink";

interface BarChartItem {
  label: string;
  value: number;
}

interface Props {
  items: BarChartItem[];
  maxBarWidth?: number;
  color?: string;
}

export function BarChart({ items, maxBarWidth = 20, color = "cyan" }: Props) {
  if (items.length === 0) return <Text dimColor>No data</Text>;

  const maxValue = Math.max(...items.map((i) => i.value));
  const maxLabelLen = Math.max(...items.map((i) => i.label.length));

  return (
    <Box flexDirection="column">
      {items.map((item, i) => {
        const barLen = maxValue > 0 ? Math.round((item.value / maxValue) * maxBarWidth) : 0;
        const bar = "█".repeat(barLen);
        return (
          <Box key={i}>
            <Text>{item.label.padEnd(maxLabelLen)} </Text>
            <Text color={color}>{bar}</Text>
            <Text dimColor> {item.value}</Text>
          </Box>
        );
      })}
    </Box>
  );
}
