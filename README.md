# NOVA — Next-Generation Real-Time Social Platform

NOVA is a modern, privacy-focused, real-time social communication platform built with a high-performance Node.js/Express, MongoDB, Socket.IO, WebRTC, and React/Tailwind architecture.

---

## 🌟 Key Features

* **Real-Time Communication**:
  * Instant 1-to-1 messaging with live typing indicators, delivery receipts, and read checkmarks.
  * Direct 1-to-1 WebRTC voice and video calling with peer-to-peer encrypted media transport (DTLS-SRTP).
  * Live online presence detection across all connected peers.
* **Content Stream & Social Graph**:
  * Multi-media posts supporting images, videos, captions, and automated hashtag extraction.
  * Deterministic chronological engagement feed with safe sensitive-field projections.
  * Threaded comments, dynamic reactions (`LIKE`, `LOVE`, `FIRE`, `INSIGHT`, `CLAP`), and bookmarking.
  * Atomic follow/unfollow, private profile access controls, and user blocking/reporting.
* **Security & Reliability**:
  * Hardened authentication: bcrypt password hashing with verified `await` execution, request-scoped JWT middleware, and session tracking.
  * Zero sensitive data leakage (`-password -otp`) in public feeds, profiles, and search queries.
  * Helmet security headers, CORS origin verification, Express rate limiters, and recursive NoSQL injection sanitizers.
  * Non-destructive, idempotent database migration preserving existing data.
* **Original UI/UX System**:
  * Distinct 3-pane desktop layout (NavRail + Primary Content Stream + Context Intel Panel) and mobile-first bottom navigation.
  * Dark Slate / Electric Indigo palette with full light mode support.

---

## 🏗️ Architecture Overview

```
Frontend (React 19 + Tailwind + Vite)
    ├── REST API Client (Axios with JWT interceptors)
    ├── Real-Time Socket Client (Socket.IO)
    └── Peer Media Stream Transport (WebRTC RTCPeerConnection)
              │                     │                  │
              ▼                     ▼                  ▼
Backend (Node.js + Express 5)
    ├── Security & Auth Middleware (Helmet, CORS, RateLimiter, JWT)
    ├── Controller & Service Layer (Clean Separation of Concerns)
    ├── Socket Handlers (Presence, Chat, WebRTC Signaling)
    └── Mongoose 9 ODM (Indexes, Aliases, Atomic Operators)
              │
              ▼
MongoDB Database (Atlas / Self-Hosted)
```

---

## 🚀 Quickstart Guide

### 1. Install Dependencies
```bash
# Install root backend dependencies
npm install

# Install client dependencies
cd client
npm install
cd ..
```

### 2. Configure Environment
Copy `.env.example` to `.env` and fill in your credentials:
```bash
cp .env.example .env
```

### 3. Database Migration & Optional Demo Seeding
```bash
# Backup existing database snapshot
npm run backup

# Apply non-destructive schema indexes and defaults
npm run migrate

# (Optional) Seed demo accounts (Alice, Bob, Clara)
npm run seed
```

### 4. Run Automated Security Test Suite
```bash
npm test
```

### 5. Launch the Platform
```bash
# Start backend server (Serves both API and production client build on port 5000)
npm start

# For frontend development with Hot Module Replacement (HMR):
cd client
npm run dev
```

* Backend API & Production App: `http://localhost:5000`
* Frontend Dev Server (Vite): `http://localhost:5173`

---

## 👥 Demo Test Accounts

If you run `npm run seed`, you can instantly log in using:

| Username | Password | Role / Persona |
| :--- | :--- | :--- |
| `alice_chen` | `NovaPass123!` | Photographer & Creator |
| `bob_vance` | `NovaPass123!` | Full-stack Engineer |
| `clara_o` | `NovaPass123!` | Explorer & Member |

---

## 📚 Technical Documentation Suite

* [ARCHITECTURE.md](file:///c:/Users/a3301/Desktop/sem%203/miniproject/ARCHITECTURE.md) — Detailed layered architecture and data flow diagrams.
* [API.md](file:///c:/Users/a3301/Desktop/sem%203/miniproject/API.md) — Complete REST API reference (v1 and legacy endpoints).
* [SOCKET_EVENTS.md](file:///c:/Users/a3301/Desktop/sem%203/miniproject/SOCKET_EVENTS.md) — Socket.IO real-time event protocols and authorization guards.
* [WEBRTC.md](file:///c:/Users/a3301/Desktop/sem%203/miniproject/WEBRTC.md) — WebRTC signaling sequence, STUN/TURN configuration, and media security.
* [SECURITY.md](file:///c:/Users/a3301/Desktop/sem%203/miniproject/SECURITY.md) — Threat model, security checklist, and rate-limiting specifications.
* [DATABASE.md](file:///c:/Users/a3301/Desktop/sem%203/miniproject/DATABASE.md) — Mongoose schemas, compound indexes, and relationship models.
* [MIGRATION.md](file:///c:/Users/a3301/Desktop/sem%203/miniproject/MIGRATION.md) — Backup, migration, and rollback procedures.
* [DEPLOYMENT.md](file:///c:/Users/a3301/Desktop/sem%203/miniproject/DEPLOYMENT.md) — Production deployment guidelines for Docker, Render, and Vercel.
* [ENVIRONMENT.md](file:///c:/Users/a3301/Desktop/sem%203/miniproject/ENVIRONMENT.md) — Environment variable dictionary.