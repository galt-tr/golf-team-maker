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
      setTeams(JSON.parse(savedTeams));
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
      localStorage.setItem('golfTeams', JSON.stringify(teams));
    }
  }, [teams]);

  const initializeTeams = () => {
    const newTeams = [];
    for (let i = 1; i <= 8; i++) {
      newTeams.push({
        id: `team-${i}`,
        name: `Team ${i}`,
        players: []
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
    const shuffledPlayers = [...players].sort(() => Math.random() - 0.5);
    const newTeams: Team[] = [];

    for (let i = 1; i <= 8; i++) {
      newTeams.push({
        id: `team-${i}`,
        name: `Team ${i}`,
        players: []
      });
    }

    shuffledPlayers.forEach((player, index) => {
      const teamIndex = index % 8;
      if (newTeams[teamIndex].players.length < 4) {
        newTeams[teamIndex].players.push(player);
      }
    });

    setTeams(newTeams);
  };

  const toggleEditMode = () => {
    setIsEditMode(!isEditMode);
  };

  const clearAllTeams = () => {
    const clearedTeams = teams.map(team => ({
      ...team,
      players: []
    }));
    setTeams(clearedTeams);
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
          <h2>Teams</h2>
          <div className="teams-grid">
            {teams.map(team => (
              <TeamBox
                key={team.id}
                team={team}
                onDrop={handleDrop}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
