import { spawn } from "child_process";
import { createWriteStream, mkdirSync } from "fs";
import { join } from "path";
import { homedir } from "os";
import { execSync } from "child_process";
import type { AgentName } from "../model/agent.js";
import type { WorkItem } from "../model/work-item.js";
import { AgentStore } from "./agent-store.js";
import { branchName, worktreePath } from "./branch-utils.js";
import { buildClaudePrompt } from "./claude-prompt.js";
import { writeClaudeMd } from "./claude-md.js";
import { AGENTS } from "../model/agent.js";

export async function dispatchToAgent(
  agentName: AgentName,
  item: WorkItem,
  repoRoot: string,
  store?: AgentStore,
): Promise<void> {
  const agentStore = store ?? new AgentStore();
  const branch = branchName(agentName, item.id, item.title);
  const wtPath = worktreePath(repoRoot, agentName);

  agentStore.updateAgent(agentName, {
    status: "provisioning",
    workItemId: item.id,
    workItemTitle: item.title,
    branch,
    worktreePath: wtPath,
  });

  try {
    // Create branch from main
    execSync(`git branch ${branch} main`, { cwd: repoRoot, stdio: "pipe" });

    // Create worktree
    execSync(`git worktree add ${wtPath} ${branch}`, { cwd: repoRoot, stdio: "pipe" });

    // Write CLAUDE.md
    writeClaudeMd(wtPath, AGENTS[agentName].display);

    // npm install in worktree
    execSync("npm install", { cwd: wtPath, stdio: "pipe" });

    // Build prompt
    const prompt = buildClaudePrompt(item, AGENTS[agentName].display);

    // Set up log file
    const logDir = join(homedir(), ".localpipeline", "logs");
    mkdirSync(logDir, { recursive: true });
    const logPath = join(logDir, `agent-${agentName}.log`);
    const logStream = createWriteStream(logPath, { flags: "w" });

    // Spawn claude process
    const child = spawn("claude", ["-p", prompt, "--dangerously-skip-permissions"], {
      cwd: wtPath,
      stdio: ["ignore", "pipe", "pipe"],
    });

    child.stdout.pipe(logStream);
    child.stderr.pipe(logStream);

    // Mark as working with PID
    agentStore.markBusy(agentName, item.id, item.title, branch, wtPath, child.pid!);

    // Handle exit
    child.on("close", (code) => {
      logStream.close();
      if (code === 0) {
        agentStore.markDone(agentName);
      } else {
        agentStore.markError(agentName, `Process exited with code ${code}`);
      }
    });

    child.on("error", (err) => {
      logStream.close();
      agentStore.markError(agentName, err.message);
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    agentStore.markError(agentName, message);
  }
}
