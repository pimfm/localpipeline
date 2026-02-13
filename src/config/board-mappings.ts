import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import { homedir } from "os";

export interface BoardMapping {
  boardId: string;
  boardName: string;
  source: string;
}

type MappingsFile = Record<string, BoardMapping>;

const mappingsPath = join(homedir(), ".localpipeline", "board-mappings.json");

export function getBoardMapping(directory: string): BoardMapping | undefined {
  const mappings = loadMappings();
  return mappings[directory];
}

export function setBoardMapping(directory: string, mapping: BoardMapping): void {
  const mappings = loadMappings();
  mappings[directory] = mapping;
  saveMappings(mappings);
}

function loadMappings(): MappingsFile {
  try {
    return JSON.parse(readFileSync(mappingsPath, "utf-8"));
  } catch {
    return {};
  }
}

function saveMappings(mappings: MappingsFile): void {
  const dir = join(homedir(), ".localpipeline");
  mkdirSync(dir, { recursive: true });
  writeFileSync(mappingsPath, JSON.stringify(mappings, null, 2));
}
