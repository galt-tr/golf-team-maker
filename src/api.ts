import { Player, Team, SavedConfiguration, Rating } from './types';

// Determine API URL based on environment
const getApiUrl = () => {
  // If explicitly set, use it
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }

  // In development, use localhost backend
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:8080';
  }

  // In production (Vercel), use same domain (serverless functions at /api)
  return window.location.origin;
};

const API_URL = getApiUrl();

// Helper function for API calls
async function apiCall<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_URL}${endpoint}`;
  console.log('API Call:', url); // Debug log
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`API call failed: ${response.statusText}`);
  }

  return response.json();
}

// ==================== ROSTER CONFIG API ====================

export interface RosterConfigEntry {
  id: number;
  name: string;
  rating: Rating;
}

export async function fetchRosterConfig(): Promise<RosterConfigEntry[]> {
  return apiCall<RosterConfigEntry[]>('/api/roster-config');
}

export async function addRosterConfigEntry(name: string, rating: Rating): Promise<RosterConfigEntry> {
  return apiCall<RosterConfigEntry>('/api/roster-config', {
    method: 'POST',
    body: JSON.stringify({ name, rating }),
  });
}

export async function updateRosterConfigEntry(id: number, name: string, rating: Rating): Promise<RosterConfigEntry> {
  return apiCall<RosterConfigEntry>(`/api/roster-config/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ name, rating }),
  });
}

export async function deleteRosterConfigEntry(id: number): Promise<void> {
  await apiCall<void>(`/api/roster-config/${id}`, {
    method: 'DELETE',
  });
}

// ==================== PLAYERS API ====================

export async function fetchPlayers(): Promise<Player[]> {
  return apiCall<Player[]>('/api/players');
}

export async function syncPlayers(players: Player[]): Promise<void> {
  await apiCall('/api/players/sync', {
    method: 'POST',
    body: JSON.stringify({ players }),
  });
}

// ==================== TEAMS API ====================

export interface TeamWithPlayers {
  id: string;
  name: string;
  players: Player[];
  lockedPlayers: string[];
}

export async function fetchTeams(): Promise<TeamWithPlayers[]> {
  return apiCall<TeamWithPlayers[]>('/api/teams');
}

export async function syncTeams(teams: Team[]): Promise<void> {
  // Convert Set to array for serialization
  const teamsForApi = teams.map(team => ({
    ...team,
    lockedPlayers: Array.from(team.lockedPlayers),
  }));

  await apiCall('/api/teams/sync', {
    method: 'POST',
    body: JSON.stringify({ teams: teamsForApi }),
  });
}

// ==================== SAVED CONFIGURATIONS API ====================

export async function fetchSavedConfigs(): Promise<SavedConfiguration[]> {
  return apiCall<SavedConfiguration[]>('/api/saved-configs');
}

export async function saveSavedConfig(config: SavedConfiguration): Promise<SavedConfiguration> {
  return apiCall<SavedConfiguration>('/api/saved-configs', {
    method: 'POST',
    body: JSON.stringify(config),
  });
}

export async function deleteSavedConfig(id: string): Promise<void> {
  await apiCall<void>(`/api/saved-configs/${id}`, {
    method: 'DELETE',
  });
}
