# London App Architecture

## Overview
A mobile-first web application for discovering notable places in London - history, architecture, food, pubs, and curated tours.

## Tech Stack
- **Frontend**: SvelteKit
- **Backend**: Node.js (Express)
- **Database**: Supabase (PostgreSQL)
- **Maps**: Leaflet

## Project Structure

```
london-app/
├── frontend/                 # SvelteKit application
│   ├── src/
│   │   ├── lib/
│   │   │   ├── components/   # Reusable UI components
│   │   │   │   ├── map/      # Map-related components
│   │   │   │   ├── ui/       # Generic UI components
│   │   │   │   └── layers/   # Layer toggle components
│   │   │   ├── services/     # API service modules
│   │   │   ├── stores/       # Svelte stores (state management)
│   │   │   ├── types/        # TypeScript interfaces/types
│   │   │   └── utils/        # Helper functions
│   │   ├── routes/           # SvelteKit routes (pages)
│   │   └── app.html
│   ├── static/               # Static assets
│   └── package.json
│
├── backend/                  # Node.js API server
│   ├── src/
│   │   ├── controllers/      # Route handlers
│   │   ├── services/         # Business logic
│   │   ├── middleware/       # Express middleware
│   │   ├── routes/           # API route definitions
│   │   ├── config/           # Configuration (db, env)
│   │   ├── types/            # TypeScript interfaces
│   │   └── index.ts          # Entry point
│   └── package.json
│
├── shared/                   # Shared types/constants (optional)
│   └── types/
│
└── ARCHITECTURE.md           # This file
```

## Design Principles

### 1. Separation of Concerns
- **Frontend**: UI rendering, user interactions, state management
- **Backend**: Data validation, business logic, database operations
- **Database**: Data persistence, relationships, constraints

### 2. Component Architecture
- Keep components small and focused (single responsibility)
- Extract reusable logic into services/utils
- Use Svelte stores for shared state
- Components should be importable and composable

### 3. DRY (Don't Repeat Yourself)
- Shared types between frontend/backend where applicable
- Utility functions for common operations
- Service modules for API calls
- Reusable UI components

### 4. Maintainability
- Consistent naming conventions (kebab-case for files, PascalCase for components)
- TypeScript throughout for type safety
- Clear folder structure by feature/responsibility
- Environment-based configuration

## Data Model (Supabase)

### Tables

```sql
-- Places table
places (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  latitude DECIMAL NOT NULL,
  longitude DECIMAL NOT NULL,
  category TEXT NOT NULL,  -- 'history', 'architecture', 'food', 'pub'
  tags TEXT[],
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
)

-- Tours table
tours (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  duration_minutes INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
)

-- Tour stops (join table)
tour_stops (
  id UUID PRIMARY KEY,
  tour_id UUID REFERENCES tours(id),
  place_id UUID REFERENCES places(id),
  stop_order INTEGER NOT NULL,
  notes TEXT
)
```

## API Endpoints

```
GET    /api/places           - Get all places (with optional category filter)
GET    /api/places/:id       - Get single place
POST   /api/places           - Create place
PUT    /api/places/:id       - Update place
DELETE /api/places/:id       - Delete place

GET    /api/tours            - Get all tours
GET    /api/tours/:id        - Get tour with stops
POST   /api/tours            - Create tour
```

## Map Layers

| Layer | Category | Icon Color |
|-------|----------|------------|
| History | history | Blue |
| Architecture | architecture | Purple |
| Food | food | Orange |
| Pubs | pub | Amber |
| Tours | tour | Green (polylines) |

## Environment Variables

### Frontend (.env)
```
PUBLIC_API_URL=http://localhost:3001/api
PUBLIC_SUPABASE_URL=your-supabase-url
PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### Backend (.env)
```
PORT=3001
SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_KEY=your-service-key
NODE_ENV=development
```

## Development Commands

```bash
# Frontend (from /frontend)
npm run dev          # Start dev server
npm run build        # Production build

# Backend (from /backend)
npm run dev          # Start with nodemon
npm run build        # Compile TypeScript
npm start            # Run production
```

## Mobile-First Approach
- Touch-friendly map controls
- Bottom sheet for place details
- Collapsible layer controls
- Responsive typography and spacing
- PWA-ready structure
