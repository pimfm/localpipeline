import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { FailureStore } from "../persistence/failure-store.js";
import { mkdtempSync, rmSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import type { FailureRecord } from "../persistence/failure-store.js";

describe("FailureStore", () => {
  let tmpDir: string;
  let storePath: string;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), "failure-store-test-"));
    storePath = join(tmpDir, "failures.json");
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  function makeFailure(overrides: Partial<FailureRecord> = {}): FailureRecord {
    return {
      id: "ITEM-1",
      title: "Fix the bug",
      agent: "ember",
      attempts: 3,
      lastError: "Process exited with code 1",
      failedAt: "2026-02-16T12:00:00.000Z",
      ...overrides,
    };
  }

  it("starts empty", () => {
    const store = new FailureStore(storePath);
    expect(store.getAll()).toEqual([]);
  });

  it("records and retrieves failures", () => {
    const store = new FailureStore(storePath);
    store.record(makeFailure());
    store.record(makeFailure({ id: "ITEM-2", title: "Another task", agent: "tide" }));

    expect(store.getAll()).toHaveLength(2);
  });

  it("replaces existing failure for same work item", () => {
    const store = new FailureStore(storePath);
    store.record(makeFailure({ lastError: "first error" }));
    store.record(makeFailure({ lastError: "second error" }));

    const all = store.getAll();
    expect(all).toHaveLength(1);
    expect(all[0]!.lastError).toBe("second error");
  });

  it("filters by agent name", () => {
    const store = new FailureStore(storePath);
    store.record(makeFailure({ id: "ITEM-1", agent: "ember" }));
    store.record(makeFailure({ id: "ITEM-2", agent: "tide" }));
    store.record(makeFailure({ id: "ITEM-3", agent: "ember" }));

    expect(store.getByAgent("ember")).toHaveLength(2);
    expect(store.getByAgent("tide")).toHaveLength(1);
    expect(store.getByAgent("gale")).toHaveLength(0);
  });

  it("removes a failure by work item ID", () => {
    const store = new FailureStore(storePath);
    store.record(makeFailure({ id: "ITEM-1" }));
    store.record(makeFailure({ id: "ITEM-2" }));

    expect(store.remove("ITEM-1")).toBe(true);
    expect(store.getAll()).toHaveLength(1);
    expect(store.getAll()[0]!.id).toBe("ITEM-2");
  });

  it("returns false when removing non-existent failure", () => {
    const store = new FailureStore(storePath);
    expect(store.remove("ITEM-99")).toBe(false);
  });

  it("clears all failures", () => {
    const store = new FailureStore(storePath);
    store.record(makeFailure({ id: "ITEM-1" }));
    store.record(makeFailure({ id: "ITEM-2" }));
    store.clear();

    expect(store.getAll()).toEqual([]);
  });

  it("persists across instances", () => {
    const store1 = new FailureStore(storePath);
    store1.record(makeFailure({ id: "ITEM-1" }));

    const store2 = new FailureStore(storePath);
    expect(store2.getAll()).toHaveLength(1);
    expect(store2.getAll()[0]!.id).toBe("ITEM-1");
  });

  it("preserves branch field when present", () => {
    const store = new FailureStore(storePath);
    store.record(makeFailure({ branch: "agent/ember/ITEM-1-fix-bug" }));

    expect(store.getAll()[0]!.branch).toBe("agent/ember/ITEM-1-fix-bug");
  });

  it("reload picks up external changes", () => {
    const store1 = new FailureStore(storePath);
    store1.record(makeFailure({ id: "ITEM-1" }));

    const store2 = new FailureStore(storePath);
    store2.record(makeFailure({ id: "ITEM-2" }));

    store1.reload();
    expect(store1.getAll()).toHaveLength(2);
  });

  it("handles corrupt file gracefully", () => {
    const { writeFileSync } = require("fs");
    writeFileSync(storePath, "not-json");

    const store = new FailureStore(storePath);
    expect(store.getAll()).toEqual([]);
  });
});
