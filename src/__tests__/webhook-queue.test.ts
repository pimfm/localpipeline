import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";

// Mock homedir to use temp directory
const mockHomeDir = vi.fn<() => string>();
vi.mock("os", async () => {
  const actual = await vi.importActual<typeof import("os")>("os");
  return { ...actual, homedir: () => mockHomeDir() };
});

import { getQueue, dequeue, clearQueue } from "../webhooks/webhook-dispatcher.js";
import type { WorkItem } from "../model/work-item.js";

describe("webhook queue", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), "webhook-queue-test-"));
    mockHomeDir.mockReturnValue(tmpDir);
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  function writeQueue(items: WorkItem[]): void {
    const dir = join(tmpDir, ".localpipeline");
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, "queue.json"), JSON.stringify({ items }));
  }

  it("getQueue returns empty array when no queue file exists", () => {
    expect(getQueue()).toEqual([]);
  });

  it("dequeue returns undefined when queue is empty", () => {
    expect(dequeue()).toBeUndefined();
  });

  it("dequeue returns and removes the first item", () => {
    const items: WorkItem[] = [
      { id: "ITEM-1", title: "First", labels: [], source: "test" },
      { id: "ITEM-2", title: "Second", labels: [], source: "test" },
    ];
    writeQueue(items);

    const first = dequeue();
    expect(first).toEqual({ id: "ITEM-1", title: "First", labels: [], source: "test" });

    const remaining = getQueue();
    expect(remaining).toHaveLength(1);
    expect(remaining[0]!.id).toBe("ITEM-2");
  });

  it("dequeue empties a single-item queue", () => {
    writeQueue([{ id: "ITEM-1", title: "Only", labels: [], source: "test" }]);

    const item = dequeue();
    expect(item).toBeDefined();
    expect(getQueue()).toHaveLength(0);
  });

  it("clearQueue removes all items", () => {
    writeQueue([
      { id: "ITEM-1", title: "First", labels: [], source: "test" },
      { id: "ITEM-2", title: "Second", labels: [], source: "test" },
    ]);

    clearQueue();
    expect(getQueue()).toHaveLength(0);
  });
});
