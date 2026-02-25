require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { pool, initDatabase } = require('./db');

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*'
}));
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ==================== ROSTER CONFIG ENDPOINTS ====================

// Get all roster config entries
app.get('/api/roster-config', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM roster_config ORDER BY id ASC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching roster config:', error);
    res.status(500).json({ error: 'Failed to fetch roster config' });
  }
});

// Add new roster config entry
app.post('/api/roster-config', async (req, res) => {
  try {
    const { name, rating } = req.body;
    const result = await pool.query(
      'INSERT INTO roster_config (name, rating) VALUES ($1, $2) RETURNING *',
      [name, rating]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating roster config:', error);
    res.status(500).json({ error: 'Failed to create roster config entry' });
  }
});

// Update roster config entry
app.put('/api/roster-config/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, rating } = req.body;
    const result = await pool.query(
      'UPDATE roster_config SET name = $1, rating = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *',
      [name, rating, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Roster config entry not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating roster config:', error);
    res.status(500).json({ error: 'Failed to update roster config entry' });
  }
});

// Delete roster config entry
app.delete('/api/roster-config/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM roster_config WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Roster config entry not found' });
    }
    res.json({ message: 'Roster config entry deleted successfully' });
  } catch (error) {
    console.error('Error deleting roster config:', error);
    res.status(500).json({ error: 'Failed to delete roster config entry' });
  }
});

// ==================== PLAYERS ENDPOINTS ====================

// Get all players
app.get('/api/players', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM players ORDER BY created_at ASC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching players:', error);
    res.status(500).json({ error: 'Failed to fetch players' });
  }
});

// Create or update players (bulk upsert)
app.post('/api/players/sync', async (req, res) => {
  try {
    const { players } = req.body;
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Clear existing players
      await client.query('DELETE FROM players');

      // Insert new players
      for (const player of players) {
        await client.query(
          'INSERT INTO players (id, name, rating) VALUES ($1, $2, $3)',
          [player.id, player.name, player.rating]
        );
      }

      await client.query('COMMIT');
      res.json({ message: 'Players synced successfully', count: players.length });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error syncing players:', error);
    res.status(500).json({ error: 'Failed to sync players' });
  }
});

// ==================== TEAMS ENDPOINTS ====================

// Get all teams with players
app.get('/api/teams', async (req, res) => {
  try {
    // Get all teams
    const teamsResult = await pool.query('SELECT * FROM teams ORDER BY id ASC');
    const teams = teamsResult.rows;

    // Get all team-player relationships
    const teamPlayersResult = await pool.query(`
      SELECT tp.team_id, tp.is_locked, p.*
      FROM team_players tp
      JOIN players p ON tp.player_id = p.id
      ORDER BY tp.team_id, tp.position
    `);

    // Group players by team
    const teamPlayersMap = {};
    teamPlayersResult.rows.forEach(row => {
      if (!teamPlayersMap[row.team_id]) {
        teamPlayersMap[row.team_id] = { players: [], lockedPlayers: [] };
      }
      teamPlayersMap[row.team_id].players.push({
        id: row.id,
        name: row.name,
        rating: row.rating
      });
      if (row.is_locked) {
        teamPlayersMap[row.team_id].lockedPlayers.push(row.id);
      }
    });

    // Combine teams with their players
    const teamsWithPlayers = teams.map(team => ({
      id: team.id,
      name: team.name,
      players: teamPlayersMap[team.id]?.players || [],
      lockedPlayers: teamPlayersMap[team.id]?.lockedPlayers || []
    }));

    res.json(teamsWithPlayers);
  } catch (error) {
    console.error('Error fetching teams:', error);
    res.status(500).json({ error: 'Failed to fetch teams' });
  }
});

// Sync teams (bulk upsert)
app.post('/api/teams/sync', async (req, res) => {
  try {
    const { teams } = req.body;
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Clear existing data
      await client.query('DELETE FROM team_players');
      await client.query('DELETE FROM teams');

      // Insert teams and their players
      for (const team of teams) {
        await client.query(
          'INSERT INTO teams (id, name) VALUES ($1, $2)',
          [team.id, team.name]
        );

        // Insert team-player relationships
        for (let i = 0; i < team.players.length; i++) {
          const player = team.players[i];
          const isLocked = team.lockedPlayers && team.lockedPlayers.includes(player.id);
          await client.query(
            'INSERT INTO team_players (team_id, player_id, is_locked, position) VALUES ($1, $2, $3, $4)',
            [team.id, player.id, isLocked, i]
          );
        }
      }

      await client.query('COMMIT');
      res.json({ message: 'Teams synced successfully', count: teams.length });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error syncing teams:', error);
    res.status(500).json({ error: 'Failed to sync teams' });
  }
});

// ==================== SAVED CONFIGURATIONS ENDPOINTS ====================

// Get all saved configurations
app.get('/api/saved-configs', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM saved_configurations ORDER BY created_at DESC');
    res.json(result.rows.map(row => ({
      id: row.id,
      name: row.name,
      date: row.created_at,
      ...row.data
    })));
  } catch (error) {
    console.error('Error fetching saved configs:', error);
    res.status(500).json({ error: 'Failed to fetch saved configurations' });
  }
});

// Save configuration
app.post('/api/saved-configs', async (req, res) => {
  try {
    const { id, name, teams, unassignedPlayers } = req.body;
    const data = { teams, unassignedPlayers };

    const result = await pool.query(
      'INSERT INTO saved_configurations (id, name, data) VALUES ($1, $2, $3) RETURNING *',
      [id, name, JSON.stringify(data)]
    );

    res.status(201).json({
      id: result.rows[0].id,
      name: result.rows[0].name,
      date: result.rows[0].created_at,
      ...result.rows[0].data
    });
  } catch (error) {
    console.error('Error saving configuration:', error);
    res.status(500).json({ error: 'Failed to save configuration' });
  }
});

// Delete saved configuration
app.delete('/api/saved-configs/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM saved_configurations WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Configuration not found' });
    }
    res.json({ message: 'Configuration deleted successfully' });
  } catch (error) {
    console.error('Error deleting configuration:', error);
    res.status(500).json({ error: 'Failed to delete configuration' });
  }
});

// Start server
async function startServer() {
  try {
    // Initialize database
    await initDatabase();

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
