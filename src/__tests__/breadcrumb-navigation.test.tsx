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
    tmpDir = mkdtempSync(join(tmpdir(), "lp-test-"));
    store = new TimeStore(join(tmpDir, "time.json"));
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it("shows breadcrumb trail when navigating to time-expanded mode", async () => {
    const provider = new MockProvider(MOCK_ITEMS);
    const { lastFrame, stdin, unmount } = render(<App providers={[provider]} store={store} />);

    await delay(50);

    // Navigate to time-expanded mode
    stdin.write("t");
    await delay(20);

    const frame = lastFrame();
    // Breadcrumbs should show: Dashboard › Time Analytics
    expect(frame).toContain("Dashboard");
    expect(frame).toContain("›");
    expect(frame).toContain("Time Analytics");

    unmount();
  });

  it("navigates back with left arrow", async () => {
    const provider = new MockProvider(MOCK_ITEMS);
    const { lastFrame, stdin, unmount } = render(<App providers={[provider]} store={store} />);

    await delay(50);

    // Navigate to time-expanded mode
    stdin.write("t");
    await delay(20);

    let frame = lastFrame();
    expect(frame).toContain("Time Analytics");

    // Press left arrow to go back
    stdin.write(ARROW_LEFT);
    await delay(20);

    frame = lastFrame();
    // Should be back on normal dashboard (Work Items visible)
    expect(frame).toContain("Work Items");

    unmount();
  });

  it("navigates forward with right arrow after going back", async () => {
    const provider = new MockProvider(MOCK_ITEMS);
    const { lastFrame, stdin, unmount } = render(<App providers={[provider]} store={store} />);

    await delay(50);

    // Navigate to time-expanded
    stdin.write("t");
    await delay(20);

    // Go back
    stdin.write(ARROW_LEFT);
    await delay(20);

    let frame = lastFrame();
    expect(frame).toContain("Work Items");

    // Go forward
    stdin.write(ARROW_RIGHT);
    await delay(20);

    frame = lastFrame();
    expect(frame).toContain("Time Analytics");

    unmount();
  });

  it("does nothing when pressing left with no history", async () => {
    const provider = new MockProvider(MOCK_ITEMS);
    const { lastFrame, stdin, unmount } = render(<App providers={[provider]} store={store} />);

    await delay(50);

    // Press left arrow with no history
    stdin.write(ARROW_LEFT);
    await delay(20);

    const frame = lastFrame();
    // Should still be on normal dashboard
    expect(frame).toContain("Work Items");

    unmount();
  });

  it("does nothing when pressing right with no forward history", async () => {
    const provider = new MockProvider(MOCK_ITEMS);
    const { lastFrame, stdin, unmount } = render(<App providers={[provider]} store={store} />);

    await delay(50);

    // Navigate to time, then back
    stdin.write("t");
    await delay(20);
    stdin.write(ARROW_LEFT);
    await delay(20);

    // Go forward
    stdin.write(ARROW_RIGHT);
    await delay(20);

    // Now press right again — should stay on time-expanded
    stdin.write(ARROW_RIGHT);
    await delay(20);

    const frame = lastFrame();
    expect(frame).toContain("Time Analytics");

    unmount();
  });

  it("clears forward history when navigating to a new mode", async () => {
    const provider = new MockProvider(MOCK_ITEMS);
    const { lastFrame, stdin, unmount } = render(<App providers={[provider]} store={store} />);

    await delay(50);

    // Navigate: normal -> time-expanded
    stdin.write("t");
    await delay(20);

    // Go back to normal
    stdin.write(ARROW_LEFT);
    await delay(20);

    // Navigate to agents instead (clears forward history)
    stdin.write("a");
    await delay(20);

    // Try going forward — should do nothing (forward was cleared)
    stdin.write(ARROW_RIGHT);
    await delay(20);

    const frame = lastFrame();
    // Should still be on agents (check for agent panel content)
    expect(frame).toContain("Agents");

    unmount();
  });

  it("supports multi-step navigation history", async () => {
    const provider = new MockProvider(MOCK_ITEMS);
    const { lastFrame, stdin, unmount } = render(<App providers={[provider]} store={store} />);

    await delay(50);

    // Navigate: normal -> time-expanded -> normal -> agents
    stdin.write("t");
    await delay(20);
    stdin.write("t"); // back to normal
    await delay(20);
    stdin.write("a");
    await delay(20);

    // Go back to normal
    stdin.write(ARROW_LEFT);
    await delay(20);

    let frame = lastFrame();
    expect(frame).toContain("Work Items");

    // Go back to time-expanded
    stdin.write(ARROW_LEFT);
    await delay(20);

    frame = lastFrame();
    expect(frame).toContain("Time Analytics");

    // Go back to normal (first state)
    stdin.write(ARROW_LEFT);
    await delay(20);

    frame = lastFrame();
    expect(frame).toContain("Work Items");

    unmount();
  });

  it("shows back/forward hints in footer", async () => {
    const provider = new MockProvider(MOCK_ITEMS);
    const { lastFrame, unmount } = render(<App providers={[provider]} store={store} />);

    await delay(50);

    const frame = lastFrame();
    expect(frame).toContain("back/forward");

    unmount();
  });

  it("does not show breadcrumbs on initial dashboard (no history)", async () => {
    const provider = new MockProvider(MOCK_ITEMS);
    const { lastFrame, unmount } = render(<App providers={[provider]} store={store} />);

    await delay(50);

    const frame = lastFrame();
    // Breadcrumbs component returns null when only 1 item, so no "›" separator
    expect(frame).not.toContain("›");

    unmount();
  });
});
