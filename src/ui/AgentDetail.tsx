import React, { useState, useEffect } from "react";
import { Box, Text } from "ink";
import type { AgentName } from "../model/agent.js";
import { AGENTS } from "../model/agent.js";
import { readEventsForAgent } from "../persistence/agent-log.js";
import type { AgentEvent, AgentEventType } from "../persistence/agent-log.js";

interface Props {
  agentName: AgentName;
  height: number;
  scrollOffset: number;
}

function eventColor(event: AgentEventType): string {
  switch (event) {
    case "dispatched": return "blue";
    case "provisioning": return "yellow";
    case "working": return "cyan";
    case "done": return "green";
    case "error": return "red";
    case "retry": return "yellow";
    case "max-retries": return "red";
    case "released": return "gray";
    default: return "white";
  }
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function AgentDetail({ agentName, height, scrollOffset }: Props) {
  const [events, setEvents] = useState<AgentEvent[]>([]);
  const info = AGENTS[agentName];

  useEffect(() => {
    const load = () => setEvents(readEventsForAgent(agentName, 200));
    load();
    const interval = setInterval(load, 2000);
    return () => clearInterval(interval);
  }, [agentName]);

  const visibleLines = Math.max(1, height - 1);
  const total = events.length;
  const start = Math.max(0, Math.min(scrollOffset, total - visibleLines));
  const visible = events.slice(start, start + visibleLines);

  return (
    <Box flexDirection="column" borderStyle="round" borderColor="cyan" width="50%" height={height + 3} overflow="hidden">
      <Box paddingX={1}>
        <Text bold color={info.color}>{info.emoji} {info.display}</Text>
        <Text bold> — Activity Log</Text>
        {total > visibleLines && (
          <Text dimColor>  ({start + 1}–{Math.min(start + visibleLines, total)} of {total})</Text>
        )}
      </Box>
      <Box flexDirection="column" paddingX={1} overflow="hidden">
        {visible.length === 0 ? (
          <Text dimColor>No events recorded.</Text>
        ) : (
          visible.map((ev, i) => (
            <Box key={`${ev.timestamp}-${i}`} height={1} overflow="hidden">
              <Text dimColor>{formatDate(ev.timestamp)} </Text>
              <Text dimColor>{formatTime(ev.timestamp)}  </Text>
              <Text color={eventColor(ev.event)}>{ev.event.padEnd(12)}</Text>
              {ev.message && (
                <>
                  <Text> </Text>
                  <Text>{truncate(ev.message, 50)}</Text>
                </>
              )}
            </Box>
          ))
        )}
        {Array.from({ length: Math.max(0, visibleLines - visible.length) }).map((_, i) => (
          <Text key={`pad-${i}`}> </Text>
        ))}
      </Box>
    </Box>
  );
}

function truncate(str: string, max: number): string {
  if (str.length <= max) return str;
  return str.slice(0, max - 1) + "…";
}
