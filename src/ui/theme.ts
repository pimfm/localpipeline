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
} as const;

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
