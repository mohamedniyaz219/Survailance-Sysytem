# Copilot Instructions for `Survailance-Sysytem`

## 1) What this repo is
- Multi-component surveillance platform:
  - `server/`: Node.js + Express + Sequelize multi-tenant backend (PostgreSQL/PostGIS).
  - `client/`: React + Vite + Redux admin dashboard.
  - `ai-engine-python/`: Python YOLO/Ultralytics inference engine that pulls active cameras and posts AI detections to backend.
  - `MobilePersonnel/`, `MobileUser/`: React Native apps for field personnel and end users.
- Repo size/type: medium monorepo with JavaScript + Python (plus React Native clients).

## 2) Ground-truth inventory (important)
- Root folders: `.github/`, `server/`, `client/`, `ai-engine-python/`, `MobilePersonnel/`, `MobileUser/`.
- Root docs/config:
  - `README.md` exists but currently empty.
  - `docker-compose.yml` exists but currently empty.
  - `.github/prd.md` exists.
- CI/workflows:
  - No GitHub workflow files in `.github/workflows`.
- Lint/test config status:
  - `server/`: no lint/test framework configured beyond placeholder npm test script.
  - `client/`: no lint/test scripts in `package.json`.
  - `MobilePersonnel/` + `MobileUser/`: have React Native lint/test setup (`.eslintrc.js`, `jest.config.js`, npm `lint`/`test` scripts).

## 3) Runtime/tooling expectations
- Core backend/frontend work:
  - Node.js + npm required.
  - PostgreSQL + PostGIS required (migrations include `CREATE EXTENSION IF NOT EXISTS postgis`).
- AI engine:
  - Python 3 + virtualenv strongly recommended.
- Mobile apps:
  - React Native toolchain prerequisites are required (Android/iOS SDKs, CocoaPods for iOS, etc.).
  - Folder names are case-sensitive: use `MobilePersonnel` and `MobileUser` exactly.

## 4) Bootstrap / run / validate commands
Always run commands from the correct subfolder.

### Backend (`server/`)
1. Install deps:
   - `cd server && npm install`
2. Configure environment (`.env` or `.env.development`) with at least:
   - `DB_HOST`, `DB_NAME`, `DB_USER` (and matching credentials/password/port as needed).
3. Run migrations:
   - `npm run db:migrate`
4. Run dev server:
   - `npm run dev-start`
5. Notes:
   - `npm run test` intentionally fails (placeholder script).
   - No `build`/`lint` scripts are defined.

### Frontend (`client/`)
1. Install deps:
   - `cd client && npm install`
2. Run dev server:
   - `npm run dev`
3. Build production bundle:
   - `npm run build`
4. Preview production build:
   - `npm run preview`
5. Notes:
   - No `test`/`lint` scripts are defined.

### AI Engine (`ai-engine-python/`)
1. Create and activate venv:
   - `cd ai-engine-python`
   - `python3 -m venv .venv`
   - `source .venv/bin/activate`
2. Install deps:
   - `python -m pip install --upgrade pip`
   - `python -m pip install -r requirements.txt`
3. Optional syntax check:
   - `python3 -m py_compile main.py src/*.py training/*.py`
4. Run:
   - `python -u main.py`

### Mobile apps (`MobilePersonnel/`, `MobileUser/`)
1. Install deps:
   - `cd MobilePersonnel && npm install`
   - `cd MobileUser && npm install`
2. Start Metro:
   - `npm start`
3. Run app:
   - `npm run android` or `npm run ios`
4. Local quality commands:
   - `npm run lint`
   - `npm test`

## 5) Preferred bring-up order
1. Backend first: install deps, set env, migrate DB, run server.
2. Frontend second: install deps, run dev/build.
3. AI engine third: create venv, install deps, run engine.
4. Mobile apps only when task scope includes RN changes.

## 6) Architecture map for fast edits
- Backend entrypoint:
  - `server/server.js`
  - API root mounted via `server/src/routes/index.js` as `/api/v1`.
- Tenant/auth pipeline:
  - `server/src/middlewares/authMiddleware.js`
  - `server/src/middlewares/tenantResolver.js` (uses `x-business-code`).
- AI ingestion:
  - `POST /api/v1/ai/detect` in `server/src/routes/aiRoutes.js`
  - Handler: `server/src/controllers/alertSystemController.js`.
- Internal camera feed endpoint for AI engine:
  - `GET /api/v1/internal/cameras` in `server/src/routes/index.js`
  - Handler: `server/src/controllers/internalController.js`.
- Admin API router:
  - `server/src/routes/adminRoutes.js`
  - Includes dashboard, live wall, incidents, map, zones, responders, cameras, AI models, events, user reports, and anomaly rules.

### Key backend modules
- Dashboard:
  - `server/src/controllers/dashboardController.js`
  - Notable endpoint: `GET /api/v1/admin/dashboard-overview`.
- Incidents:
  - `server/src/controllers/incidentController.js`
  - Routes include list/details/assign.
- Anomaly engine:
  - `server/src/controllers/anomalyRuleController.js`
  - Routes under `/api/v1/admin/anomaly-rules` (CRUD).
  - Model: `server/src/models/tenant/AnomalyRule.js` (association alias for zone relation is `zoneRef`).
- Sequelize setup:
  - Runtime DB init: `server/config/database.js`
  - CLI config: `server/.sequelizerc` + `server/config/config.cjs`
  - Model loader: `server/src/models/index.js`.

### Key frontend modules
- App shell + routes:
  - `client/src/main.jsx`, `client/src/App.jsx`
- Sidebar nav:
  - `client/src/components/Sidebar.jsx`
- API client/interceptors:
  - `client/src/services/api.js`
- Feature pages:
  - Dashboard: `client/src/pages/views/DashboardHome.jsx`
  - Incidents: `client/src/pages/views/IncidentsPage.jsx`
  - Anomaly Rules: `client/src/pages/views/AnomalyRulesPage.jsx`
- Redux store wiring:
  - `client/src/redux/store.js`
  - Includes slices: `dashboard`, `incidents`, `anomalyRules`, `responders`, `mapView`, `zones`, `cameras`, `liveWall`, `aiModels`, `events`, `userReports`, `auth`.

## 7) Known caveats
- Root `README.md` and `docker-compose.yml` are placeholders (empty).
- No monorepo-level CI automation; rely on local command validation.
- Backend still contains some controller areas with partial/placeholder behavior outside recently completed modules.
- Multi-tenant schema drift can exist across older tenant DBs; write queries defensively where needed.
- Long-running commands (`npm run dev-start`, `npm run dev`, `python -u main.py`, RN Metro) can obscure terminal context—check `pwd` before follow-up commands.

## 8) Validation checklist before PR
- Backend starts cleanly:
  - `cd server && npm run dev-start`
- Frontend production build succeeds:
  - `cd client && npm run build`
- AI changes only: engine boots with venv active:
  - `cd ai-engine-python && source .venv/bin/activate && python -u main.py`
- DB changes only: migrations apply successfully:
  - `cd server && npm run db:migrate`
- Mobile changes only: app-specific checks:
  - `cd MobilePersonnel && npm run lint && npm test`
  - `cd MobileUser && npm run lint && npm test`

## 9) Agent behavior rule
Trust this file first. Perform additional repo-wide search only when:
- the requested task touches areas not mapped above, or
- paths/commands here are missing or no longer accurate.
