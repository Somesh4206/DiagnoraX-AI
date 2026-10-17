# 📱 DiagnoraX AI

**Your Personal AI Health Companion** — a dark-neon mobile health app that helps you understand symptoms, track body metrics, and keep a private history of your checks — all in your pocket.

> ⚠️ **Medical Disclaimer** — DiagnoraX AI provides health *information*, not medical *advice*. It is not a substitute for professional diagnosis or treatment. In an emergency, contact your local emergency services immediately.

## 📌 Current Status

| Area | State |
|---|---|
| Mobile app shell (phone mockup on desktop, bottom tab bar, boot splash) | ✅ Complete |
| Database layer (Prisma + SQLite) | ✅ Complete |
| AI Symptom Checker (LLM + deterministic emergency triage) | ✅ Live |
| Body Analysis — BMI with healthy weight range (deterministic) | ✅ Live |
| Dashboard — stats, BMI trend chart, recent activity | ✅ Live |
| History — tabs, search, expandable details, delete | ✅ Live |
| Report explainer · Medication awareness · Reminders | 📋 Planned |

The app is a **single-route mobile experience**: on a phone it fills the screen edge-to-edge and can be installed to the home screen (PWA manifest included); on desktop it renders inside a phone mockup so it always previews as the mobile app it is.

## 🎨 Design — Dark Neon Medical

Fixed dark theme, exactly as originally assigned:

- Background `#050807` · cards `#0D1712` · elevated `#122019` · borders `#1C3529`
- Neon green `#00FFA3` (primary) · cyan `#40D9FF` · warn `#FFBF47` · danger `#FF4D6D`
- Neon glow accents, animated ECG hero, grid backdrop, dot-pulse AI thinking states

## ✨ Features

- **AI Symptom Checker** — describe symptoms in plain words; get an urgency level, commonly-reported conditions, self-care steps, and red flags. Emergency keywords (chest pain, stroke signs…) trigger a **deterministic triage before any AI call**
- **Body Analysis** — BMI with healthy weight range, formula transparency, honest caveats. Deterministic arithmetic, never an LLM guess
- **Dashboard** — greeting, stat cards, BMI trend chart (Recharts) with healthy band, recent activity, quick actions
- **Private History** — every check is saved locally; filter by type, search, expand details, delete
- **Animated ECG hero** — canvas-rendered cardiac monitor demo (clearly labeled, not a real reading)

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 4 + shadcn/ui (New York style) |
| Database | Prisma ORM with SQLite |
| Charts | Recharts |
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
│   ├── app/         # App Router page & API routes (/api/v1/...)
│   ├── components/  # shadcn/ui + diagnorax/ app components
│   ├── hooks/       # Reusable React hooks
│   └── lib/         # Utilities, Prisma client
├── mini-services/   # Optional standalone services (e.g. websocket)
├── examples/        # Reference examples (websocket demo)
├── tests/           # Environment build scripts
├── Caddyfile        # Gateway configuration
└── worklog.md       # Development handover log
```

## 🗺 Roadmap

- [x] Phase 1 — Dark neon design system & app shell
- [x] Phase 2 — Landing with animated ECG hero
- [x] Phase 3 — AI symptom checker (API + UI + emergency triage)
- [x] Phase 4 — Body analysis, dashboard & history persistence
- [x] Phase 5 — Mobile-app presentation (phone mockup, PWA install)
- [ ] Phase 6 — Report explainer, medication awareness, reminders

## 👤 Author

**Somesh M** — [someshm7662@gmail.com](mailto:someshm7662@gmail.com)

## 📄 License

Private project — all rights reserved.
