import React from "react";
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render } from "ink-testing-library";
import { App } from "../ui/App.js";
import { TimeStore } from "../persistence/time-store.js";
import type { WorkItemProvider } from "../providers/provider.js";
import type { WorkItem } from "../model/work-item.js";
import { mkdtempSync, rmSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";

const ARROW_DOWN = "\x1B[B";
const ARROW_UP = "\x1B[A";
const ARROW_LEFT = "\x1B[D";
const ARROW_RIGHT = "\x1B[C";

const MOCK_ITEMS: WorkItem[] = [
  { id: "1", title: "Fix login bug", source: "Linear", labels: [], status: "In Progress", priority: "High" },
  { id: "2", title: "Add dark mode", source: "Trello", labels: ["frontend"], status: "Todo" },
];

class MockProvider implements WorkItemProvider {
  name = "Mock";
  constructor(private items: WorkItem[]) {}
  async fetchAssignedItems(): Promise<WorkItem[]> {
    return this.items;
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

describe("Breadcrumb Navigation", () => {
  let tmpDir: string;
  let store: TimeStore;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), "lp-breadcrumb-"));
    store = new TimeStore(join(tmpDir, "time.json"));
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it("navigates to time view and back with left arrow", async () => {
    const provider = new MockProvider(MOCK_ITEMS);
    const { lastFrame, stdin, unmount } = render(<App providers={[provider]} store={store} />);

    await delay(50);

    // Normal mode: should show Work Items
    let frame = lastFrame();
    expect(frame).toContain("Work Items");

    // Press 't' to go to time-expanded mode
    stdin.write("t");
    await delay(20);

    frame = lastFrame();
    expect(frame).toContain("Time Analytics");
    // Breadcrumbs should show path
    expect(frame).toContain("Dashboard");
    expect(frame).toContain("Time");

    // Press left arrow to go back
    stdin.write(ARROW_LEFT);
    await delay(20);

    frame = lastFrame();
    expect(frame).toContain("Work Items");

    unmount();
  });

  it("navigates to agents view and back with left arrow", async () => {
    const provider = new MockProvider(MOCK_ITEMS);
    const { lastFrame, stdin, unmount } = render(<App providers={[provider]} store={store} />);

    await delay(50);

    // Press 'a' to go to agents mode
    stdin.write("a");
    await delay(20);

    let frame = lastFrame();
    // Breadcrumbs should show path
    expect(frame).toContain("Dashboard");
    expect(frame).toContain("Agents");

    // Press left arrow to go back
    stdin.write(ARROW_LEFT);
    await delay(20);

    frame = lastFrame();
    expect(frame).toContain("Work Items");

    unmount();
  });

  it("supports forward navigation with right arrow after going back", async () => {
    const provider = new MockProvider(MOCK_ITEMS);
    const { lastFrame, stdin, unmount } = render(<App providers={[provider]} store={store} />);

    await delay(50);

    // Navigate to time view
    stdin.write("t");
    await delay(20);
    expect(lastFrame()).toContain("Time Analytics");

    // Go back
    stdin.write(ARROW_LEFT);
    await delay(20);
    expect(lastFrame()).toContain("Work Items");

    // Go forward
    stdin.write(ARROW_RIGHT);
    await delay(20);
    expect(lastFrame()).toContain("Time Analytics");

    unmount();
  });

  it("clears forward history when navigating to a new view", async () => {
    const provider = new MockProvider(MOCK_ITEMS);
    const { lastFrame, stdin, unmount } = render(<App providers={[provider]} store={store} />);

    await delay(50);

    // Navigate to time view
    stdin.write("t");
    await delay(20);

    // Go back to normal
    stdin.write(ARROW_LEFT);
    await delay(20);
    expect(lastFrame()).toContain("Work Items");

    // Navigate to agents (different from forward history)
    stdin.write("a");
    await delay(20);
    expect(lastFrame()).toContain("Agents");

    // Go back to normal
    stdin.write(ARROW_LEFT);
    await delay(20);

    // Right arrow should go to agents now (not time)
    stdin.write(ARROW_RIGHT);
    await delay(20);

    // Should not show Time Analytics since forward was cleared
    const frame = lastFrame();
    expect(frame).toContain("Agents");

    unmount();
  });

  it("does not show breadcrumbs on the root view", async () => {
    const provider = new MockProvider(MOCK_ITEMS);
    const { lastFrame, unmount } = render(<App providers={[provider]} store={store} />);

    await delay(50);

    const frame = lastFrame();
    // On root view, breadcrumbs should not show "Dashboard" as a crumb
    // (breadcrumbs only show when there's navigation depth > 1)
    expect(frame).toContain("work pipeline");
    // The "/" separator should not appear when on root
    expect(frame).not.toMatch(/Dashboard.*\/.*Time/);

    unmount();
  });

  it("shows back hint in footer only when there is history", async () => {
    const provider = new MockProvider(MOCK_ITEMS);
    const { lastFrame, stdin, unmount } = render(<App providers={[provider]} store={store} />);

    await delay(50);

    // On root - no back hint
    let frame = lastFrame();
    expect(frame).not.toContain("[←] back");

    // Navigate to time view
    stdin.write("t");
    await delay(20);

    // Should show back hint
    frame = lastFrame();
    expect(frame).toContain("[←] back");

    unmount();
  });

  it("shows forward hint in footer after going back", async () => {
    const provider = new MockProvider(MOCK_ITEMS);
    const { lastFrame, stdin, unmount } = render(<App providers={[provider]} store={store} />);

    await delay(50);

    // Navigate to time, then back
    stdin.write("t");
    await delay(20);
    stdin.write(ARROW_LEFT);
    await delay(20);

    // Should show forward hint
    const frame = lastFrame();
    expect(frame).toContain("[→] forward");

    unmount();
  });

  it("builds multi-level breadcrumbs through deep navigation", async () => {
    const provider = new MockProvider(MOCK_ITEMS);
    const { lastFrame, stdin, unmount } = render(<App providers={[provider]} store={store} />);

    await delay(50);

    // Navigate: normal -> time -> (back to normal via toggle) -> agents
    stdin.write("t");
    await delay(20);

    // Go back
    stdin.write("t");
    await delay(20);

    // Go to agents
    stdin.write("a");
    await delay(20);

    const frame = lastFrame();
    expect(frame).toContain("Agents");
    expect(frame).toContain("Dashboard");

    unmount();
  });

  it("left arrow on root view does nothing", async () => {
    const provider = new MockProvider(MOCK_ITEMS);
    const { lastFrame, stdin, unmount } = render(<App providers={[provider]} store={store} />);

    await delay(50);

    // Press left arrow on root - should stay on root
    stdin.write(ARROW_LEFT);
    await delay(20);

    const frame = lastFrame();
    expect(frame).toContain("Work Items");

    unmount();
  });

  it("right arrow without forward history does nothing", async () => {
    const provider = new MockProvider(MOCK_ITEMS);
    const { lastFrame, stdin, unmount } = render(<App providers={[provider]} store={store} />);

    await delay(50);

    // Press right arrow with no forward history
    stdin.write(ARROW_RIGHT);
    await delay(20);

    const frame = lastFrame();
    expect(frame).toContain("Work Items");

    unmount();
  });
});
