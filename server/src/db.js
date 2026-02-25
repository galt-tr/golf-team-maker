const { Pool } = require('pg');

// Database connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Initialize database schema
async function initDatabase() {
  const client = await pool.connect();
  try {
    // Roster Config table - the default/master roster
    await client.query(`
      CREATE TABLE IF NOT EXISTS roster_config (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        rating VARCHAR(3) NOT NULL CHECK (rating IN ('A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'D-')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Players table - current session players
    await client.query(`
      CREATE TABLE IF NOT EXISTS players (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        rating VARCHAR(3) NOT NULL CHECK (rating IN ('A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'D-')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Teams table
    await client.query(`
      CREATE TABLE IF NOT EXISTS teams (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Team players junction table
    await client.query(`
      CREATE TABLE IF NOT EXISTS team_players (
        team_id VARCHAR(50) REFERENCES teams(id) ON DELETE CASCADE,
        player_id VARCHAR(50) REFERENCES players(id) ON DELETE CASCADE,
        is_locked BOOLEAN DEFAULT FALSE,
        position INTEGER,
        PRIMARY KEY (team_id, player_id)
      )
    `);

    // Saved configurations table
    await client.query(`
      CREATE TABLE IF NOT EXISTS saved_configurations (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        data JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create indexes for better performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_team_players_team ON team_players(team_id);
      CREATE INDEX IF NOT EXISTS idx_team_players_player ON team_players(player_id);
    `);

    console.log('Database schema initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  } finally {
    client.release();
  }
}

module.exports = {
  pool,
  initDatabase
};
