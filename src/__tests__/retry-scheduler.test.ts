import { describe, it, expect } from "vitest";
import { RetryScheduler, backoffDelay } from "../agents/retry-scheduler.js";

describe("backoffDelay", () => {
  it("returns 10s for attempt 1", () => {
    expect(backoffDelay(1)).toBe(10_000);
  });

  it("doubles each attempt", () => {
    expect(backoffDelay(2)).toBe(20_000);
    expect(backoffDelay(3)).toBe(40_000);
    expect(backoffDelay(4)).toBe(80_000);
  });

  it("caps at 120s", () => {
    expect(backoffDelay(10)).toBe(120_000);
    expect(backoffDelay(100)).toBe(120_000);
  });
});

describe("RetryScheduler", () => {
  it("schedules a retry with correct delay", () => {
    const scheduler = new RetryScheduler();
    const now = 1000000;
    const schedule = scheduler.schedule("ember", 1, now);

    expect(schedule.agentName).toBe("ember");
    expect(schedule.attempt).toBe(1);
    expect(schedule.retryAt).toBe(now + 10_000);
  });

  it("returns no ready items before backoff elapses", () => {
    const scheduler = new RetryScheduler();
    const now = 1000000;
    scheduler.schedule("ember", 1, now);

    expect(scheduler.getReady(now + 5000)).toHaveLength(0);
  });

  it("returns ready items after backoff elapses", () => {
    const scheduler = new RetryScheduler();
    const now = 1000000;
    scheduler.schedule("ember", 1, now);

    const ready = scheduler.getReady(now + 10_000);
    expect(ready).toHaveLength(1);
    expect(ready[0]!.agentName).toBe("ember");
  });

  it("tracks multiple agents independently", () => {
    const scheduler = new RetryScheduler();
    const now = 1000000;
    scheduler.schedule("ember", 1, now); // 10s delay
    scheduler.schedule("tide", 2, now); // 20s delay

    const at15s = scheduler.getReady(now + 15_000);
    expect(at15s).toHaveLength(1);
    expect(at15s[0]!.agentName).toBe("ember");

    const at25s = scheduler.getReady(now + 25_000);
    expect(at25s).toHaveLength(2);
  });

  it("cancel removes a scheduled retry", () => {
    const scheduler = new RetryScheduler();
    scheduler.schedule("ember", 1);
    expect(scheduler.isScheduled("ember")).toBe(true);

    scheduler.cancel("ember");
    expect(scheduler.isScheduled("ember")).toBe(false);
    expect(scheduler.getReady(Date.now() + 999999)).toHaveLength(0);
  });

  it("isScheduled returns false for unscheduled agents", () => {
    const scheduler = new RetryScheduler();
    expect(scheduler.isScheduled("gale")).toBe(false);
  });

  it("getSchedule returns the schedule details", () => {
    const scheduler = new RetryScheduler();
    const now = 1000000;
    scheduler.schedule("terra", 3, now);

    const schedule = scheduler.getSchedule("terra");
    expect(schedule).toBeDefined();
    expect(schedule!.attempt).toBe(3);
    expect(schedule!.retryAt).toBe(now + 40_000);
  });

  it("getSchedule returns undefined for unscheduled agents", () => {
    const scheduler = new RetryScheduler();
    expect(scheduler.getSchedule("ember")).toBeUndefined();
  });

  it("secondsUntilRetry returns remaining seconds", () => {
    const scheduler = new RetryScheduler();
    const now = 1000000;
    scheduler.schedule("ember", 1, now);

    expect(scheduler.secondsUntilRetry("ember", now + 3000)).toBe(7);
  });

  it("secondsUntilRetry returns 0 when past due", () => {
    const scheduler = new RetryScheduler();
    const now = 1000000;
    scheduler.schedule("ember", 1, now);

    expect(scheduler.secondsUntilRetry("ember", now + 20_000)).toBe(0);
  });

  it("secondsUntilRetry returns undefined for unscheduled agents", () => {
    const scheduler = new RetryScheduler();
    expect(scheduler.secondsUntilRetry("ember")).toBeUndefined();
  });

  it("overwrites previous schedule for same agent", () => {
    const scheduler = new RetryScheduler();
    const now = 1000000;
    scheduler.schedule("ember", 1, now);
    scheduler.schedule("ember", 2, now);

    const schedule = scheduler.getSchedule("ember");
    expect(schedule!.attempt).toBe(2);
    expect(schedule!.retryAt).toBe(now + 20_000);
  });
});
