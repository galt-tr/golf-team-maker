# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm start` - Runs the development server on http://localhost:3000
- `npm run build` - Creates production build in ./build directory
- `npm test` - Runs Jest tests in watch mode
- `npm test -- --watchAll=false` - Runs tests once without watch mode
- `npm test -- --watchAll=false --coverage` - Runs tests with coverage report

## Architecture

This is a React TypeScript application for creating golf teams, built with Create React App. It features:

### Core Application Structure
- **Main App** (`src/App.tsx`): Central state management using React hooks, handles all team/player operations
- **State Persistence**: Uses localStorage to persist players and teams data between sessions
- **Drag & Drop**: Native HTML5 drag/drop API for moving players between teams and roster

### Key Data Models (`src/types.ts`)
- **Player**: ID, name, and rating (A/B/C/D)
- **Team**: ID, name, players array, and lockedPlayers Set for captain designation
- **DragItem**: Tracks player being dragged and source location

### Component Architecture
- **Roster** (`src/components/Roster.tsx`): Displays unassigned players
- **TeamBox** (`src/components/TeamBox.tsx`): Individual team container with 4-player limit
- **RosterModal** (`src/components/RosterModal.tsx`): Modal for managing player roster (add/edit/delete)
- **PlayerCard** (`src/components/PlayerCard.tsx`): Individual player display with drag capability

### Key Features
- Team randomization with locked player (captain) support
- CSV/Excel export functionality with team summaries
- Rating-based sorting (A→D or D→A)
- 8 teams × 4 players maximum capacity
- Player management (add/edit/delete/rating changes)