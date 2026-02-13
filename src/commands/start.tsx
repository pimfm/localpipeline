import React from "react";
import { Box, Text } from "ink";
import { loadConfig } from "../config/config.js";
import { createProviders } from "../providers/registry.js";
import { WakaTimeProvider } from "../providers/analytics/wakatime-provider.js";
import { RescueTimeProvider } from "../providers/analytics/rescuetime-provider.js";
import { App } from "../ui/App.js";

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

  const wakatime = config.wakatime ? new WakaTimeProvider(config.wakatime.api_key) : undefined;
  const rescuetime = config.rescuetime ? new RescueTimeProvider(config.rescuetime.api_key) : undefined;

  return <App providers={providers} wakatime={wakatime} rescuetime={rescuetime} />;
}
