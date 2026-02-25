import React, { useState, useEffect } from 'react';
import { Rating } from '../types';
import { fetchRosterConfig, updateRosterConfigEntry, addRosterConfigEntry, deleteRosterConfigEntry } from '../api';

interface RosterConfigEntry {
  id: number;
  name: string;
  rating: Rating;
}

const RankingsEditor: React.FC = () => {
  const [rosterConfig, setRosterConfig] = useState<RosterConfigEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState('');
  const [editingRating, setEditingRating] = useState<Rating>('C');
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerRating, setNewPlayerRating] = useState<Rating>('C');

  useEffect(() => {
    loadRosterConfig();
  }, []);

  const loadRosterConfig = async () => {
    try {
      setLoading(true);
      const data = await fetchRosterConfig();
      setRosterConfig(data);
      setError(null);
    } catch (err) {
      setError('Failed to load roster config');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateEntry = async (id: number) => {
    try {
      await updateRosterConfigEntry(id, editingName, editingRating);
      await loadRosterConfig();
      setEditingId(null);
    } catch (err) {
      setError('Failed to update entry');
      console.error(err);
    }
  };

  const handleAddEntry = async () => {
    if (!newPlayerName.trim()) return;

    try {
      await addRosterConfigEntry(newPlayerName.trim(), newPlayerRating);
      await loadRosterConfig();
      setNewPlayerName('');
      setNewPlayerRating('C');
    } catch (err) {
      setError('Failed to add entry');
      console.error(err);
    }
  };

  const handleDeleteEntry = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this player from the default roster?')) {
      return;
    }

    try {
      await deleteRosterConfigEntry(id);
      await loadRosterConfig();
    } catch (err) {
      setError('Failed to delete entry');
      console.error(err);
    }
  };

  const startEditing = (entry: RosterConfigEntry) => {
    setEditingId(entry.id);
    setEditingName(entry.name);
    setEditingRating(entry.rating);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditingName('');
    setEditingRating('C');
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading">Loading roster configuration...</div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="rankings-editor-header">
        <h1>Rankings Editor</h1>
        <p className="subtitle">
          Edit the default roster and player rankings. These rankings will be used when creating new teams.
        </p>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="rankings-editor-content">
        <div className="add-player-section">
          <h2>Add New Player</h2>
          <div className="add-player-form">
            <input
              type="text"
              className="player-input"
              placeholder="Player name"
              value={newPlayerName}
              onChange={(e) => setNewPlayerName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddEntry()}
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
            <button className="btn btn-add" onClick={handleAddEntry}>
              Add Player
            </button>
          </div>
        </div>

        <div className="roster-config-list">
          <h2>Default Roster ({rosterConfig.length} players)</h2>
          <div className="roster-table">
            <div className="roster-table-header">
              <div className="col-name">Name</div>
              <div className="col-rating">Rating</div>
              <div className="col-actions">Actions</div>
            </div>
            {rosterConfig.map((entry) => (
              <div key={entry.id} className="roster-table-row">
                {editingId === entry.id ? (
                  <>
                    <div className="col-name">
                      <input
                        type="text"
                        className="player-name-edit"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        autoFocus
                      />
                    </div>
                    <div className="col-rating">
                      <select
                        className="rating-select"
                        value={editingRating}
                        onChange={(e) => setEditingRating(e.target.value as Rating)}
                      >
                        {(['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'D-'] as Rating[]).map(rating => (
                          <option key={rating} value={rating}>{rating}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-actions">
                      <button
                        className="btn btn-small btn-primary"
                        onClick={() => handleUpdateEntry(entry.id)}
                      >
                        Save
                      </button>
                      <button
                        className="btn btn-small"
                        onClick={cancelEditing}
                      >
                        Cancel
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="col-name">{entry.name}</div>
                    <div className="col-rating">
                      <span className={`rating-badge rating-${entry.rating.replace('+', 'plus').replace('-', 'minus')}`}>
                        {entry.rating}
                      </span>
                    </div>
                    <div className="col-actions">
                      <button
                        className="btn btn-small"
                        onClick={() => startEditing(entry)}
                      >
                        Edit
                      </button>
                      <button
                        className="btn-delete"
                        onClick={() => handleDeleteEntry(entry.id)}
                        title="Delete player"
                      >
                        🗑️
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RankingsEditor;
