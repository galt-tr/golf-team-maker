# Deployment Guide for DigitalOcean

## Prerequisites

1. DigitalOcean account
2. GitHub repository connected to DigitalOcean App Platform

## Database Setup

### Option 1: Managed Database (Recommended for Production)

1. In DigitalOcean, create a managed PostgreSQL database:
   - Go to Databases → Create Database
   - Choose PostgreSQL version 12+
   - Select region (same as your app)
   - Choose Basic plan (starts at $15/month)

2. Once created, note the connection string

### Option 2: In-App Database (Simpler)

The `.do/app.yaml` file includes database configuration that will automatically create a dev database.

## Deployment Steps

### Method 1: Using the DigitalOcean CLI (doctl)

```bash
# Install doctl if you haven't
brew install doctl  # macOS
# or download from https://docs.digitalocean.com/reference/doctl/how-to/install/

# Authenticate
doctl auth init

# Create app from spec
doctl apps create --spec .do/deploy.app.yaml

# Or update existing app
doctl apps update YOUR_APP_ID --spec .do/deploy.app.yaml
```

### Method 2: Using the DigitalOcean Dashboard

1. Go to App Platform in DigitalOcean dashboard
2. Click "Edit App Spec" or "Create App"
3. Copy the contents of `.do/deploy.app.yaml`
4. Paste into the spec editor
5. Set up environment variables:
   - `DATABASE_URL`: Your PostgreSQL connection string
   - `REACT_APP_API_URL`: Will be auto-set to your API service URL

### Method 3: GitHub Integration (Recommended)

1. Push your code to GitHub
2. In DigitalOcean App Platform:
   - Click "Create App"
   - Connect your GitHub repository
   - Select branch: `master`
   - DigitalOcean will detect the mono-repo structure
3. Configure components:
   - **Backend Service** (api):
     - Source Directory: `/server`
     - Build Command: `npm install`
     - Run Command: `npm start`
     - HTTP Port: `8080`
     - Environment Variables:
       - `NODE_ENV=production`
       - `DATABASE_URL=<your-postgres-url>`
       - `PORT=8080`

   - **Frontend Static Site** (web):
     - Source Directory: `/` (root)
     - Build Command: `npm run build`
     - Output Directory: `build`
     - Environment Variables:
       - `REACT_APP_API_URL=${api.PUBLIC_URL}`

4. Click "Create Resources"

## Initial Database Setup

After deployment, seed the database with default roster:

```bash
# SSH into your API service or run this locally against production DB
DATABASE_URL="your-production-db-url" node server/src/seed.js
```

Or use DigitalOcean console:
1. Go to your API service
2. Open Console tab
3. Run: `node src/seed.js`

## Environment Variables

### Backend (API Service)
- `NODE_ENV`: `production`
- `DATABASE_URL`: PostgreSQL connection string
- `PORT`: `8080`
- `CORS_ORIGIN`: Your frontend URL (auto-set via ${APP_URL})

### Frontend (Web Static Site)
- `REACT_APP_API_URL`: Backend API URL (auto-set via ${api.PUBLIC_URL})

## Updating the App

After making changes:

1. Commit and push to GitHub
2. DigitalOcean will automatically detect changes and redeploy
3. Or manually trigger deployment in the DigitalOcean dashboard

## Monitoring

- Check logs in DigitalOcean dashboard under each component
- Health check endpoint: `https://your-api-url/health`

## Costs

- **Basic API Service**: ~$5/month (basic-xxs)
- **Static Site**: Free
- **Managed PostgreSQL**: ~$15/month (basic plan)
- **Total**: ~$20/month

## Troubleshooting

### Backend won't start
- Check DATABASE_URL is set correctly
- Verify PostgreSQL database is running
- Check logs for connection errors

### Frontend can't connect to backend
- Verify REACT_APP_API_URL is set correctly
- Check CORS settings in backend
- Ensure API service is running

### Database connection issues
- Verify DATABASE_URL format: `postgresql://user:password@host:port/database`
- For managed DB, ensure SSL is enabled
- Check firewall settings (trusted sources)
