export type Rating = 'A+' | 'A' | 'A-' | 'B+' | 'B' | 'B-' | 'C+' | 'C' | 'C-' | 'D+' | 'D' | 'D-';

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

export interface SavedConfiguration {
  id: string;
  name: string;
  date: string;
  teams: {
    id: string;
    name: string;
    players: Player[];
    lockedPlayers: string[]; // Array of player IDs (for serialization)
  }[];
  unassignedPlayers: Player[];
}