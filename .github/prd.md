# Product Requirements Document (PRD)
**Project Name:** Proactive Survailance System 
**Version:** 1.0  
**Status:** In Development  
**Type:** Proactive AI Surveillance & Emergency Response System

---

## 1. Executive Summary
**Sentinel AI** is a next-generation surveillance platform designed to shift security operations from **Reactive** (reviewing footage after a crime) to **Proactive** (detecting threats before they escalate).

It utilizes advanced Computer Vision (YOLOv26) to analyze CCTV feeds in real-time for specific threats (Weapons, Fire, Fights, Crowds). It orchestrates a multi-tenant response system connecting **Command Centers**, **Field Responders**, and **Citizens** instantly.

---

## 2. Problem Statement
*   **Current State:** CCTV cameras are passive recorders. Security teams cannot monitor hundreds of screens simultaneously. Crimes are often noticed only after they happen.
*   **The Solution:** An AI engine that watches every camera 24/7, detects anomalies, and automatically dispatches the nearest responder via a mobile app.

---

## 3. User Personas

| Persona | Role | Key Responsibilities |
| :--- | :--- | :--- |
| **Command Admin** | Tenant Admin | Monitors the Web Dashboard (Live Wall, Map), manages cameras, assigns responders to incidents. |
| **Field Responder** | Official | Receives P0 alerts on mobile, navigates to scenes, updates incident status. |
| **Global Citizen** | Public User | Reports incidents manually (crowdsourcing), receives safety alerts for their city. |
| **System Owner** | Super Admin | Manages the SaaS infrastructure, onboards new Tenants (Police Depts, Security Firms). |

---

## 4. Functional Requirements

### 4.1. AI Surveillance Engine (The "Brain")
The system must process RTSP video streams and detect the following classes with >50% confidence:

*   **Critical (P0 - Immediate Alert):**
    1.  `Weapon` (Guns, Knives)
    2.  `Fire`
    3.  `Fight` (Violence/Assault)
    4.  `Panic` (People running chaotically)
    5.  `Suspicious Package` (Unattended objects)
*   **Warning (P1 - Monitor):**
    6.  `Crowd` (High density)
    7.  `Running-Behavior`
    8.  `Unusual Hand Gesture` (Distress signals)
*   **Contextual (Log Only):**
    9.  `Person`, `Walking`, `Standing`, `Sitting`, `Jumping`.

**Requirements:**
*   Must run **Headless** (No GUI) on the server.
*   Must handle **Multiple RTSP Streams** via threading.
*   Must implement **Frame Skipping** (e.g., process 5 FPS) to optimize GPU usage.
*   Must prevent alert spamming via **Cooldown Logic** (e.g., 1 alert per 10s per camera).

### 4.2. Multi-Tenant Backend (The "Core")
*   **Architecture:** Schema-per-Tenant (Data Isolation).
*   **Public Schema:** Manages Tenants, Global Users (Citizens), and Cross-Jurisdiction Access.
*   **Tenant Schemas:** Each organization (e.g., `chennai_police`, `mumbai_metro`) has its own isolated tables for Incidents, Personnel, and Cameras.
*   **Authentication:**
    *   **Officials:** Login via Business Code + Email.
    *   **Citizens:** Login via Phone Number (Global).

### 4.3. Command Center (Web Dashboard)
*   **Live Video Wall:** Display active camera feeds.
*   **Interactive Map:** Show Cameras, Active Incidents, and Live Responder Locations (Real-time GPS).
*   **Incident Management:** Kanban-style board to view, assign, and resolve alerts.
*   **Analytics:** Charts showing threat trends (Heatmaps, Peak hours).
*   **User Reports:** Shows the incident reported by user.
*   **AI Models:** Enable the admin to choose between available models.
*   **Management:** Allow admin to crud responders, cameras, etc,..

### 4.4. Mobile Applications
*   **Official App (Responder):**
    *   Push Notifications for Critical Alerts.
    *   Live Navigation to Incident GPS.
    *   Status Updates (Enroute, On-Scene, Resolved).
    *   Background Location Sharing (for Dispatcher tracking).
*   **Public App (Citizen):**
    *   "Report Incident" button (Photo/Video + GPS).
    *   SOS Button.

---

## 5. System Architecture

### 5.1. Tech Stack
| Component | Technology |
| :--- | :--- |
| **AI Engine** | Python 3.10+, YOLOv26 (Ultralytics), OpenCV, Flask |
| **Backend API** | Node.js (v20), Express.js |
| **Database** | PostgreSQL 16 + **PostGIS** (Location) + **pgvector** (Face ID) |
| **Real-time** | Socket.io (Websockets) |
| **Frontend** | React + Vite + Tailwind CSS + Redux Toolkit |
| **Mobile** | React Native (Expo/CLI) |
| **Infrastructure** | Docker, Nginx (Reverse Proxy) |

### 5.2. Data Flow
1.  **Input:** CCTV (RTSP) -> **Python AI Service**.
2.  **Processing:** AI Detects "Weapon" -> Sends JSON to **Node.js Backend**.
3.  **Storage:** Node.js saves incident to **PostgreSQL** (Tenant Schema).
4.  **Alerting:** Node.js emits **Socket.io** event -> **Web Dashboard** & **Mobile App**.
5.  **Response:** Admin clicks "Assign" -> Responder gets Push Notification -> Responder resolves incident.

---

## 6. Database Schema Overview

### Public Schema (Global)
*   `tenants` (ID, Business Code, Schema Name)
*   `global_users` (Citizens)
*   `tenant_access` (Cross-jurisdiction permissions)
*   `responder_tracking` (Live GPS data)

### Tenant Schema (Replicated per Client)
*   `personnel` (Admins, Responders)
*   `cameras` (RTSP URLs, Locations)
*   `incidents` (Alerts, Type, Status, Evidence URL)
*   `anomaly_rules` (Configuration for AI thresholds)
*   `incident_history` (Audit logs)

---

## 7. Non-Functional Requirements
1.  **Latency:** Time from "Weapon Drawn" to "Dashboard Alert" must be **< 2 seconds**.
2.  **Scalability:** The system must support adding new tenants dynamically without restarting the server.
3.  **Reliability:** If the AI Service crashes, the Web Dashboard and Manual Reporting must still function.
4.  **Security:**
    *   All API routes protected by JWT.
    *   Internal AI routes protected by API Keys.
    *   Passwords hashed via Bcrypt.

---

## 8. Success Metrics (KPIs)
*   **Detection Accuracy:** >85% mAP (Mean Average Precision) on validation set.
*   **Response Time:** Reduction in time-to-dispatch compared to manual reporting.
*   **System Uptime:** 99.9% availability for the Backend API.

---

## 9. Roadmap
*   **Phase 1 (MVP):** Single Tenant, Weapon/Fire Detection, Web Dashboard, Real-time Alerts.
*   **Phase 2:** Mobile Apps (Responder/Citizen), GPS Tracking, Multi-Tenancy.
*   **Phase 3:** Advanced AI (Face Recognition, Crowd Analytics), Cross-Jurisdiction Logic.