import { execFile } from "child_process";
import { existsSync } from "fs";
import { promisify } from "util";
import { AGENT_NAMES } from "../model/agent.js";
import { AgentStore } from "./agent-store.js";
import { worktreePath } from "./branch-utils.js";

const execFileAsync = promisify(execFile);

async function git(cwd: string, ...args: string[]): Promise<{ stdout: string; stderr: string }> {
  return execFileAsync("git", args, { cwd });
}

export async function syncWorktrees(repoRoot: string): Promise<void> {
  try {
    await git(repoRoot, "fetch", "origin", "main");
  } catch {
    return; // offline or no remote — skip silently
  }

  const store = new AgentStore();

  for (const name of AGENT_NAMES) {
    const wtPath = worktreePath(repoRoot, name);

    if (!existsSync(wtPath)) continue;

    const agent = store.getAgent(name);
    if (agent.status === "working" || agent.status === "provisioning") continue;

    try {
      // Already up to date?
      await git(wtPath, "merge-base", "--is-ancestor", "origin/main", "HEAD");
      continue;
    } catch {
      // Not up to date — rebase needed
    }

    try {
      // Stash any dirty changes
      const { stdout: stashOut } = await git(wtPath, "stash");
      const didStash = !stashOut.includes("No local changes");

      try {
        await git(wtPath, "rebase", "origin/main");
      } catch {
        // Rebase failed — abort and move on
        await git(wtPath, "rebase", "--abort").catch(() => {});
        if (didStash) await git(wtPath, "stash", "pop").catch(() => {});
        console.error(`[sync] rebase failed for agent-${name}, skipping`);
        continue;
      }

      if (didStash) {
        await git(wtPath, "stash", "pop").catch(() => {});
      }
    } catch (err) {
      console.error(`[sync] error syncing agent-${name}:`, err);
    }
  }
}
