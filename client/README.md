# Client – React + Vite Admin Dashboard

## Overview

This directory powers the admin console that interacts with `/api/v1`. It is built with React, Vite, and Redux slices for dashboards, incidents, anomalies, live wall, map view, cameras, and responder management.

## Status

- Feature pages for dashboards, incidents, events, anomaly rules, map view, user reports, and AI models already exist under `src/pages/views`.
- Uses a central `client/src/services/api.js` HTTP client; update `VITE_API_BASE_URL` when the API host differs from the default development proxy.

## Prerequisites

- Node.js 20+ and npm.
- The backend (`server/`) should be running or reachable via `VITE_API_BASE_URL`.

## Setup

1. Install dependencies:
   ```bash
   cd client
   npm install
   ```
2. Create an `.env` file when overriding the API base URL:
   ```env
   VITE_API_BASE_URL=http://localhost:3000/api/v1
   ```

## Common commands

- `npm run dev`: Launches Vite dev server with hot reload on port 5173.
- `npm run build`: Produces a production-ready bundle (`dist/`).
- `npm run preview`: Serves the production bundle for a quick smoke test.

## Notes

- If the server runs behind HTTPS or a different port, update `VITE_API_BASE_URL` accordingly and restart Vite.
- The `/src/redux` directory holds slices for dashboard, incidents, anomaly rules, live wall, responders, zones, cameras, and user reports. Resetting the store usually only requires refreshing the page.