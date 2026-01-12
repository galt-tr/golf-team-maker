import React, { useState } from 'react';
import { Player, Rating } from '../types';

interface RosterModalProps {
  isOpen: boolean;
  onClose: () => void;
  players: Player[];
  onUpdatePlayer: (playerId: string, newRating: Rating) => void;
  onUpdatePlayerName: (playerId: string, newName: string) => void;
  onAddPlayer: (name: string, rating: Rating) => void;
  onDeletePlayer: (playerId: string) => void;
}

const RosterModal: React.FC<RosterModalProps> = ({
  isOpen,
  onClose,
  players,
  onUpdatePlayer,
  onUpdatePlayerName,
  onAddPlayer,
  onDeletePlayer
}) => {
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerRating, setNewPlayerRating] = useState<Rating>('C');
  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  if (!isOpen) return null;

  const handleAddPlayer = () => {
    if (newPlayerName.trim()) {
      onAddPlayer(newPlayerName.trim(), newPlayerRating);
      setNewPlayerName('');
      setNewPlayerRating('C');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddPlayer();
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Manage Roster</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          <div className="add-player-section">
            <h3>Add New Player</h3>
            <div className="add-player-form">
              <input
                type="text"
                className="player-input"
                placeholder="Player name"
                value={newPlayerName}
                onChange={(e) => setNewPlayerName(e.target.value)}
                onKeyPress={handleKeyPress}
              />
              <select
                className="rating-select"
                value={newPlayerRating}
                onChange={(e) => setNewPlayerRating(e.target.value as Rating)}
              >
                {(['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'D-'] as Rating[]).map(rating => (
                  <option key={rating} value={rating}>{rating}</option>
                ))}
              </select>
              <button className="btn btn-add" onClick={handleAddPlayer}>
                Add Player
              </button>
            </div>
          </div>

          <div className="roster-list-section">
            <h3>Current Roster ({players.length} players)</h3>
            <div className="roster-list-modal">
              {players.map((player) => (
                <div key={player.id} className="roster-item">
                  {editingPlayerId === player.id ? (
                    <input
                      type="text"
                      className="player-name-edit"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onBlur={() => {
                        if (editingName.trim()) {
                          onUpdatePlayerName(player.id, editingName.trim());
                        }
                        setEditingPlayerId(null);
                      }}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          if (editingName.trim()) {
                            onUpdatePlayerName(player.id, editingName.trim());
                          }
                          setEditingPlayerId(null);
                        }
                      }}
                      autoFocus
                    />
                  ) : (
                    <span
                      className="player-name editable"
                      onClick={() => {
                        setEditingPlayerId(player.id);
                        setEditingName(player.name);
                      }}
                      title="Click to edit name"
                    >
                      {player.name}
                    </span>
                  )}
                  <div className="roster-item-controls">
                    <select
                      className="rating-select"
                      value={player.rating}
                      onChange={(e) => onUpdatePlayer(player.id, e.target.value as Rating)}
                    >
                      {(['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'D-'] as Rating[]).map(rating => (
                        <option key={rating} value={rating}>{rating}</option>
                      ))}
                    </select>
                    <button
                      className="btn-delete"
                      onClick={() => onDeletePlayer(player.id)}
                      title="Delete player"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RosterModal;