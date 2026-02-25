# Vercel Deployment Guide

## 🚀 One-Click Deploy

The easiest way to deploy this app to Vercel:

### Step 1: Set Up Database

Choose **Option A** (Recommended) or **Option B**:

#### Option A: Vercel Postgres (Easiest)

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Storage" → "Create Database"
3. Choose "Postgres"
4. Click "Create"
5. Copy the connection string (starts with `postgres://`)

#### Option B: Supabase (Free Tier)

1. Go to [Supabase](https://supabase.com)
2. Create new project
3. Go to Settings → Database
4. Copy "Connection string" (URI mode)
5. Replace `[YOUR-PASSWORD]` with your database password

### Step 2: Deploy to Vercel

1. **Push to Your GitHub:**
   ```bash
   git push fork master
   ```

2. **Import to Vercel:**
   - Go to [Vercel](https://vercel.com/new)
   - Click "Import Project"
   - Select your GitHub repo: `connormurray2/golf-team-maker`
   - Click "Import"

3. **Configure Environment Variables:**
   Add these in Vercel project settings:

   ```
   POSTGRES_URL = your-connection-string-here
   NODE_ENV = production
   ```

4. **Deploy:**
   - Click "Deploy"
   - Wait ~2 minutes
   - Your app is live! 🎉

### Step 3: Initialize Database

After first deployment:

1. Go to Vercel Dashboard → Your Project → Settings → Functions
2. Find the `/api` function
3. Click "View Logs"
4. The database tables will be created automatically on first API call

Or manually run the schema:

```sql
-- Connect to your database and run:

CREATE TABLE IF NOT EXISTS roster_config (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  rating VARCHAR(3) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS players (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  rating VARCHAR(3) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS teams (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS team_players (
  team_id VARCHAR(50) REFERENCES teams(id) ON DELETE CASCADE,
  player_id VARCHAR(50) REFERENCES players(id) ON DELETE CASCADE,
  is_locked BOOLEAN DEFAULT FALSE,
  position INTEGER,
  PRIMARY KEY (team_id, player_id)
);

CREATE TABLE IF NOT EXISTS saved_configurations (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Step 4: Seed Default Roster

Add your default players:

1. Go to your deployed app: `https://your-app.vercel.app/rankings`
2. Click "Add New Player"
3. Add each player with their rating
4. Or use the API:

```bash
curl -X POST https://your-app.vercel.app/api/roster-config \
  -H "Content-Type: application/json" \
  -d '{"name": "Player Name", "rating": "B+"}'
```

## 🔧 Troubleshooting

### Database Connection Issues

If you see "Failed to connect to database":

1. Check your `POSTGRES_URL` is correct
2. Make sure it includes `?sslmode=require` at the end
3. For Vercel Postgres, use `POSTGRES_URL` (not `DATABASE_URL`)
4. For other databases, try both `POSTGRES_URL` and `DATABASE_URL`

### API Not Working

1. Check Vercel Functions logs
2. Verify `/api` routes are accessible
3. Check CORS settings if needed

### Frontend Can't Connect to Backend

The frontend automatically uses the same domain for API calls, so no configuration needed!

## 📊 Costs

- **Vercel Hosting**: Free (Hobby plan)
- **Vercel Postgres**: Free tier available (60 hours compute)
- **Supabase**: Free tier (500MB database, 2GB bandwidth)

**Total: $0-15/month** depending on usage

## 🎯 Features After Deployment

✅ Multi-user collaboration
✅ Real-time data sync
✅ Persistent storage
✅ Global CDN for fast loading
✅ Automatic HTTPS
✅ Zero configuration needed

Your golf team maker is production-ready! 🏌️‍♂️⛳
