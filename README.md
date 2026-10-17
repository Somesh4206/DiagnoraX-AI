# 🩺 DiagnoraX AI

**Your Personal AI Health Companion** — an intelligent health assistant platform built to help you understand symptoms, track wellness metrics, and make informed decisions about your health.

> ⚠️ **Medical Disclaimer** — DiagnoraX AI provides health *information*, not medical *advice*. It is not a substitute for professional diagnosis or treatment. In an emergency, contact your local emergency services immediately.

## 📌 Current Status

| Area | State |
|---|---|
| Project foundation (Next.js 16, App Router, Tailwind 4, shadcn/ui) | ✅ Complete |
| Database layer (Prisma + SQLite, `HealthRecord` model) | ✅ Complete |
| Dark Neon Medical design system + app shell (nav, footer, mobile) | ✅ Complete |
| AI Symptom Checker (LLM + deterministic emergency triage) | ✅ Live |
| Body Analysis (deterministic BMI, healthy ranges) | ✅ Live |
| Health History (search, filters, delete, raw JSON transparency) | ✅ Live |
| Dashboard (stats, BMI trend chart, recent activity) | ✅ Live |
| Medication interactions, reminders, report explainer | 📋 Planned — see roadmap |

This repository ships a working app: three interconnected modules backed by real API routes (`/api/v1/…`) with validation, loading/error states, and an AI path that runs server-side only. See [`worklog.md`](./worklog.md) for the live development log.

## ✨ Features

- **AI Symptom Checker** — describe symptoms in plain language; get an honest urgency level (emergency / urgent / routine / low), commonly reported possibilities (hedged, never a diagnosis), self-care, red flags
- **Emergency triage** — descriptions with emergency signs bypass the LLM entirely and return deterministic immediate-care guidance
- **Body Analysis** — BMI with healthy weight ranges, gauge, and full formula transparency (deterministic arithmetic, no AI involved)
- **Health Dashboard** — stat cards, BMI trend chart, recent activity, quick actions
- **Health History** — every analysis saved locally; searchable, expandable (including the raw JSON record), deletable
- **Privacy first** — your data stays in your own SQLite database, not a third-party cloud

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 4 + shadcn/ui (New York style) |
| Database | Prisma ORM with SQLite |
| State | Zustand (client) · TanStack Query (server) |
| Auth | NextAuth.js v4 (available) |
| Charts | Recharts |
| Animations | Framer Motion (reduced-motion aware) |
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

## 🔌 API Endpoints

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/v1/symptoms/analyze` | AI symptom analysis (emergency triage runs first, deterministic) |
| POST | `/api/v1/body/analysis` | Deterministic BMI + healthy weight range (no AI) |
| GET | `/api/v1/records` | List records (`type`, `q`, `limit` filters) |
| DELETE | `/api/v1/records?id=` | Delete a record |

All endpoints validate input (zod) and return `{ error }` with proper status codes (400/404/502/504).

## 🗺 Roadmap

- [x] Phase 1 — Landing experience, design system, ECG visualization, app shell
- [x] Phase 2 — Health dashboard, stats, BMI trend chart
- [x] Phase 3 — AI symptom checker (emergency triage + LLM)
- [x] Phase 4 — Body analysis + health history (search, delete, raw JSON)
- [ ] Phase 5 — Medication interaction awareness
- [ ] Phase 6 — Smart reminders + browser notifications
- [ ] Phase 7 — Report explainer (lab values, plain language)
- [ ] Phase 8 — History export (JSON/CSV), weekly charts
- [ ] Phase 9 — Auth (NextAuth) if multi-user is ever needed

## 👤 Author

**Somesh M** — [someshm7662@gmail.com](mailto:someshm7662@gmail.com)

## 📄 License

Private project — all rights reserved.
