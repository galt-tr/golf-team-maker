import React, { useState } from 'react';
import { Team, Player } from '../types';
import PlayerCard from './PlayerCard';

interface TeamBoxProps {
  team: Team;
  onDrop: (e: React.DragEvent, teamId: string | null) => void;
  onDragStart: (e: React.DragEvent, player: Player, sourceTeamId: string | null) => void;
  onDragEnd: (e: React.DragEvent) => void;
}

const TeamBox: React.FC<TeamBoxProps> = ({
  team,
  onDrop,
  onDragStart,
  onDragEnd
}) => {
  const [isDragOver, setIsDragOver] = useState(false);

  const calculateTeamStrength = () => {
    if (team.players.length === 0) return '0.0';

    const ratingValues: { [key: string]: number } = {
      'A': 4,
      'B': 3,
      'C': 2,
      'D': 1
    };

    const totalStrength = team.players.reduce((sum, player) => {
      return sum + (ratingValues[player.rating] || 0);
    }, 0);

    return (totalStrength / team.players.length).toFixed(1);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    const currentTarget = e.currentTarget;
    const relatedTarget = e.relatedTarget as Node;

    if (!currentTarget.contains(relatedTarget)) {
      setIsDragOver(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    onDrop(e, team.id);
  };

  return (
    <div
      className={`team-box ${isDragOver ? 'drag-over' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="team-header">
        <span className="team-name">{team.name}</span>
        <span className="team-strength">Avg: {calculateTeamStrength()}</span>
      </div>
      <div className="team-players">
        {team.players.map((player) => (
          <PlayerCard
            key={player.id}
            player={player}
            isEditable={false}
            sourceTeamId={team.id}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
          />
        ))}
        {[...Array(4 - team.players.length)].map((_, index) => (
          <div key={`empty-${index}`} className="empty-slot">
            Drop player here
          </div>
        ))}
      </div>
    </div>
  );
};

export default TeamBox;