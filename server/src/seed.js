require('dotenv').config();
const { pool } = require('./db');

// Default roster from rosterConfig.ts
const defaultRoster = [
  { name: 'Pops', rating: 'B-' },
  { name: 'Kevin', rating: 'A-' },
  { name: 'Dylan', rating: 'B+' },
  { name: 'Connor', rating: 'B' },
  { name: 'Allen', rating: 'C+' },
  { name: 'Eric W.', rating: 'C' },
  { name: 'Uncle Tim', rating: 'C' },
  { name: 'Tim', rating: 'B-' },
  { name: 'Jimmy', rating: 'C+' },
  { name: 'Kyle', rating: 'B' },
  { name: 'Eric R.', rating: 'C' },
  { name: 'Scott', rating: 'C-' },
  { name: 'Cory', rating: 'B+' },
  { name: 'Mom', rating: 'D+' },
  { name: 'Jared', rating: 'C' },
  { name: 'Joe R.', rating: 'C' },
  { name: 'Sean G.', rating: 'C+' },
  { name: 'Don', rating: 'A' },
  { name: 'Stephen', rating: 'B' },
  { name: 'Christian', rating: 'C' },
  { name: 'Samantha', rating: 'D' },
  { name: 'Eric', rating: 'C' },
  { name: 'Rob E.', rating: 'C' },
  { name: 'Mark G.', rating: 'B' },
  { name: 'Mark N.', rating: 'C+' },
  { name: 'Mark G Sr.', rating: 'C-' },
  { name: 'Tim H.', rating: 'C' },
  { name: 'Tony', rating: 'B-' },
  { name: 'Austin H.', rating: 'C' },
  { name: 'Sean M.', rating: 'C' },
  { name: 'TBD', rating: 'C' },
  { name: 'TBD', rating: 'C' }
];

async function seedRosterConfig() {
  const client = await pool.connect();
  try {
    // Check if roster_config already has data
    const checkResult = await client.query('SELECT COUNT(*) FROM roster_config');
    const count = parseInt(checkResult.rows[0].count);

    if (count > 0) {
      console.log(`Roster config already has ${count} entries. Skipping seed.`);
      return;
    }

    console.log('Seeding roster config...');
    await client.query('BEGIN');

    for (const player of defaultRoster) {
      await client.query(
        'INSERT INTO roster_config (name, rating) VALUES ($1, $2)',
        [player.name, player.rating]
      );
    }

    await client.query('COMMIT');
    console.log(`Successfully seeded ${defaultRoster.length} players to roster_config`);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error seeding roster config:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

seedRosterConfig()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
