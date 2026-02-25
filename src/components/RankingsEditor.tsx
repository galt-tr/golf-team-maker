import React, { useState, useEffect } from 'react';
import { Rating } from '../types';
import {
  fetchRosterConfig,
  updateRosterConfigEntry,
  addRosterConfigEntry,
  deleteRosterConfigEntry,
  fetchPlayers,
  syncPlayers
} from '../api';

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
  const [originalName, setOriginalName] = useState(''); // Track original name before editing
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerRating, setNewPlayerRating] = useState<Rating>('C');
  const [sortOrder, setSortOrder] = useState<'none' | 'asc' | 'desc'>('none');

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

  const getSortedRosterConfig = () => {
    if (sortOrder === 'none') {
      return rosterConfig;
    }

    const sorted = [...rosterConfig].sort((a, b) => {
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

    return sorted;
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

  const handleUpdateEntry = async (id: number) => {
    try {
      // Update the roster_config (master roster)
      await updateRosterConfigEntry(id, editingName, editingRating);

      // Also update the players table (current session) so changes appear immediately
      const currentPlayers = await fetchPlayers();
      const updatedPlayers = currentPlayers.map(player => {
        // Match by ORIGINAL name (before editing) since name might have changed
        if (player.name === originalName) {
          return { ...player, name: editingName, rating: editingRating };
        }
        return player;
      });
      await syncPlayers(updatedPlayers);

      await loadRosterConfig();
      setEditingId(null);
      setOriginalName('');
    } catch (err) {
      setError('Failed to update entry');
      console.error(err);
    }
  };

  const handleAddEntry = async () => {
    if (!newPlayerName.trim()) return;

    try {
      // Add to roster_config (master roster)
      await addRosterConfigEntry(newPlayerName.trim(), newPlayerRating);

      // Also add to players table (current session)
      const currentPlayers = await fetchPlayers();
      const newPlayer = {
        id: Math.random().toString(36).substr(2, 9),
        name: newPlayerName.trim(),
        rating: newPlayerRating
      };
      await syncPlayers([...currentPlayers, newPlayer]);

      await loadRosterConfig();
      setNewPlayerName('');
      setNewPlayerRating('C');
    } catch (err) {
      setError('Failed to add entry');
      console.error(err);
    }
  };

  const handleDeleteEntry = async (id: number, playerName: string) => {
    if (!window.confirm('Are you sure you want to delete this player from the default roster?')) {
      return;
    }

    try {
      // Delete from roster_config (master roster)
      await deleteRosterConfigEntry(id);

      // Also delete from players table (current session) if they exist
      const currentPlayers = await fetchPlayers();
      const updatedPlayers = currentPlayers.filter(p => p.name !== playerName);
      await syncPlayers(updatedPlayers);

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
    setOriginalName(entry.name); // Save original name for matching
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditingName('');
    setEditingRating('C');
    setOriginalName('');
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2>Default Roster ({rosterConfig.length} players)</h2>
            <button
              className={`btn btn-sort ${sortOrder !== 'none' ? 'active' : ''}`}
              onClick={toggleSort}
              title={
                sortOrder === 'none' ? 'Sort by rating' :
                sortOrder === 'desc' ? 'Sorted A→D (click for D→A)' :
                'Sorted D→A (click to unsort)'
              }
            >
              {sortOrder === 'none' && '↕️ Sort by Rating'}
              {sortOrder === 'desc' && '↓ A→D'}
              {sortOrder === 'asc' && '↑ D→A'}
            </button>
          </div>
          <div className="roster-table">
            <div className="roster-table-header">
              <div className="col-name">Name</div>
              <div className="col-rating">Rating</div>
              <div className="col-actions">Actions</div>
            </div>
            {getSortedRosterConfig().map((entry) => (
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
                        onClick={() => handleDeleteEntry(entry.id, entry.name)}
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
