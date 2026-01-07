import React, { useState, useEffect } from 'react';
import './App.css';
import { Player, Team, Rating, DragItem } from './types';
import Roster from './components/Roster';
import TeamBox from './components/TeamBox';
import RosterModal from './components/RosterModal';

const initialRosterNames = [
  'Pops', 'Kevin', 'Dylan', 'Connor', 'Allen', 'Eric W.', 'Uncle Tim', 'Tim',
  'Jimmy', 'Kyle', 'Eric R.', 'Scott', 'Cory', 'Mom', 'Jared', 'Joe R.',
  'Sean G.', 'Don', 'Stephen', 'Christian', 'Samantha', 'Eric', 'Rob E.',
  'Mark G.', 'Mark N.', 'Mark G Sr.', 'Tim H.', 'Tony', 'Austin H.', 'Sean M.',
  'TBD', 'TBD'
];

function App() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [draggedItem, setDraggedItem] = useState<DragItem | null>(null);
  const [isRosterModalOpen, setIsRosterModalOpen] = useState(false);

  useEffect(() => {
    const savedPlayers = localStorage.getItem('golfPlayers');
    const savedTeams = localStorage.getItem('golfTeams');

    if (savedPlayers) {
      setPlayers(JSON.parse(savedPlayers));
    } else {
      const newPlayers = initialRosterNames.map(name => ({
        id: Math.random().toString(36).substr(2, 9),
        name: name,
        rating: 'C' as Rating
      }));
      setPlayers(newPlayers);
    }

    if (savedTeams) {
      const parsedTeams = JSON.parse(savedTeams);
      // Convert lockedPlayers arrays back to Sets
      const teamsWithSets = parsedTeams.map((team: any) => ({
        ...team,
        lockedPlayers: new Set(team.lockedPlayers || [])
      }));
      setTeams(teamsWithSets);
    } else {
      initializeTeams();
    }
  }, []);

  useEffect(() => {
    if (players.length > 0) {
      localStorage.setItem('golfPlayers', JSON.stringify(players));
    }
  }, [players]);

  useEffect(() => {
    if (teams.length > 0) {
      // Convert Sets to arrays for localStorage
      const teamsForStorage = teams.map(team => ({
        ...team,
        lockedPlayers: Array.from(team.lockedPlayers)
      }));
      localStorage.setItem('golfTeams', JSON.stringify(teamsForStorage));
    }
  }, [teams]);

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
    return players.filter(player => !assignedPlayerIds.has(player.id));
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

  const toggleEditMode = () => {
    setIsEditMode(!isEditMode);
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

  const exportToCSV = () => {
    const ratingValues: { [key: string]: number } = {
      'A': 4,
      'B': 3,
      'C': 2,
      'D': 1
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

  return (
    <div className="container">
      <h1>Golf Team Maker</h1>

      <RosterModal
        isOpen={isRosterModalOpen}
        onClose={() => setIsRosterModalOpen(false)}
        players={players}
        onUpdatePlayer={handleRatingChange}
        onUpdatePlayerName={handleNameChange}
        onAddPlayer={handleAddPlayer}
        onDeletePlayer={handleDeletePlayer}
      />

      <div className="main-layout">
        <div className="roster-section">
          <h2>Player Roster</h2>
          <div className="roster-controls">
            <button className="btn" onClick={() => setIsRosterModalOpen(true)}>
              Manage Roster
            </button>
            <button className="btn" onClick={randomizeTeams}>
              Randomize Teams
            </button>
            <button className="btn" onClick={clearAllTeams}>
              Clear All Teams
            </button>
          </div>
          <Roster
            players={getUnassignedPlayers()}
            isEditMode={isEditMode}
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
