# DaangMatino: A Road Network Maintenance Planning System
## Report Ways, Drive Wais

DaangMatino is a road network maintenance planning system that implements optimization algorithms (Knapsack Problem, Dijkstra's Algorithm, and Quick Sort) to efficiently plan road construction and maintenance while providing alternative routes and enabling community participation through road defect reporting.

## Technology Stack
- **Frontend**: HTML5, CSS3, JavaScript
- **Backend**: Node.js
- **Database**: PostgreSQL, Supabase
- **External API**: OpenStreetMap

## Core Algorithms
1. **Knapsack Problem** - Optimize road repair selection within 30-day maintenance cycles
2. **Dijkstra's Algorithm** - Find shortest alternative routes during maintenance
3. **Quick Sort** - Prioritize roads by severity score

## Key Features
- **Citizen Portal**: Report road issues, view alternative routes
- **Admin Portal**: Dashboard analytics, report management, priority scheduling
- **GIS Integration**: Interactive maps with route optimization
- **DPWH Standards**: Road damage assessment based on official criteria

## Installation & Setup
1. **Clone the repository**
```terminal
git clone https://github.com/polopi08/DaangMatino.git
cd daangmatino
```

2. **Install dependencies**
```terminal
npm install
```

3. **Database setup**
```terminal
npm install @supabase/supabase-js
```

4. **Environment configuration**
- Create `.env` file in root directory
- Supabase credentials:
```
SUPABASE_URL=https://rnbmogqzheqzztkpwnif.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJuYm1vZ3F6aGVxenp0a3B3bmlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA2NTkzNjYsImV4cCI6MjA2NjIzNTM2Nn0.AFcODs36IuVEl2R5nWGgQGKU8ruqufUuvk_Qq-DfD14
```

5. **Run the application**
```terminal
npm start
```

6. **Access the system**
- User Portal: `http://localhost:3000`
- Admin Portal: `http://localhost:3000/admin`

## Members
- BAUTISTA, Chryshella Grace
- BOMBOLA, Yvan Raphael  
- DELEN, Melvin John
- FEDERICO, John Richard
- GRAGAS, Nethan Edry
- LASAC, Alliza Leira L.
- NAGERA, Kristina Casandra
- RIMON, Jairus Chrisnie
- TAMARES, John Paul
