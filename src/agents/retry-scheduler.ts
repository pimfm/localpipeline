import type { AgentName } from "../model/agent.js";

export interface RetrySchedule {
  agentName: AgentName;
  retryAt: number; // timestamp (ms) when the retry should fire
  attempt: number;
}

const BASE_DELAY_MS = 10_000; // 10s
const MAX_DELAY_MS = 120_000; // 2 min cap

/**
 * Calculates exponential backoff delay for a given attempt number.
 * Attempt 1 → 10s, Attempt 2 → 20s, Attempt 3 → 40s (capped at 2min).
 */
export function backoffDelay(attempt: number): number {
  return Math.min(BASE_DELAY_MS * Math.pow(2, attempt - 1), MAX_DELAY_MS);
}

/**
 * Manages pending retries with exponential backoff.
 * Pure data structure — no timers, no side effects. The polling loop
 * checks `getReady()` each tick to see if any retries are due.
 */
export class RetryScheduler {
  private pending = new Map<AgentName, RetrySchedule>();

  schedule(agentName: AgentName, attempt: number, now = Date.now()): RetrySchedule {
    const delay = backoffDelay(attempt);
    const schedule: RetrySchedule = {
      agentName,
      retryAt: now + delay,
      attempt,
    };
    this.pending.set(agentName, schedule);
    return schedule;
  }

  /** Returns agents whose backoff period has elapsed. */
  getReady(now = Date.now()): RetrySchedule[] {
    const ready: RetrySchedule[] = [];
    for (const schedule of this.pending.values()) {
      if (now >= schedule.retryAt) {
        ready.push(schedule);
      }
    }
    return ready;
  }

  /** Remove an agent from the schedule (after retry fires or is cancelled). */
  cancel(agentName: AgentName): void {
    this.pending.delete(agentName);
  }

  isScheduled(agentName: AgentName): boolean {
    return this.pending.has(agentName);
  }

  getSchedule(agentName: AgentName): RetrySchedule | undefined {
    return this.pending.get(agentName);
  }

  /** Seconds remaining until the next retry for this agent. */
  secondsUntilRetry(agentName: AgentName, now = Date.now()): number | undefined {
    const schedule = this.pending.get(agentName);
    if (!schedule) return undefined;
    return Math.max(0, Math.ceil((schedule.retryAt - now) / 1000));
  }
}
