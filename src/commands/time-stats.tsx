import React from "react";
import { Box, Text } from "ink";
import { TimeStore } from "../persistence/time-store.js";
import { computeTimeStats, formatMinutes } from "../utils/time-stats.js";
import { BarChart } from "../ui/charts/BarChart.js";
import { SparkLine } from "../ui/charts/SparkLine.js";
import { TimeBreakdown } from "../ui/stats/TimeBreakdown.js";
import { loadConfig } from "../config/config.js";
import { WakaTimeProvider } from "../providers/analytics/wakatime-provider.js";
import { RescueTimeProvider } from "../providers/analytics/rescuetime-provider.js";
import { useAnalytics } from "../ui/hooks/use-analytics.js";

export function TimeStatsCommand() {
  const store = new TimeStore();
  const config = loadConfig();

  const wakatime = config.wakatime ? new WakaTimeProvider(config.wakatime.api_key) : undefined;
  const rescuetime = config.rescuetime ? new RescueTimeProvider(config.rescuetime.api_key) : undefined;

  const { loading, analytics, localStats } = useAnalytics(store, wakatime, rescuetime);

  if (loading) {
    return <Text>Loading time stats...</Text>;
  }

  const dailyData = [...localStats.entriesByDay.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-7);

  const workItems = [...localStats.entriesByWorkItem.values()].map((v) => ({
    label: `${v.title} (${v.source})`,
    minutes: v.minutes,
  }));

  const sourceItems = [...localStats.entriesBySource.entries()].map(([source, mins]) => ({
    label: source,
    minutes: mins,
  }));

  return (
    <Box flexDirection="column" padding={1}>
      <Text bold>Time Tracking Stats</Text>
      <Text>Total tracked: {formatMinutes(localStats.totalMinutes)}</Text>
      <Text> </Text>

      <Text bold>Last 7 days</Text>
      {dailyData.length > 0 ? (
        <>
          <BarChart
            items={dailyData.map(([day, mins]) => ({ label: day, value: mins }))}
            maxBarWidth={25}
          />
          <Box>
            <Text dimColor>Trend: </Text>
            <SparkLine values={dailyData.map(([, m]) => m)} />
          </Box>
        </>
      ) : (
        <Text dimColor>No data yet</Text>
      )}
      <Text> </Text>

      <TimeBreakdown items={sourceItems} title="By source" />
      <Text> </Text>
      <TimeBreakdown items={workItems} title="Top work items" limit={10} />

      {analytics.wakatime && (
        <>
          <Text> </Text>
          <Text bold color="green">WakaTime (last 7 days)</Text>
          <Text>
            Total: {Math.round(analytics.wakatime.totalSeconds / 3600)}h | Daily avg:{" "}
            {Math.round(analytics.wakatime.dailyAverageSeconds / 3600)}h
          </Text>
          <BarChart
            items={analytics.wakatime.languages.map((l) => ({
              label: l.name,
              value: Math.round(l.percent),
            }))}
            maxBarWidth={20}
            color="green"
          />
        </>
      )}

      {analytics.rescuetime && (
        <>
          <Text> </Text>
          <Text bold color="blue">RescueTime (last 7 days)</Text>
          <Text>
            Total: {analytics.rescuetime.totalHours.toFixed(1)}h | Productivity:{" "}
            {analytics.rescuetime.productivityScore}%
          </Text>
          <BarChart
            items={analytics.rescuetime.categories.map((c) => ({
              label: c.name,
              value: Math.round(c.hours * 10) / 10,
            }))}
            maxBarWidth={20}
            color="blue"
          />
        </>
      )}
    </Box>
  );
}
