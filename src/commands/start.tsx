import React, { useState } from "react";
import { Box, Text } from "ink";
import { loadConfig } from "../config/config.js";
import { getBoardMapping } from "../config/board-mappings.js";
import { createProviders } from "../providers/registry.js";
import { WakaTimeProvider } from "../providers/analytics/wakatime-provider.js";
import { RescueTimeProvider } from "../providers/analytics/rescuetime-provider.js";
import type { Board, WorkItemProvider } from "../providers/provider.js";
import { App } from "../ui/App.js";
import { BoardSelector } from "../ui/BoardSelector.js";

export function Start() {
  const config = loadConfig();
  const providers = createProviders(config);

  if (providers.length === 0) {
    return (
      <Box flexDirection="column" paddingX={1}>
        <Text color="yellow">No providers configured.</Text>
        <Text>Create a config file at ~/.localpipeline/config.toml with at least one provider section.</Text>
        <Text> </Text>
        <Text>Example:</Text>
        <Text dimColor>{`[linear]
api_key = "lin_api_xxxx"

[trello]
api_key = "your_key"
token = "your_token"

[jira]
domain = "yourcompany"
email = "you@company.com"
api_token = "your_token"`}</Text>
      </Box>
    );
  }

  const cwd = process.cwd();
  const mapping = getBoardMapping(cwd);

  if (mapping) {
    for (const p of providers) {
      if (p.name === mapping.source && p.setBoardFilter) {
        p.setBoardFilter(mapping.boardId);
      }
    }
  }

  const wakatime = config.wakatime ? new WakaTimeProvider(config.wakatime.api_key) : undefined;
  const rescuetime = config.rescuetime ? new RescueTimeProvider(config.rescuetime.api_key) : undefined;

  const hasBoardSupport = providers.some((p) => p.fetchBoards);

  if (!mapping && hasBoardSupport) {
    return (
      <BoardSelectorFlow
        providers={providers}
        directory={cwd}
        wakatime={wakatime}
        rescuetime={rescuetime}
      />
    );
  }

  return <App providers={providers} wakatime={wakatime} rescuetime={rescuetime} />;
}

function BoardSelectorFlow({
  providers,
  directory,
  wakatime,
  rescuetime,
}: {
  providers: WorkItemProvider[];
  directory: string;
  wakatime?: WakaTimeProvider;
  rescuetime?: RescueTimeProvider;
}) {
  const [selected, setSelected] = useState(false);

  const handleSelected = (_board: Board, _provider: WorkItemProvider) => {
    for (const p of providers) {
      if (p.name === _provider.name && p.setBoardFilter) {
        p.setBoardFilter(_board.id);
      }
    }
    setSelected(true);
  };

  if (!selected) {
    return <BoardSelector providers={providers} directory={directory} onSelected={handleSelected} />;
  }

  return <App providers={providers} wakatime={wakatime} rescuetime={rescuetime} />;
}
