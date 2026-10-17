# 📱 DiagnoraX AI

**Your Personal AI Health Companion** — a mobile-first health app that helps you understand symptoms, track body metrics, and keep a private history of your checks — all in your pocket.

> ⚠️ **Medical Disclaimer** — DiagnoraX AI provides health *information*, not medical *advice*. It is not a substitute for professional diagnosis or treatment. In an emergency, contact your local emergency services immediately.

## 📌 Current Status

| Area | State |
|---|---|
| Mobile app shell (phone frame, bottom tabs, native feel) | ✅ Complete |
| Database layer (Prisma + SQLite) | ✅ Complete |
| AI Symptom Checker (LLM + deterministic emergency triage) | ✅ Live |
| Body Lab — BMI with healthy weight range (deterministic) | ✅ Live |
| History — search, filters, expandable details, delete | ✅ Live |
| Profile — dark mode, emergency numbers, export / clear data | ✅ Live |
| Medication awareness · Report explainer · Reminders | 📋 Planned |

The app is a **single-route mobile experience**: on a phone it fills the screen and can be installed to the home screen (PWA manifest included); on desktop it renders inside a phone mockup so it always previews as the mobile app it is.

## ✨ Features

- **AI Symptom Checker** — describe symptoms in plain words; get an urgency level, commonly-reported conditions, self-care steps, and red flags. Emergency keywords (chest pain, stroke signs…) trigger a **deterministic triage before any AI call**
- **Health Snapshot** — wellness ring + quick stats on the Home screen
- **Body Lab** — BMI with live sliders, category scale, healthy weight range, honest caveats
- **Private History** — every check is saved on-device; search, filter, expand, delete, export as JSON, or wipe everything
- **Emergency numbers** — one-tap 108 (ambulance) / 112 (India) from Home and Profile
- **Light & dark themes** — light-first medical design, dark mode toggle in Profile

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

- [x] Phase 1 — Mobile app shell & visual identity
- [x] Phase 2 — Home dashboard (wellness ring, quick actions, recent activity)
- [x] Phase 3 — AI symptom checker (API + UI + emergency triage)
- [x] Phase 4 — Body Lab, history & persistence
- [x] Phase 5 — Profile: themes, emergency numbers, data export & wipe
- [ ] Phase 6 — Medication awareness, report explainer, reminders

## 👤 Author

**Somesh M** — [someshm7662@gmail.com](mailto:someshm7662@gmail.com)

## 📄 License

Private project — all rights reserved.
