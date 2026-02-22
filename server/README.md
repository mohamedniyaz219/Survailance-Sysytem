# Server Setup Guide

This document explains the requirements and steps to run the backend server.

## Requirements

- Node.js (recommended: 20+)
- npm
- PostgreSQL (recommended: 14+)
- PostGIS extension available in your PostgreSQL installation

## 1) Install Dependencies

From the `server` folder:

```bash
npm install
```

## 2) Configure Environment

Create/update `.env` in the `server` folder.

Example:

```env
PORT=3000

DB_HOST=localhost
DB_PORT=5432
DB_NAME=survailance_system
DB_USER=postgres
DB_PASSWORD=postgres
DB_SSL=false
DB_LOGGING=false
DB_SYNC=true

JWT_SECRET=replace-with-strong-secret
```

## 3) Create Database

Create the database defined in `DB_NAME`.

```bash
createdb survailance_system
```

If your PostgreSQL user needs explicit host/port/user:

```bash
PGPASSWORD=postgres createdb -h localhost -p 5432 -U postgres survailance_system
```

## 4) Ensure PostGIS Is Available

The initial migration uses geometry columns and requires PostGIS.

### macOS (Homebrew)

```bash
brew install postgis
```

Verify extension availability:

```bash
PGPASSWORD=postgres psql -h localhost -p 5432 -U postgres -d survailance_system -c "SELECT name, default_version FROM pg_available_extensions WHERE name='postgis';"
```

Expected output should include `postgis`.

## 5) Run Migrations

```bash
npm run db:migrate
```

Optional seed data:

```bash
npm run db:seed
```

## 6) Start Server

Development mode:

```bash
npm run dev-start
```

Production-like mode:

```bash
npm run prod-start
```

## Useful Scripts

- `npm run start` - Start with Node directly
- `npm run dev-start` - Start with nodemon in development mode
- `npm run prod-start` - Start with nodemon in production mode
- `npm run db:migrate` - Run migrations
- `npm run db:migrate:undo` - Undo last migration
- `npm run db:seed` - Run all seeders
- `npm run db:seed:undo` - Undo all seeders

## Troubleshooting

### Error: `extension "postgis" is not available`

Install PostGIS and retry migration:

```bash
brew install postgis
npm run db:migrate
```

### Error: `database "survailance_system" does not exist`

Create the database and rerun migration:

```bash
PGPASSWORD=postgres createdb -h localhost -p 5432 -U postgres survailance_system
npm run db:migrate
```

### Error: `EADDRINUSE: address already in use :::3000`

Port is busy. Kill the process or change `PORT` in `.env`.

```bash
lsof -i :3000
kill -9 <PID>
```
