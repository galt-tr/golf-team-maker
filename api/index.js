// Vercel serverless function wrapper for Express app
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();

// Database connection pool
const pool = new Pool({
  connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*'
}));
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ==================== ROSTER CONFIG ENDPOINTS ====================

app.get('/api/roster-config', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM roster_config ORDER BY id ASC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching roster config:', error);
    res.status(500).json({ error: 'Failed to fetch roster config' });
  }
});

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

app.get('/api/players', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM players ORDER BY created_at ASC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching players:', error);
    res.status(500).json({ error: 'Failed to fetch players' });
  }
});

app.post('/api/players/sync', async (req, res) => {
  try {
    const { players } = req.body;
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      for (const player of players) {
        await client.query(
          `INSERT INTO players (id, name, rating, updated_at)
           VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
           ON CONFLICT (id)
           DO UPDATE SET name = $2, rating = $3, updated_at = CURRENT_TIMESTAMP`,
          [player.id, player.name, player.rating]
        );
      }

      const playerIds = players.map(p => p.id);
      if (playerIds.length > 0) {
        await client.query(
          'DELETE FROM players WHERE id NOT IN (' + playerIds.map((_, i) => `$${i + 1}`).join(',') + ')',
          playerIds
        );
      } else {
        await client.query('DELETE FROM players');
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

app.get('/api/teams', async (req, res) => {
  try {
    const teamsResult = await pool.query('SELECT * FROM teams ORDER BY id ASC');
    const teams = teamsResult.rows;

    const teamPlayersResult = await pool.query(`
      SELECT tp.team_id, tp.is_locked, p.*
      FROM team_players tp
      JOIN players p ON tp.player_id = p.id
      ORDER BY tp.team_id, tp.position
    `);

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

app.post('/api/teams/sync', async (req, res) => {
  try {
    const { teams } = req.body;
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      for (const team of teams) {
        await client.query(
          `INSERT INTO teams (id, name, updated_at)
           VALUES ($1, $2, CURRENT_TIMESTAMP)
           ON CONFLICT (id)
           DO UPDATE SET name = $2, updated_at = CURRENT_TIMESTAMP`,
          [team.id, team.name]
        );
      }

      const teamIds = teams.map(t => t.id);
      if (teamIds.length > 0) {
        await client.query(
          'DELETE FROM team_players WHERE team_id IN (' + teamIds.map((_, i) => `$${i + 1}`).join(',') + ')',
          teamIds
        );
      }

      for (const team of teams) {
        for (let i = 0; i < team.players.length; i++) {
          const player = team.players[i];
          const isLocked = team.lockedPlayers && team.lockedPlayers.includes(player.id);

          const playerExists = await client.query('SELECT id FROM players WHERE id = $1', [player.id]);
          if (playerExists.rows.length > 0) {
            await client.query(
              'INSERT INTO team_players (team_id, player_id, is_locked, position) VALUES ($1, $2, $3, $4)',
              [team.id, player.id, isLocked, i]
            );
          } else {
            console.warn(`Player ${player.id} (${player.name}) not found, skipping`);
          }
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

// ==================== SAVED CONFIGURATIONS ====================

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

// Export for Vercel
module.exports = app;
