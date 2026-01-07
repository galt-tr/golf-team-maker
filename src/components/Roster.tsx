import React, { useState } from 'react';
import { Player, Rating } from '../types';
import PlayerCard from './PlayerCard';

interface RosterProps {
  players: Player[];
  isEditMode: boolean;
  onRatingChange: (playerId: string, newRating: Rating) => void;
  onDragStart: (e: React.DragEvent, player: Player, sourceTeamId: string | null) => void;
  onDragEnd: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, targetTeamId: string | null) => void;
}

const Roster: React.FC<RosterProps> = ({
  players,
  isEditMode,
  onRatingChange,
  onDragStart,
  onDragEnd,
  onDrop
}) => {
  const [isDragOver, setIsDragOver] = useState(false);

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
    onDrop(e, null); // null indicates dropping to unassigned area
  };

  return (
    <div
      className={`player-list ${isDragOver ? 'drag-over' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {players.map((player) => (
        <PlayerCard
          key={player.id}
          player={player}
          isEditable={isEditMode}
          onRatingChange={onRatingChange}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
        />
      ))}
      {players.length === 0 && (
        <div className="empty-roster-message">
          Drop players here to unassign from teams
        </div>
      )}
    </div>
  );
};

export default Roster;