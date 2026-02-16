import React, { useState, useEffect } from "react";
import { Box, Text, useInput, useApp } from "ink";
import { Spinner } from "@inkjs/ui";
import type { Board, WorkItemProvider } from "../providers/provider.js";
import { setBoardMapping } from "../config/board-mappings.js";

interface Props {
  providers: WorkItemProvider[];
  directory: string;
  onSelected: (board: Board, provider: WorkItemProvider) => void;
}

type State =
  | { status: "loading" }
  | { status: "ready"; boards: { board: Board; provider: WorkItemProvider }[] }
  | { status: "error"; message: string };

export function BoardSelector({ providers, directory, onSelected }: Props) {
  const { exit } = useApp();
  const [state, setState] = useState<State>({ status: "loading" });
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    const fetchAll = async () => {
      const boards: { board: Board; provider: WorkItemProvider }[] = [];
      const results = await Promise.allSettled(
        providers
          .filter((p) => p.fetchBoards)
          .map(async (p) => {
            const pBoards = await p.fetchBoards!();
            return pBoards.map((b) => ({ board: b, provider: p }));
          }),
      );
      for (const result of results) {
        if (result.status === "fulfilled") boards.push(...result.value);
      }
      if (boards.length === 0) {
        setState({ status: "error", message: "No boards found." });
      } else {
        setState({ status: "ready", boards });
      }
    };
    fetchAll();
  }, []);

  useInput((input, key) => {
    if (input === "q" || key.escape) {
      exit();
      return;
    }
    if (state.status !== "ready") return;

    if (key.upArrow) {
      setSelectedIndex((i) => Math.max(0, i - 1));
    }
    if (key.downArrow) {
      setSelectedIndex((i) => Math.min(state.boards.length - 1, i + 1));
    }
    if (key.return) {
      const entry = state.boards[selectedIndex]!;
      setBoardMapping(directory, {
        boardId: entry.board.id,
        boardName: entry.board.name,
        source: entry.provider.name,
      });
      onSelected(entry.board, entry.provider);
    }
  });

  if (state.status === "loading") {
    return (
      <Box borderStyle="round" borderColor="cyan" padding={1} flexDirection="column">
        <Text bold> work pipeline</Text>
        <Box paddingX={1} paddingY={1}>
          <Spinner label="Fetching available boards..." />
        </Box>
      </Box>
    );
  }

  if (state.status === "error") {
    return (
      <Box borderStyle="round" borderColor="cyan" padding={1} flexDirection="column">
        <Text bold> work pipeline</Text>
        <Box paddingX={1}>
          <Text color="red">{state.message}</Text>
        </Box>
      </Box>
    );
  }

  return (
    <Box borderStyle="round" borderColor="cyan" flexDirection="column">
      <Box paddingX={1}>
        <Text bold> work pipeline</Text>
      </Box>
      <Box paddingX={1} flexDirection="column">
        <Text color="yellow">No board linked to this directory.</Text>
        <Text dimColor>{directory}</Text>
        <Text> </Text>
        <Text>Select a board to link:</Text>
        <Text> </Text>
        {state.boards.map((entry, i) => (
          <Text key={entry.board.id}>
            {i === selectedIndex ? (
              <Text color="cyan" bold>{" > "}</Text>
            ) : (
              <Text>{"   "}</Text>
            )}
            <Text bold={i === selectedIndex}>{entry.board.name}</Text>
            <Text dimColor>{" "}{entry.provider.name}</Text>
          </Text>
        ))}
        <Text> </Text>
        <Text dimColor>[↑/↓] navigate  [enter] select  [q/esc] quit</Text>
      </Box>
    </Box>
  );
}
