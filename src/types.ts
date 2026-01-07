export type Rating = 'A' | 'B' | 'C' | 'D';

export interface Player {
  id: string;
  name: string;
  rating: Rating;
}

export interface Team {
  id: string;
  name: string;
  players: Player[];
  lockedPlayers: Set<string>; // Set of player IDs that are locked to this team
}

export interface DragItem {
  player: Player;
  sourceTeamId: string | null;
}