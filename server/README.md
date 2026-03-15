# Server – Multi-tenant API

## What this project contains

- Express + Sequelize REST API with tenant-aware routing under `src/controllers`.
- Sequelize migrations + seeders that bootstrap the `public` tenant, tenant access config, responder tracking, and PostGIS geometry support.
- Middleware for authentication (`authMiddleware.js`), tenant resolution (`tenantResolver.js`), and multi-tenant asset uploads.
- AI ingestion endpoint (`/api/v1/ai/detect`), dashboard/incident management routes, responder tracking, and anomaly rule APIs.

## Status

- Actively maintained for multi-tenant scenarios; migrations already expect PostGIS in the `public` schema.
- Sequelize models are split between `public/` and `tenant/` under `src/models`.
- Redis/Socket-based services exist but rely on the `server/config/redis.js` and `server/src/services/socketService.js` helpers.

## Requirements

- Node.js 20+ (LTS preferred) and npm.
- PostgreSQL 14+ with PostGIS and the `vector` extension (optional, but the face-vector column is declared as an array). Ensure the database user can create extensions.
- Optional: Redis if you plan to enable WebSocket-based responder tracking updates.

## Environment configuration

Create a `.env` file at `server/.env` (never commit secrets). The following values are required at minimum:

```
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=survailance_system
DB_USER=postgres
DB_PASSWORD=postgres
DB_SSL=false
DB_LOGGING=false
DB_SYNC=false
JWT_SECRET=replace-with-strong-secret
```

Add `REDIS_URL` if you are running the real-time services and keep `DB_SYNC=true` only in disposable environments.

## Setup steps

1. Install dependencies:
   ```bash
   cd server
   npm install
   ```
2. Prepare the PostgreSQL database (replace credentials as needed):
   ```bash
   createdb survailance_system
   # or with explicit credentials
   PGPASSWORD=postgres createdb -h localhost -p 5432 -U postgres survailance_system
   ```
3. Enable necessary extensions:
   ```bash
   psql -h localhost -p 5432 -U postgres -d survailance_system -c "CREATE EXTENSION IF NOT EXISTS postgis;"
   psql -h localhost -p 5432 -U postgres -d survailance_system -c "CREATE EXTENSION IF NOT EXISTS vector;" # optional
   ```
4. Run migrations and optional seed data:
   ```bash
   npm run db:migrate
   npm run db:seed
   ```
5. Launch the API:
   ```bash
   npm run dev-start # nodemon + live reload in development
   npm run prod-start # production-ready node process
   ```

## Useful scripts

- `npm run db:migrate`: Run all pending migrations.
- `npm run db:migrate:undo`: Roll back the last migration batch.
- `npm run db:seed`: Seed data (useful for tenants/identity archetypes).
- `npm run db:seed:undo`: Undo seeded content.
- `npm run dev-start`: Start the server with live reload.
- `npm run prod-start`: Start using the compiled Node.js entry point.

## Troubleshooting

- **PostGIS missing**: Install via Homebrew (`brew install postgis`) or your distro package manager, then rerun the SQL commands above.
- **Database already exists error**: Drop the database (`dropdb survailance_system`) before recreating, or change `DB_NAME`.
- **Port 3000 in use**: Adjust the `PORT` value or stop the conflicting service (`lsof -i :3000`).
- **Redis connection refused**: Ensure `REDIS_URL` points to a running Redis instance when the WebSocket services are enabled.