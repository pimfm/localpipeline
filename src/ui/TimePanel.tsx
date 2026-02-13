import React, { useState, useEffect } from "react";
import { Box, Text } from "ink";
import type { ActiveTimer, TimeStats } from "../model/time-entry.js";
import type { DashboardAnalytics } from "../model/analytics.js";
import { formatMinutes } from "../utils/time-stats.js";
import { BarChart } from "./charts/BarChart.js";
import { SparkLine } from "./charts/SparkLine.js";
import { TimeBreakdown } from "./stats/TimeBreakdown.js";

interface Props {
  activeTimer?: ActiveTimer;
  localStats: TimeStats;
  analytics: DashboardAnalytics;
  expanded: boolean;
  height: number;
}

function TimerDisplay({ timer }: { timer?: ActiveTimer }) {
  const [elapsed, setElapsed] = useState("");

  useEffect(() => {
    if (!timer) { setElapsed(""); return; }
    const update = () => {
      const mins = Math.floor((Date.now() - new Date(timer.startTime).getTime()) / 60000);
      setElapsed(formatMinutes(mins));
    };
    update();
    const id = setInterval(update, 60000);
    return () => clearInterval(id);
  }, [timer]);

  if (!timer) return <Text dimColor>No active timer</Text>;
  return (
    <Text>
      <Text color="green">⏱ {elapsed}</Text>
      <Text> </Text>
      <Text>{timer.workItemTitle}</Text>
    </Text>
  );
}

export function TimePanel({ activeTimer, localStats, analytics, expanded, height }: Props) {
  if (!expanded) {
    return (
      <Box flexDirection="column" borderStyle="round" borderColor="cyan" width="25%" height={height + 3} overflow="hidden">
        <Box paddingX={1}>
          <Text bold>Time</Text>
        </Box>
        <Box flexDirection="column" paddingX={1} overflow="hidden">
          <TimerDisplay timer={activeTimer} />
          <Text> </Text>
          <Text dimColor>Today: {formatMinutes(todayMinutes(localStats))}</Text>
          <Text dimColor>Total: {formatMinutes(localStats.totalMinutes)}</Text>
          {localStats.entriesBySource.size > 0 && (
            <>
              <Text> </Text>
              <Text bold>By source</Text>
              {[...localStats.entriesBySource.entries()].map(([source, mins]) => (
                <Text key={source} dimColor>
                  {source}: {formatMinutes(mins)}
                </Text>
              ))}
            </>
          )}
        </Box>
      </Box>
    );
  }

  // Expanded view
  const dailyData = [...localStats.entriesByDay.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-7);

  const workItems = [...localStats.entriesByWorkItem.values()].map((v) => ({
    label: v.title,
    minutes: v.minutes,
  }));

  return (
    <Box flexDirection="column" borderStyle="round" borderColor="cyan" flexGrow={1}>
      <Box paddingX={1}>
        <Text bold>Time Analytics</Text>
      </Box>
      <Box paddingX={1} flexDirection="column">
        <TimerDisplay timer={activeTimer} />
        <Text> </Text>

        <Text bold>Last 7 days</Text>
        <BarChart
          items={dailyData.map(([day, mins]) => ({ label: day.slice(5), value: mins }))}
          maxBarWidth={15}
        />
        <Box>
          <Text dimColor>Trend: </Text>
          <SparkLine values={dailyData.map(([, m]) => m)} />
        </Box>
        <Text> </Text>

        <TimeBreakdown items={workItems} title="Top work items" />

        {analytics.wakatime && (
          <>
            <Text> </Text>
            <Text bold color="green">WakaTime</Text>
            <Text>
              Total: {Math.round(analytics.wakatime.totalSeconds / 3600)}h | Daily avg:{" "}
              {Math.round(analytics.wakatime.dailyAverageSeconds / 3600)}h
            </Text>
            <Text bold>Languages</Text>
            <BarChart
              items={analytics.wakatime.languages.map((l) => ({
                label: l.name,
                value: Math.round(l.percent),
              }))}
              maxBarWidth={12}
              color="green"
            />
            <Text bold>Projects</Text>
            <BarChart
              items={analytics.wakatime.projects.map((p) => ({
                label: p.name,
                value: Math.round(p.percent),
              }))}
              maxBarWidth={12}
              color="green"
            />
          </>
        )}

        {analytics.rescuetime && (
          <>
            <Text> </Text>
            <Text bold color="blue">RescueTime</Text>
            <Text>
              Total: {analytics.rescuetime.totalHours.toFixed(1)}h | Productivity:{" "}
              {analytics.rescuetime.productivityScore}%
            </Text>
            <Text bold>Categories</Text>
            <BarChart
              items={analytics.rescuetime.categories.map((c) => ({
                label: c.name,
                value: Math.round(c.hours * 10) / 10,
              }))}
              maxBarWidth={12}
              color="blue"
            />
          </>
        )}
      </Box>
    </Box>
  );
}

function todayMinutes(stats: TimeStats): number {
  const today = new Date().toISOString().slice(0, 10);
  return stats.entriesByDay.get(today) ?? 0;
}
