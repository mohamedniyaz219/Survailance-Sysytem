# Survailance System

## Overview

This repository houses the full multi-component surveillance platform. It combines the Node/Express multi-tenant backend, the React/Vite admin dashboard, the Python/Ultralytics inference engine, and two React Native apps for field personnel and citizen users.

## Component status at a glance

| Component | Purpose | What to know |
| --- | --- | --- |
| `server/` | Multi-tenant REST API, tenant onboarding, anomalies, incidents, live wall, responder tracking, AI ingestion | Requires PostgreSQL 14+ with PostGIS; migrations live in `server/migrations` and should be run before booting the API. |
| `client/` | Admin console built on React + Vite; drives dashboards, incidents, anomaly rules, map view, live wall, and AI model pages | Uses the shared `/api/v1` namespace; configure `VITE_API_BASE_URL` when not running beside the server. |
| `ai-engine-python/` | YOLO-based inference service that polls active cameras and posts detections to `/api/v1/ai/detect` | Python 3.11+; weights are committed under `weights/` and the entrypoint is `main.py`. |
| `MobilePersonnel/` | React Native app for responders; bundles incident list, notifications, profile, and settings screens | Exposes responder flows; runs in Metro and targets Android/iOS via the standard RN toolchain. |
| `MobileUser/` | React Native citizen app for submitting reports and viewing incidents | Mirrors the personnel app but scopes to citizen workflows; also uses Metro for bundling. |

## Getting started

1. Install dependencies for each component (server/client/ai-engine/mobile). The repository is intentionally split, so workstreams run side-by-side.
2. For the backend, create a PostgreSQL database, enable PostGIS, configure `server/.env`, and run `npm run db:migrate` before launching via `npm run dev-start`.
3. For the admin UI, run `npm install` inside `client/`, then `npm run dev` to start the Vite dev server; set `VITE_API_BASE_URL` if the API lives on another host.
4. Under `ai-engine-python/`, create and activate a Python virtual environment, install `-r requirements.txt`, and execute `python -u main.py` to begin polling cameras.
5. Both mobile apps live under `MobilePersonnel/` and `MobileUser/`; install their Node/npm dependencies, run `npm start` to fire up Metro, and use `npm run android` or `npm run ios` per platform.

## Folder overview

- `server/`: REST API with Sequelize models under `server/src/models/tenant` and `server/src/models/public`. See `server/routes` for bundle points.
- `client/`: Vite-powered admin dashboard with Redux slices under `client/src/redux` and feature pages under `client/src/pages/views`.
- `ai-engine-python/`: Python inference pipeline that wraps YOLO weights and pushes detections to the backend.
- `MobilePersonnel/`: Responder-facing mobile app with screen definitions in `src/screens`. Follow React Native setup instructions inside.
- `MobileUser/`: Citizen-facing mobile app with its own `src/screens` layout ready to be launched via Metro.

## Shared tooling & reminders

- Keep environment variables outside of source control; the root `.env` files are ignored for each component.
- When you change API contracts, sync the frontends (client + mobile) to avoid runtime failures.
- Mobile apps bundle native dependencies; rerun `bundle exec pod install` inside `ios/` whenever native modules change.

## API Reference

Base prefix: `/api/v1` (mounted in `server/server.js`). Brief list of available APIs and their purpose:

- **Health**: `GET /health` — server health check (root).
- **API health**: `GET /api/v1/health` — API health + version.
- **Internal Cameras**: `GET /api/v1/internal/cameras` — returns active cameras for the AI engine (used by `ai-engine-python`).

- **Auth** (`/api/v1/auth`):
	- `POST /api/v1/auth/official/login` — Official (admin/responder) login (requires `x-business-code` header / tenant context).
	- `POST /api/v1/auth/official/register-tenant` — Register a new tenant (creates business code).
	- `POST /api/v1/auth/user/login` — Citizen (public) login.
	- `POST /api/v1/auth/user/register` — Citizen registration.

- **Admin** (`/api/v1/admin`) — protected (requires admin auth + tenant context):
	- Dashboard: `GET /stats`, `GET /recent`, `GET /dashboard-overview`.
	- Live wall & streams: `GET /live-wall`, `GET /live-wall/timeline`, `GET /stream/:id`.
	- Cameras: `GET /cameras`, `POST /cameras`, `PATCH /cameras/:id`, `DELETE /cameras/:id`, `GET /cameras/:id/stream`.
	- Incidents: `GET /incidents`, `GET /incidents/:id`, `POST /incidents/:id/assign`, `PATCH /incidents/:id/verify`.
	- Map: `GET /map-overview`.
	- Zones: `GET /zones`, `GET /zones/options`, `POST /zones`, `PATCH /zones/:id`, `DELETE /zones/:id`.
	- Responders: `GET /responders`, `GET /responders/options`, `POST /responders`, `PATCH /responders/:id`, `DELETE /responders/:id`.
	- AI Models: `GET /ai-models`, `POST /ai-models/sync`, `PATCH /ai-models/:id/activate`.
	- Events: `GET /events`, `POST /events`, `PATCH /events/:id`, `DELETE /events/:id`.
	- User Reports: `GET /user-reports`, `POST /user-reports/:id/assign`.
	- Crowd analytics: `GET /crowd-metrics`.
	- Anomaly rules: `GET /anomaly-rules`, `POST /anomaly-rules`, `PATCH /anomaly-rules/:id`, `DELETE /anomaly-rules/:id`.

- **Official (Responder)** (`/api/v1/official`):
	- `GET /alerts` — list alerts for responder.
	- `PATCH /alerts/:id/status` — update alert status.
	- `GET /alerts/:id/navigation` — navigation instructions for an alert.
	- `GET /events` — list events available to responders.

- **User (Citizen)** (`/api/v1/user`) — citizen-facing APIs (protected by citizen auth):
	- `POST /upload-media` — upload media (multipart field `media`).
	- `POST /report` — submit a quick incident report.
	- `POST /reports` — create a user report (detailed).
	- `GET /events` — list public events.

- **AI ingestion** (`/api/v1/ai`):
	- `POST /ai/detect` — AI engine posts detection payloads here (requires `x-business-code` header; tenantResolver applies).

Notes:
- Many admin/official routes require tenant resolution via the `x-business-code` header and proper authentication middleware.
- The AI engine uses `GET /api/v1/internal/cameras` to fetch camera list and `POST /api/v1/ai/detect` to push detections (see `ai-engine-python/main.py`).
