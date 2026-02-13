export const colors = {
  border: "cyan",
  selected: "cyan",
  title: "white",
  dim: "gray",
  sourceLinear: "#5E6AD2",
  sourceTrello: "#0079BF",
  sourceJira: "#0052CC",
  priorityUrgent: "red",
  priorityHigh: "yellow",
  priorityMedium: "blue",
  priorityLow: "gray",
  agentEmber: "#FF7043",
  agentTide: "#4FC3F7",
  agentGale: "#CE93D8",
  agentTerra: "#81C784",
} as const;

export function agentStatusColor(status: string): string {
  switch (status) {
    case "idle": return colors.dim;
    case "provisioning": return "yellow";
    case "working": return "cyan";
    case "done": return "green";
    case "error": return "red";
    default: return colors.dim;
  }
}

export function sourceColor(source: string): string {
  switch (source) {
    case "Linear": return colors.sourceLinear;
    case "Trello": return colors.sourceTrello;
    case "Jira": return colors.sourceJira;
    default: return colors.dim;
  }
}

export function priorityColor(priority?: string): string {
  switch (priority) {
    case "Urgent": return colors.priorityUrgent;
    case "High": return colors.priorityHigh;
    case "Medium": return colors.priorityMedium;
    case "Low": return colors.priorityLow;
    default: return colors.dim;
  }
}
