import type { WorkItem } from "../../model/work-item.js";
import type { WorkItemProvider } from "../provider.js";
import type { TrelloMember, TrelloCard, TrelloBoard, TrelloList } from "./trello-types.js";

export class TrelloProvider implements WorkItemProvider {
  name = "Trello";

  constructor(
    private apiKey: string,
    private token: string,
  ) {}

  private params(): URLSearchParams {
    return new URLSearchParams({ key: this.apiKey, token: this.token });
  }

  private async get<T>(path: string, extra?: Record<string, string>): Promise<T> {
    const params = this.params();
    if (extra) {
      for (const [k, v] of Object.entries(extra)) params.set(k, v);
    }
    const res = await fetch(`https://api.trello.com/1${path}?${params}`);
    if (!res.ok) {
      throw new Error(`Trello API error: ${res.status} ${res.statusText}`);
    }
    return res.json();
  }

  async fetchAssignedItems(): Promise<WorkItem[]> {
    const member = await this.get<TrelloMember>("/members/me");
    const cards = await this.get<TrelloCard[]>(`/members/${member.id}/cards`, {
      fields: "id,name,desc,shortUrl,idList,labels,idBoard",
    });

    if (cards.length === 0) return [];

    const boardIds = [...new Set(cards.map((c) => c.idBoard))];
    const boardNames = new Map<string, string>();
    const listNames = new Map<string, string>();

    await Promise.all(
      boardIds.map(async (boardId) => {
        const [board, lists] = await Promise.all([
          this.get<TrelloBoard>(`/boards/${boardId}`, { fields: "id,name" }),
          this.get<TrelloList[]>(`/boards/${boardId}/lists`, { fields: "id,name" }),
        ]);
        boardNames.set(boardId, board.name);
        for (const list of lists) {
          listNames.set(list.id, list.name);
        }
      }),
    );

    return cards.map((card) => ({
      id: card.id.slice(0, 8),
      title: card.name,
      description: card.desc?.trim() ? card.desc.slice(0, 500) : undefined,
      status: listNames.get(card.idList),
      priority: undefined,
      labels: card.labels.map((l) => l.name).filter((n) => n.length > 0),
      source: "Trello",
      team: boardNames.get(card.idBoard),
      url: card.shortUrl,
    }));
  }
}
