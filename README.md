# Finance Importer

Personal finance CSV → Power BI pipeline.

## Stack
- Frontend: React 18 + Vite + Fluent UI v9
- Backend: Node.js + Express
- Database: SQLite (better-sqlite3)
- AI: Anthropic Claude (auto-categorization)
- Export: SheetJS

## Setup

### 1. Install
```bash
npm run install:all
```

### 2. Configure
```bash
cp .env.example .env
# Add your ANTHROPIC_API_KEY
```

### 3. Run dev
```bash
npm run dev
# Frontend → http://localhost:5173
# Backend  → http://localhost:3001
```

### 4. Production
```bash
npm run build && npm start
```

## Extending

**New CSV source** → edit `server/services/csvParser.js` (detectSource + normalizeRow)

**New API endpoint** → add route file in `server/routes/`, register in `server/server.js`, add fetch fn to `client/src/api/client.js`

**New UI tab** → add component in `client/src/components/tabs/`, add Tab in `Shell.jsx`, render in `App.jsx`

**New category** → POST /api/categories or add to seed.js

**DB migration** → append ALTER/CREATE to `server/db/database.js`

## API

| Method | Path | Description |
|---|---|---|
| GET | /api/stats | Summary |
| POST | /api/transactions/upload | Parse CSV |
| GET | /api/transactions | Paginated list |
| PATCH | /api/transactions/:id | Update fields |
| DELETE | /api/transactions/:id | Delete one |
| DELETE | /api/transactions | Clear all |
| POST | /api/transactions/categorize | AI categorize |
| GET/POST/PATCH/DELETE | /api/earnings | Earnings CRUD |
| GET/POST/DELETE | /api/categories | Category CRUD |
| GET/PUT/DELETE | /api/mappings | Mapping rules |
| GET | /api/export | Download .xlsx |
