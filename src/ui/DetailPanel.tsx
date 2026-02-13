import React from "react";
import { Box, Text } from "ink";
import type { WorkItem } from "../model/work-item.js";
import { priorityColor } from "./theme.js";

interface Props {
  item: WorkItem;
  height: number;
}

export function DetailPanel({ item, height }: Props) {
  const descTruncated = item.description
    ? item.description.length > 300
      ? item.description.slice(0, 300) + "..."
      : item.description
    : undefined;

  return (
    <Box flexDirection="column" borderStyle="round" borderColor="cyan" width="25%" height={height + 3} overflow="hidden">
      <Box paddingX={1}>
        <Text bold>Detail</Text>
      </Box>
      <Box flexDirection="column" paddingX={1} overflow="hidden">
        {item.status && (
          <Text>
            <Text bold>Status:   </Text>
            {item.status}
          </Text>
        )}
        {item.priority && (
          <Text>
            <Text bold>Priority: </Text>
            <Text color={priorityColor(item.priority)}>{item.priority}</Text>
          </Text>
        )}
        {item.labels.length > 0 && (
          <Text>
            <Text bold>Labels:   </Text>
            {item.labels.join(", ")}
          </Text>
        )}
        {item.team && (
          <Text>
            <Text bold>Team:     </Text>
            {item.team}
          </Text>
        )}
        {item.url && (
          <Text>
            <Text bold>URL:      </Text>
            <Text color="cyan">{item.url}</Text>
          </Text>
        )}
        {descTruncated && (
          <>
            <Text> </Text>
            <Text bold>Description:</Text>
            {descTruncated.split("\n").map((line, i) => (
              <Text key={i} dimColor>  {line}</Text>
            ))}
          </>
        )}
      </Box>
    </Box>
  );
}
