# Database Setup Guide

This guide will help you set up the PostgreSQL database for local development and production.

## Prerequisites

- Node.js (v16 or higher)
- PostgreSQL (v12 or higher)

## Local Development Setup

### 1. Install PostgreSQL

**macOS (using Homebrew):**
```bash
brew install postgresql@14
brew services start postgresql@14
```

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

**Windows:**
Download and install from [PostgreSQL official website](https://www.postgresql.org/download/windows/)

### 2. Create Database

```bash
# Connect to PostgreSQL
psql postgres

# Create database
CREATE DATABASE golfteammaker;

# Create user (optional, for security)
CREATE USER golfuser WITH PASSWORD 'yourpassword';
GRANT ALL PRIVILEGES ON DATABASE golfteammaker TO golfuser;

# Exit psql
\q
```

### 3. Configure Environment Variables

**Frontend (.env.local):**
```bash
REACT_APP_API_URL=http://localhost:8080
```

**Backend (server/.env):**
```bash
PORT=8080
DATABASE_URL=postgresql://localhost:5432/golfteammaker
# Or if you created a user:
# DATABASE_URL=postgresql://golfuser:yourpassword@localhost:5432/golfteammaker
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
```

### 4. Install Dependencies

```bash
# Install frontend dependencies (from project root)
npm install

# Install backend dependencies
cd server
npm install
cd ..
```

### 5. Start the Backend Server

The server will automatically create database tables on first run.

```bash
cd server
npm start
# Or for development with auto-reload:
npm run dev
```

You should see:
```
Database schema initialized successfully
Server running on port 8080
Environment: development
```

### 6. Seed Initial Data (Optional)

Populate the roster_config table with default players:

```bash
cd server
node src/seed.js
```

### 7. Start the Frontend

In a new terminal:

```bash
# From project root
npm start
```

The app will open at http://localhost:3000

## Database Schema

The application uses the following tables:

### roster_config
- `id` (SERIAL PRIMARY KEY)
- `name` (VARCHAR) - Player name
- `rating` (VARCHAR) - Rating (A+, A, A-, B+, B, B-, C+, C, C-, D+, D, D-)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

### players
- `id` (VARCHAR PRIMARY KEY)
- `name` (VARCHAR)
- `rating` (VARCHAR)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

### teams
- `id` (VARCHAR PRIMARY KEY)
- `name` (VARCHAR)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

### team_players
- `team_id` (VARCHAR, FK to teams)
- `player_id` (VARCHAR, FK to players)
- `is_locked` (BOOLEAN) - Whether player is captain
- `position` (INTEGER)

### saved_configurations
- `id` (VARCHAR PRIMARY KEY)
- `name` (VARCHAR)
- `data` (JSONB) - Full configuration data
- `created_at` (TIMESTAMP)

## API Endpoints

### Roster Config
- `GET /api/roster-config` - Get all default roster entries
- `POST /api/roster-config` - Add new entry
- `PUT /api/roster-config/:id` - Update entry
- `DELETE /api/roster-config/:id` - Delete entry

### Players
- `GET /api/players` - Get all current players
- `POST /api/players/sync` - Sync all players (bulk update)

### Teams
- `GET /api/teams` - Get all teams with players
- `POST /api/teams/sync` - Sync all teams (bulk update)

### Saved Configurations
- `GET /api/saved-configs` - Get all saved configurations
- `POST /api/saved-configs` - Save new configuration
- `DELETE /api/saved-configs/:id` - Delete configuration

### Health Check
- `GET /health` - Server health check

## Troubleshooting

### Database Connection Errors

**Error: "role does not exist"**
```bash
# Create the PostgreSQL user
createuser -s postgres
```

**Error: "database does not exist"**
```bash
# Create the database
createdb golfteammaker
```

**Error: "password authentication failed"**
- Check your DATABASE_URL in server/.env
- Ensure PostgreSQL is running: `pg_isready`
- Reset password if needed

### Port Already in Use

If port 8080 or 3000 is in use:

```bash
# Find process using port
lsof -i :8080
lsof -i :3000

# Kill the process
kill -9 <PID>
```

Or change the port in your .env files.

### CORS Errors

Make sure CORS_ORIGIN in server/.env matches your frontend URL:
```bash
CORS_ORIGIN=http://localhost:3000
```

## Migration from localStorage

Your existing localStorage data can be manually migrated:

1. Open your current app in browser
2. Open DevTools Console
3. Run:
```javascript
// Export players
console.log(JSON.stringify(JSON.parse(localStorage.getItem('golfPlayers'))))

// Export teams
console.log(JSON.stringify(JSON.parse(localStorage.getItem('golfTeams'))))
```

4. Use the exported data to populate the database via API calls or manually through pgAdmin/psql

## Production Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for DigitalOcean deployment instructions.
