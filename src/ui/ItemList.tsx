import React from "react";
import { Box, Text, useStdout } from "ink";
import type { WorkItem } from "../model/work-item.js";
import type { Agent } from "../model/agent.js";
import { AGENTS } from "../model/agent.js";
import { sourceColor } from "./theme.js";

interface Props {
  items: WorkItem[];
  selectedIndex: number;
  height: number;
  isTrackingItem?: (item: WorkItem) => boolean;
  agentForItem?: (item: WorkItem) => Agent | undefined;
}

export function ItemList({ items, selectedIndex, height, isTrackingItem, agentForItem }: Props) {
  const { stdout } = useStdout();
  const cols = stdout.columns ?? 80;
  // Panel takes ~50% of terminal width; subtract borders (4) + padding (2) + selector (2) + source (10) + spacing
  const titleMaxWidth = Math.max(10, Math.floor(cols * 0.5) - 24);

  const maxVisible = height;

  const scrollOffset = (() => {
    if (selectedIndex < maxVisible / 2) return 0;
    if (selectedIndex > items.length - maxVisible / 2) {
      return Math.max(0, items.length - maxVisible);
    }
    return Math.max(0, selectedIndex - Math.floor(maxVisible / 2));
  })();

  const visibleEnd = Math.min(scrollOffset + maxVisible, items.length);
  const visibleStart = scrollOffset + 1;
  const visibleItems = items.slice(scrollOffset, visibleEnd);

  return (
    <Box flexDirection="column" borderStyle="round" borderColor="cyan" width="50%" height={height + 3} overflow="hidden">
      <Box paddingX={1}>
        <Text bold>
          Work Items {visibleStart}-{visibleEnd}/{items.length}
        </Text>
      </Box>
      <Box flexDirection="column" paddingX={1} overflow="hidden">
        {visibleItems.map((item, i) => {
          const actualIndex = scrollOffset + i;
          const isSelected = actualIndex === selectedIndex;
          const tracking = isTrackingItem?.(item);
          const agent = agentForItem?.(item);
          const agentPrefix = agent ? AGENTS[agent.name].emoji + " " : "";
          const timerPrefix = tracking ? "⏱ " : "";
          const idStr = `[${item.id}]`;
          const title = truncate(item.title, titleMaxWidth - agentPrefix.length - timerPrefix.length - idStr.length - 1);
          return (
            <Box key={`${item.source}-${item.id}`} height={1} overflow="hidden">
              <Text color="cyan">{isSelected ? "> " : "  "}</Text>
              {agent && <Text color={AGENTS[agent.name].color}>{AGENTS[agent.name].emoji} </Text>}
              {tracking && <Text color="green">⏱ </Text>}
              <Text dimColor>{idStr}</Text>
              <Text> </Text>
              <Text bold={isSelected}>{title}</Text>
              <Text> </Text>
              <Text color={sourceColor(item.source)}>{item.source}</Text>
            </Box>
          );
        })}
        {Array.from({ length: Math.max(0, height - visibleItems.length) }).map((_, i) => (
          <Text key={`pad-${i}`}> </Text>
        ))}
      </Box>
    </Box>
  );
}

function truncate(str: string, max: number): string {
  if (max <= 0) return str;
  if (str.length <= max) return str;
  return str.slice(0, max - 1) + "…";
}
