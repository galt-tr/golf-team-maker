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
}

export interface DragItem {
  player: Player;
  sourceTeamId: string | null;
}