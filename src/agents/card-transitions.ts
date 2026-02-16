import type { WorkItemProvider, CardStatus } from "../providers/provider.js";

/**
 * Attempt to move a work item to a new status across all providers.
 * Tries each provider until one succeeds. Failures are logged but not thrown,
 * since card movement is best-effort and should not block agent operations.
 */
export async function transitionCard(
  itemId: string,
  status: CardStatus,
  providers: WorkItemProvider[],
): Promise<boolean> {
  for (const provider of providers) {
    if (!provider.moveItem) continue;
    try {
      await provider.moveItem(itemId, status);
      return true;
    } catch {
      // Provider didn't match or API failed — try next
    }
  }
  return false;
}
