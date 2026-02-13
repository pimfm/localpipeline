import type { WorkItem } from "../../model/work-item.js";

interface TrelloWebhookBody {
  action?: {
    type?: string;
    data?: {
      card?: { id?: string; name?: string; desc?: string; shortUrl?: string };
      board?: { name?: string };
      label?: { name?: string };
    };
  };
}

export function parseTrelloWebhook(body: TrelloWebhookBody): WorkItem | undefined {
  const action = body.action;
  if (!action) return undefined;

  const type = action.type;
  if (type !== "addMemberToCard" && type !== "addLabelToCard") return undefined;

  const card = action.data?.card;
  if (!card?.id || !card?.name) return undefined;

  return {
    id: card.id.slice(0, 8),
    title: card.name,
    description: card.desc,
    labels: action.data?.label?.name ? [action.data.label.name] : [],
    source: "Trello",
    team: action.data?.board?.name,
    url: card.shortUrl,
  };
}
