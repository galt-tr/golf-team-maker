# Golf Team Maker

A collaborative web application for creating and balancing golf teams with player rankings.

## Features

- **Team Building**: Create up to 8 teams with 4 players each
- **Player Management**: Add, edit, and delete players with A-D ratings
- **Drag & Drop**: Intuitive drag-and-drop interface for team assignment
- **Team Balancing**: Automatic team balancing algorithm for fair distribution
- **Captain Lock**: Lock players (captains) to specific teams
- **Rankings Editor**: Edit default player roster and ratings
- **Save/Load**: Save and load team configurations
- **Export**: Export teams to CSV/Excel format
- **Real-time Sync**: Database-backed multi-user collaboration

## Tech Stack

### Frontend
- React 19 with TypeScript
- React Router for navigation
- Native HTML5 drag-and-drop API
- Responsive CSS with gradients

### Backend
- Node.js with Express
- PostgreSQL database
- RESTful API architecture

### Deployment
- DigitalOcean App Platform
- Managed PostgreSQL database

## Getting Started

### Quick Start (Local Development)

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd golf-team-maker
   ```

2. **Set up PostgreSQL database**
   ```bash
   # Install PostgreSQL (macOS)
   brew install postgresql@14
   brew services start postgresql@14

   # Create database
   createdb golfteammaker
   ```

3. **Configure environment variables**
   ```bash
   # Frontend
   cp .env.example .env.local
   # Edit .env.local if needed

   # Backend
   cd server
   cp .env.example .env
   # Edit server/.env with your database URL
   ```

4. **Install dependencies and start**
   ```bash
   # Install frontend dependencies (from root)
   npm install

   # Install backend dependencies
   cd server
   npm install

   # Start backend (from server/)
   npm start

   # In a new terminal, start frontend (from root)
   npm start
   ```

5. **Seed initial data** (optional)
   ```bash
   cd server
   node src/seed.js
   ```

Visit http://localhost:3000 to use the app!

## Documentation

- [Database Setup Guide](./DATABASE_SETUP.md) - Detailed database configuration
- [Deployment Guide](./DEPLOYMENT.md) - DigitalOcean deployment instructions
- [CLAUDE.md](./CLAUDE.md) - Development commands and architecture

## Project Structure

```
golf-team-maker/
├── public/              # Static assets
├── src/
│   ├── components/      # React components
│   │   ├── Navigation.tsx
│   │   ├── RankingsEditor.tsx
│   │   ├── Roster.tsx
│   │   ├── TeamBox.tsx
│   │   ├── PlayerCard.tsx
│   │   └── Modals...
│   ├── api.ts          # API client functions
│   ├── types.ts        # TypeScript types
│   ├── App.tsx         # Main team builder
│   └── App.css         # Styles
├── server/
│   └── src/
│       ├── server.js   # Express server
│       ├── db.js       # Database setup
│       └── seed.js     # Data seeding
├── .do/                # DigitalOcean config
└── README.md
```

## Usage

### Team Builder (Main Page)

1. **Add Players**: Click "Manage Roster" to add/edit players
2. **Drag & Drop**: Drag players from roster to teams
3. **Lock Captains**: Click lock icon to designate team captains
4. **Randomize**: Randomly distribute players to teams
5. **Balance**: Algorithmically balance teams by rating
6. **Sort**: Sort roster by rating (A→D or D→A)
7. **Save**: Save current configuration for later
8. **Export**: Download team assignments as CSV

### Rankings Editor

1. Navigate to "Rankings Editor" in top navigation
2. Edit default player names and ratings
3. Add new players to the default roster
4. Delete players from the roster
5. Changes persist in database for all users

## API Reference

### Base URL
- Development: `http://localhost:8080`
- Production: Set via `REACT_APP_API_URL`

### Endpoints

**Roster Config**
- `GET /api/roster-config` - Get default roster
- `POST /api/roster-config` - Add player to roster
- `PUT /api/roster-config/:id` - Update player
- `DELETE /api/roster-config/:id` - Delete player

**Players & Teams**
- `GET /api/players` - Get current players
- `POST /api/players/sync` - Sync players
- `GET /api/teams` - Get teams
- `POST /api/teams/sync` - Sync teams

**Saved Configurations**
- `GET /api/saved-configs` - List saved configs
- `POST /api/saved-configs` - Save config
- `DELETE /api/saved-configs/:id` - Delete config

## Development

### Available Scripts

**Frontend:**
- `npm start` - Run development server
- `npm run build` - Create production build
- `npm test` - Run tests

**Backend:**
- `npm start` - Start server
- `npm run dev` - Start with auto-reload (nodemon)

### Database Migrations

The database schema is automatically created on first server start. To reset:

```bash
psql golfteammaker
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
\q
# Restart server to recreate tables
```

## Deployment

Deploy to DigitalOcean App Platform:

1. Create PostgreSQL database in DigitalOcean
2. Push code to GitHub
3. Create new App in DigitalOcean
4. Configure using `.do/deploy.app.yaml`
5. Set environment variables
6. Deploy!

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - feel free to use this for your golf tournaments!

## Support

For issues or questions:
- Check [DATABASE_SETUP.md](./DATABASE_SETUP.md) for setup issues
- Check [DEPLOYMENT.md](./DEPLOYMENT.md) for deployment issues
- Open an issue on GitHub

## Acknowledgments

Built with ⛳ for better golf tournaments!
