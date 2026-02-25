import React, { useState, useEffect } from 'react';
import './App.css';
import { Player, Team, Rating, DragItem, SavedConfiguration } from './types';
import Roster from './components/Roster';
import TeamBox from './components/TeamBox';
import RosterModal from './components/RosterModal';
import SavedConfigModal from './components/SavedConfigModal';
import {
  fetchPlayers,
  syncPlayers,
  fetchTeams,
  syncTeams,
  fetchSavedConfigs,
  saveSavedConfig,
  deleteSavedConfig,
  fetchRosterConfig
} from './api';

function App() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [draggedItem, setDraggedItem] = useState<DragItem | null>(null);
  const [isRosterModalOpen, setIsRosterModalOpen] = useState(false);
  const [isSavedConfigModalOpen, setIsSavedConfigModalOpen] = useState(false);
  const [savedConfigurations, setSavedConfigurations] = useState<SavedConfiguration[]>([]);
  const [sortOrder, setSortOrder] = useState<'none' | 'asc' | 'desc'>('none');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load initial data from API
  useEffect(() => {
    loadInitialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load players from API
      const apiPlayers = await fetchPlayers();

      if (apiPlayers.length === 0) {
        // No players in database - initialize from roster config
        const rosterConfig = await fetchRosterConfig();
        const newPlayers = rosterConfig.map(entry => ({
          id: Math.random().toString(36).substr(2, 9),
          name: entry.name,
          rating: entry.rating
        }));
        setPlayers(newPlayers);
        await syncPlayers(newPlayers);
      } else {
        setPlayers(apiPlayers);
      }

      // Load teams from API
      const apiTeams = await fetchTeams();

      if (apiTeams.length === 0) {
        // No teams in database - initialize empty teams
        initializeTeams();
      } else {
        // Convert lockedPlayers arrays back to Sets
        const teamsWithSets = apiTeams.map((team) => ({
          ...team,
          lockedPlayers: new Set(team.lockedPlayers || [])
        }));
        setTeams(teamsWithSets);
      }

      // Load saved configurations
      const configs = await fetchSavedConfigs();
      setSavedConfigurations(configs);
    } catch (err) {
      console.error('Error loading initial data:', err);
      setError('Failed to load data from server. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  // Sync players to API when they change
  useEffect(() => {
    if (players.length > 0 && !loading) {
      syncPlayers(players).catch(err => {
        console.error('Error syncing players:', err);
      });
    }
  }, [players, loading]);

  // Sync teams to API when they change
  useEffect(() => {
    if (teams.length > 0 && !loading) {
      syncTeams(teams).catch(err => {
        console.error('Error syncing teams:', err);
      });
    }
  }, [teams, loading]);

  const initializeTeams = () => {
    const newTeams = [];
    for (let i = 1; i <= 8; i++) {
      newTeams.push({
        id: `team-${i}`,
        name: `Team ${i}`,
        players: [],
        lockedPlayers: new Set<string>()
      });
    }
    setTeams(newTeams);
  };

  const getUnassignedPlayers = () => {
    const assignedPlayerIds = new Set(
      teams.flatMap(team => team.players.map(p => p.id))
    );
    let unassigned = players.filter(player => !assignedPlayerIds.has(player.id));

    // Apply sorting if needed
    if (sortOrder !== 'none') {
      const ratingValues: { [key: string]: number } = {
        'A+': 4.3,
        'A': 4.0,
        'A-': 3.7,
        'B+': 3.3,
        'B': 3.0,
        'B-': 2.7,
        'C+': 2.3,
        'C': 2.0,
        'C-': 1.7,
        'D+': 1.3,
        'D': 1.0,
        'D-': 0.7
      };

      unassigned.sort((a, b) => {
        const aValue = ratingValues[a.rating];
        const bValue = ratingValues[b.rating];

        if (sortOrder === 'asc') {
          // Sort D -> C -> B -> A (worst to best)
          return aValue - bValue;
        } else {
          // Sort A -> B -> C -> D (best to worst)
          return bValue - aValue;
        }
      });
    }

    return unassigned;
  };

  const toggleSort = () => {
    if (sortOrder === 'none') {
      setSortOrder('desc'); // First click: A -> D (best to worst)
    } else if (sortOrder === 'desc') {
      setSortOrder('asc'); // Second click: D -> A (worst to best)
    } else {
      setSortOrder('none'); // Third click: back to original order
    }
  };

  const handleRatingChange = (playerId: string, newRating: Rating) => {
    setPlayers(prevPlayers =>
      prevPlayers.map(player =>
        player.id === playerId ? { ...player, rating: newRating } : player
      )
    );
  };

  const handleNameChange = (playerId: string, newName: string) => {
    setPlayers(prevPlayers =>
      prevPlayers.map(player =>
        player.id === playerId ? { ...player, name: newName } : player
      )
    );

    // Also update the player in teams
    setTeams(prevTeams =>
      prevTeams.map(team => ({
        ...team,
        players: team.players.map(player =>
          player.id === playerId ? { ...player, name: newName } : player
        )
      }))
    );
  };

  const handleDragStart = (e: React.DragEvent, player: Player, sourceTeamId: string | null) => {
    // Check if player is locked
    if (sourceTeamId) {
      const sourceTeam = teams.find(t => t.id === sourceTeamId);
      if (sourceTeam?.lockedPlayers.has(player.id)) {
        e.preventDefault();
        return;
      }
    }
    setDraggedItem({ player, sourceTeamId });
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = (e: React.DragEvent) => {
    setDraggedItem(null);
  };

  const handleDrop = (e: React.DragEvent, targetTeamId: string | null) => {
    e.preventDefault();

    if (!draggedItem) return;

    // If dropping to unassigned area (targetTeamId is null)
    if (targetTeamId === null) {
      if (draggedItem.sourceTeamId) {
        // Remove from source team
        setTeams(prevTeams =>
          prevTeams.map(team =>
            team.id === draggedItem.sourceTeamId
              ? { ...team, players: team.players.filter(p => p.id !== draggedItem.player.id) }
              : team
          )
        );
      }
      return;
    }

    // Dropping to a team
    const targetTeam = teams.find(t => t.id === targetTeamId);
    if (!targetTeam) return;

    // Check team capacity
    if (targetTeam.players.length >= 4) {
      alert('This team already has 4 players!');
      return;
    }

    // Don't do anything if dropping on the same team
    if (draggedItem.sourceTeamId === targetTeamId) {
      return;
    }

    setTeams(prevTeams => {
      let newTeams = [...prevTeams];

      // Remove from source team if exists
      if (draggedItem.sourceTeamId) {
        newTeams = newTeams.map(team =>
          team.id === draggedItem.sourceTeamId
            ? { ...team, players: team.players.filter(p => p.id !== draggedItem.player.id) }
            : team
        );
      }

      // Add to target team
      newTeams = newTeams.map(team =>
        team.id === targetTeamId
          ? { ...team, players: [...team.players, draggedItem.player] }
          : team
      );

      return newTeams;
    });
  };

  const randomizeTeams = () => {
    // Keep locked players in their teams
    const newTeams: Team[] = teams.map(team => ({
      ...team,
      players: team.players.filter(p => team.lockedPlayers.has(p.id))
    }));

    // Get all unlocked players (including those currently in teams)
    const unlockedPlayers: Player[] = [];

    // Add unassigned players
    const assignedPlayerIds = new Set(
      teams.flatMap(team => team.players.map(p => p.id))
    );
    players.forEach(player => {
      if (!assignedPlayerIds.has(player.id)) {
        unlockedPlayers.push(player);
      }
    });

    // Add unlocked players from teams
    teams.forEach(team => {
      team.players.forEach(player => {
        if (!team.lockedPlayers.has(player.id)) {
          unlockedPlayers.push(player);
        }
      });
    });

    // Shuffle unlocked players
    const shuffledPlayers = unlockedPlayers.sort(() => Math.random() - 0.5);

    // Distribute shuffled players to teams
    let playerIndex = 0;
    for (let round = 0; round < 4; round++) {
      for (let teamIndex = 0; teamIndex < 8; teamIndex++) {
        if (newTeams[teamIndex].players.length < 4 && playerIndex < shuffledPlayers.length) {
          newTeams[teamIndex].players.push(shuffledPlayers[playerIndex]);
          playerIndex++;
        }
      }
    }

    setTeams(newTeams);
  };

  // Removed toggleEditMode as it's no longer used (edit mode was part of old inline editing)

  const balanceTeams = () => {
    const ratingValues: { [key: string]: number } = {
      'A+': 4.3,
      'A': 4.0,
      'A-': 3.7,
      'B+': 3.3,
      'B': 3.0,
      'B-': 2.7,
      'C+': 2.3,
      'C': 2.0,
      'C-': 1.7,
      'D+': 1.3,
      'D': 1.0,
      'D-': 0.7
    };

    // Get all moveable (unlocked) players
    const moveablePlayers: Player[] = [];
    const lockedPlayersByTeam: Map<string, Player[]> = new Map();

    teams.forEach(team => {
      const locked: Player[] = [];
      team.players.forEach(player => {
        if (team.lockedPlayers.has(player.id)) {
          locked.push(player);
        } else {
          moveablePlayers.push(player);
        }
      });
      lockedPlayersByTeam.set(team.id, locked);
    });

    // Add unassigned players to moveable
    const assignedPlayerIds = new Set(teams.flatMap(team => team.players.map(p => p.id)));
    players.forEach(player => {
      if (!assignedPlayerIds.has(player.id)) {
        moveablePlayers.push(player);
      }
    });

    // Sort moveable players by rating for snake draft distribution
    moveablePlayers.sort((a, b) => ratingValues[b.rating] - ratingValues[a.rating]);

    // Initialize teams with only locked players
    const balancedTeams: Team[] = teams.map(team => ({
      ...team,
      players: lockedPlayersByTeam.get(team.id) || []
    }));

    // Helper to get team total rating
    const getTeamTotal = (team: Team) => {
      return team.players.reduce((sum, p) => sum + ratingValues[p.rating], 0);
    };

    // Helper to get team average
    const getTeamAverage = (team: Team) => {
      if (team.players.length === 0) return 0;
      return getTeamTotal(team) / team.players.length;
    };

    // Distribute players using snake draft to ensure fairness
    // This prevents one team from getting all good or all bad players
    let teamIndex = 0;
    let direction = 1; // 1 for forward, -1 for backward

    for (const player of moveablePlayers) {
      // Find the next team that needs players
      let attempts = 0;
      while (attempts < 16) { // Prevent infinite loop
        const currentTeam = balancedTeams[teamIndex];

        if (currentTeam.players.length < 4) {
          currentTeam.players.push(player);
          break;
        }

        // Move to next team
        teamIndex += direction;

        // Handle snake draft direction changes
        if (teamIndex >= 8) {
          teamIndex = 7;
          direction = -1;
        } else if (teamIndex < 0) {
          teamIndex = 0;
          direction = 1;
        }

        attempts++;
      }

      // Move to next position for next player
      teamIndex += direction;
      if (teamIndex >= 8) {
        teamIndex = 7;
        direction = -1;
      } else if (teamIndex < 0) {
        teamIndex = 0;
        direction = 1;
      }
    }

    // Now optimize by swapping players to minimize variance
    let improved = true;
    let iterations = 0;

    while (improved && iterations < 50) {
      improved = false;
      iterations++;

      // Calculate current variance
      const averages = balancedTeams.map(t => getTeamAverage(t));
      const overallAvg = averages.reduce((a, b) => a + b, 0) / averages.length;
      const currentVariance = averages.reduce((sum, avg) => sum + Math.pow(avg - overallAvg, 2), 0);

      // Try swapping players between teams
      for (let i = 0; i < balancedTeams.length; i++) {
        for (let j = i + 1; j < balancedTeams.length; j++) {
          const team1 = balancedTeams[i];
          const team2 = balancedTeams[j];

          // Skip if teams don't have the same number of players (to maintain balance)
          if (Math.abs(team1.players.length - team2.players.length) > 1) continue;

          // Try each possible swap
          for (const p1 of team1.players) {
            if (team1.lockedPlayers.has(p1.id)) continue;

            for (const p2 of team2.players) {
              if (team2.lockedPlayers.has(p2.id)) continue;

              // Calculate new averages if we swap
              const team1NewTotal = getTeamTotal(team1) - ratingValues[p1.rating] + ratingValues[p2.rating];
              const team2NewTotal = getTeamTotal(team2) - ratingValues[p2.rating] + ratingValues[p1.rating];

              const team1NewAvg = team1NewTotal / team1.players.length;
              const team2NewAvg = team2NewTotal / team2.players.length;

              // Calculate new variance
              const newAverages = [...averages];
              newAverages[i] = team1NewAvg;
              newAverages[j] = team2NewAvg;
              const newVariance = newAverages.reduce((sum, avg) => sum + Math.pow(avg - overallAvg, 2), 0);

              // If this swap reduces variance, do it
              if (newVariance < currentVariance - 0.001) {
                // Perform the swap
                const team1Players = team1.players.filter(p => p.id !== p1.id);
                team1Players.push(p2);
                team1.players = team1Players;

                const team2Players = team2.players.filter(p => p.id !== p2.id);
                team2Players.push(p1);
                team2.players = team2Players;

                averages[i] = team1NewAvg;
                averages[j] = team2NewAvg;

                improved = true;
                break;
              }
            }
            if (improved) break;
          }
          if (improved) break;
        }
        if (improved) break;
      }
    }

    setTeams(balancedTeams);
  };

  const clearAllTeams = () => {
    const clearedTeams = teams.map(team => ({
      ...team,
      players: [],
      lockedPlayers: new Set<string>()
    }));
    setTeams(clearedTeams);
  };

  const togglePlayerLock = (teamId: string, playerId: string) => {
    setTeams(prevTeams =>
      prevTeams.map(team => {
        if (team.id === teamId) {
          const newLockedPlayers = new Set(team.lockedPlayers);
          if (newLockedPlayers.has(playerId)) {
            newLockedPlayers.delete(playerId);
          } else {
            newLockedPlayers.add(playerId);
          }
          return { ...team, lockedPlayers: newLockedPlayers };
        }
        return team;
      })
    );
  };

  const handleAddPlayer = (name: string, rating: Rating) => {
    const newPlayer: Player = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      rating
    };
    setPlayers([...players, newPlayer]);
  };

  const handleDeletePlayer = (playerId: string) => {
    // Remove from teams first
    const updatedTeams = teams.map(team => ({
      ...team,
      players: team.players.filter(p => p.id !== playerId)
    }));
    setTeams(updatedTeams);

    // Remove from players list
    setPlayers(players.filter(p => p.id !== playerId));
  };

  const saveConfiguration = async (name: string) => {
    try {
      const unassignedPlayers = getUnassignedPlayers();
      const newConfig: SavedConfiguration = {
        id: Math.random().toString(36).substr(2, 9),
        name,
        date: new Date().toISOString(),
        teams: teams.map(team => ({
          ...team,
          lockedPlayers: Array.from(team.lockedPlayers)
        })),
        unassignedPlayers
      };

      await saveSavedConfig(newConfig);
      const configs = await fetchSavedConfigs();
      setSavedConfigurations(configs);
    } catch (err) {
      console.error('Error saving configuration:', err);
      alert('Failed to save configuration');
    }
  };

  const loadConfiguration = (config: SavedConfiguration) => {
    // Load teams with Sets converted back
    const teamsWithSets = config.teams.map(team => ({
      ...team,
      lockedPlayers: new Set(team.lockedPlayers)
    }));
    setTeams(teamsWithSets);

    // Update players list to include all players from the configuration
    const allConfigPlayers = [
      ...config.teams.flatMap(t => t.players),
      ...config.unassignedPlayers
    ];

    // Merge with existing players (avoid duplicates based on name)
    const playerNames = new Set(allConfigPlayers.map(p => p.name));
    const mergedPlayers = [...allConfigPlayers];

    players.forEach(existingPlayer => {
      if (!playerNames.has(existingPlayer.name)) {
        mergedPlayers.push(existingPlayer);
      }
    });

    setPlayers(mergedPlayers);
  };

  const deleteConfiguration = async (configId: string) => {
    try {
      await deleteSavedConfig(configId);
      const configs = await fetchSavedConfigs();
      setSavedConfigurations(configs);
    } catch (err) {
      console.error('Error deleting configuration:', err);
      alert('Failed to delete configuration');
    }
  };

  const exportToCSV = () => {
    const ratingValues: { [key: string]: number } = {
      'A+': 4.3,
      'A': 4.0,
      'A-': 3.7,
      'B+': 3.3,
      'B': 3.0,
      'B-': 2.7,
      'C+': 2.3,
      'C': 2.0,
      'C-': 1.7,
      'D+': 1.3,
      'D': 1.0,
      'D-': 0.7
    };

    // Create CSV header
    let csv = 'Team,Player Name,Rating,Rating Value,Captain\n';

    // Add team data
    teams.forEach(team => {
      if (team.players.length === 0) {
        csv += `${team.name},(empty),,,,\n`;
      } else {
        team.players.forEach(player => {
          const isCaptain = team.lockedPlayers.has(player.id) ? 'Yes' : 'No';
          csv += `${team.name},${player.name},${player.rating},${ratingValues[player.rating]},${isCaptain}\n`;
        });
      }
    });

    // Add summary section
    csv += '\n\nTeam Summary\n';
    csv += 'Team,Player Count,Average Rating,Captain Count\n';

    teams.forEach(team => {
      const playerCount = team.players.length;
      const avgRating = playerCount > 0
        ? (team.players.reduce((sum, p) => sum + ratingValues[p.rating], 0) / playerCount).toFixed(2)
        : '0';
      const captainCount = team.players.filter(p => team.lockedPlayers.has(p.id)).length;
      csv += `${team.name},${playerCount},${avgRating},${captainCount}\n`;
    });

    // Add unassigned players section
    const unassignedPlayers = getUnassignedPlayers();
    if (unassignedPlayers.length > 0) {
      csv += '\n\nUnassigned Players\n';
      csv += 'Player Name,Rating,Rating Value\n';
      unassignedPlayers.forEach(player => {
        csv += `${player.name},${player.rating},${ratingValues[player.rating]}\n`;
      });
    }

    // Create blob and download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    const date = new Date();
    const timestamp = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
    const filename = `golf-teams-${timestamp}.csv`;

    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading">Loading Golf Team Maker...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <div className="error-message">{error}</div>
        <button className="btn" onClick={loadInitialData}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="container">
      <RosterModal
        isOpen={isRosterModalOpen}
        onClose={() => setIsRosterModalOpen(false)}
        players={players}
        onUpdatePlayer={handleRatingChange}
        onUpdatePlayerName={handleNameChange}
        onAddPlayer={handleAddPlayer}
        onDeletePlayer={handleDeletePlayer}
      />

      <SavedConfigModal
        isOpen={isSavedConfigModalOpen}
        onClose={() => setIsSavedConfigModalOpen(false)}
        savedConfigs={savedConfigurations}
        onLoad={loadConfiguration}
        onDelete={deleteConfiguration}
        onSave={saveConfiguration}
      />

      <div className="main-layout">
        <div className="roster-section">
          <h2>Player Roster</h2>
          <div className="roster-controls">
            <button className="btn" onClick={() => setIsRosterModalOpen(true)}>
              Manage Roster
            </button>
            <button className="btn" onClick={() => setIsSavedConfigModalOpen(true)}>
              💾 Save/Load
            </button>
            <button
              className={`btn btn-sort ${sortOrder !== 'none' ? 'active' : ''}`}
              onClick={toggleSort}
              title={
                sortOrder === 'none' ? 'Sort by rating' :
                sortOrder === 'desc' ? 'Sorted A→D (click for D→A)' :
                'Sorted D→A (click to unsort)'
              }
            >
              {sortOrder === 'none' && '↕️ Sort'}
              {sortOrder === 'desc' && '↓ A→D'}
              {sortOrder === 'asc' && '↑ D→A'}
            </button>
            <button className="btn" onClick={randomizeTeams}>
              Randomize Teams
            </button>
            <button className="btn" onClick={balanceTeams}>
              ⚖️ Balance Teams
            </button>
            <button className="btn" onClick={clearAllTeams}>
              Clear All Teams
            </button>
          </div>
          <Roster
            players={getUnassignedPlayers()}
            isEditMode={false}
            onRatingChange={handleRatingChange}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDrop={handleDrop}
          />
        </div>

        <div className="teams-section">
          <div className="teams-header">
            <h2>Teams</h2>
            <button className="btn btn-export" onClick={exportToCSV}>
              📊 Export to Excel
            </button>
          </div>
          <div className="teams-grid">
            {teams.map(team => (
              <TeamBox
                key={team.id}
                team={team}
                onDrop={handleDrop}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                onToggleLock={togglePlayerLock}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
