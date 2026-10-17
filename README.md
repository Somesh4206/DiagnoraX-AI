# 🩺 DiagnoraX AI

**Your Personal AI Health Companion** — an intelligent health assistant platform built to help you understand symptoms, track wellness metrics, and make informed decisions about your health.

> ⚠️ **Medical Disclaimer** — DiagnoraX AI provides health *information*, not medical *advice*. It is not a substitute for professional diagnosis or treatment. In an emergency, contact your local emergency services immediately.

## 📌 Current Status

| Area | State |
|---|---|
| Project foundation (Next.js 16, App Router, Tailwind 4, shadcn/ui) | ✅ Complete |
| Database layer (Prisma + SQLite) | ✅ Complete |
| Core web app (dashboard, symptom checker, health profile) | 🚧 In active development |
| AI features (symptom analysis, report insights) | 📋 Planned |

This repository currently contains the **production foundation** of DiagnoraX AI. Feature modules are developed iteratively — see [`worklog.md`](./worklog.md) for the live development handover log.

## ✨ Planned Features

- **AI Symptom Checker** — describe symptoms in plain language, receive a structured informational analysis
- **Health Dashboard** — metrics, trends, and history at a glance
- **Medication Awareness** — informational reference for common interactions (never a substitute for a pharmacist or doctor)
- **Health Reports** — lab reports explained in plain language
- **Reminders & Tracking** — appointments, medication schedules, and daily habits
- **Privacy First** — your health data stays in your own database, not a third-party cloud

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 4 + shadcn/ui (New York style) |
| Database | Prisma ORM with SQLite |
| State | Zustand (client) · TanStack Query (server) |
| Auth | NextAuth.js v4 (available) |
| Runtime | Bun |
| AI | z-ai-web-dev-sdk (server-side only) |

## 🚀 Getting Started

### Prerequisites

- [Bun](https://bun.sh) v1.3 or later

### Install & Run

```bash
# 1. Install dependencies
bun install

# 2. Configure environment
cp .env.example .env

# 3. Create the database schema
bun run db:push

# 4. Start the dev server
bun run dev
```

The app runs on **http://localhost:3000**.

### Useful Scripts

| Command | Purpose |
|---|---|
| `bun run dev` | Start the dev server (port 3000) |
| `bun run lint` | Run ESLint checks |
| `bun run db:push` | Sync the Prisma schema to SQLite |
| `bun run db:generate` | Regenerate the Prisma client |

## 📁 Project Structure

```
├── prisma/          # Database schema (Prisma)
├── db/              # SQLite database files (gitignored)
├── src/
│   ├── app/         # App Router pages & API routes
│   ├── components/  # UI components (shadcn/ui + custom)
│   ├── hooks/       # Reusable React hooks
│   └── lib/         # Utilities, Prisma client
├── mini-services/   # Optional standalone services (e.g. websocket)
├── examples/        # Reference examples (websocket demo)
├── tests/           # Environment build scripts
├── Caddyfile        # Gateway configuration
└── worklog.md       # Development handover log
```

## 🗺 Roadmap

- [ ] Phase 1 — Landing experience & visual identity
- [ ] Phase 2 — Health dashboard & core metrics
- [ ] Phase 3 — AI symptom checker (API + UI)
- [ ] Phase 4 — Health profile, history & persistence
- [ ] Phase 5 — Reports, reminders & tracking
- [ ] Phase 6 — Polish, QA & full documentation

## 👤 Author

**Somesh M** — [someshm7662@gmail.com](mailto:someshm7662@gmail.com)

## 📄 License

Private project — all rights reserved.
