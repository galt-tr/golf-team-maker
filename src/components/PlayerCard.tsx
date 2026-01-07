import React from 'react';
import { Player, Rating } from '../types';

interface PlayerCardProps {
  player: Player;
  isEditable: boolean;
  onRatingChange?: (playerId: string, newRating: Rating) => void;
  onDragStart?: (e: React.DragEvent, player: Player, sourceTeamId: string | null) => void;
  onDragEnd?: (e: React.DragEvent) => void;
  sourceTeamId?: string | null;
}

const PlayerCard: React.FC<PlayerCardProps> = ({
  player,
  isEditable,
  onRatingChange,
  onDragStart,
  onDragEnd,
  sourceTeamId = null
}) => {
  const handleDragStart = (e: React.DragEvent) => {
    if (onDragStart) {
      onDragStart(e, player, sourceTeamId);
    }
  };

  return (
    <div
      className="player-card"
      draggable={!isEditable}
      onDragStart={handleDragStart}
      onDragEnd={onDragEnd}
    >
      <div className="player-info">
        <span className="player-name">{player.name}</span>
      </div>
      {isEditable && onRatingChange ? (
        <select
          className="rating-select"
          value={player.rating}
          onChange={(e) => onRatingChange(player.id, e.target.value as Rating)}
        >
          {(['A', 'B', 'C', 'D'] as Rating[]).map(rating => (
            <option key={rating} value={rating}>{rating}</option>
          ))}
        </select>
      ) : (
        <span className={`rating-badge ${player.rating}`}>
          {player.rating}
        </span>
      )}
    </div>
  );
};

export default PlayerCard;