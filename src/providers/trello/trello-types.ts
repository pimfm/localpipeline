export interface TrelloMember {
  id: string;
  fullName: string;
}

export interface TrelloCard {
  id: string;
  name: string;
  desc?: string;
  shortUrl: string;
  idList: string;
  labels: { name: string; color?: string }[];
  idBoard: string;
}

export interface TrelloBoard {
  id: string;
  name: string;
}

export interface TrelloList {
  id: string;
  name: string;
}
