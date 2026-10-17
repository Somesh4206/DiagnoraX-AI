# DiagnoraX AI — Development Worklog

> Live handover document. Read this **first** at the start of any session, then continue where the last phase left off.
> Never store secrets (tokens, keys) in this file.

---

## 1. Current Project Status (Assessment)

- **Repository**: https://github.com/Somesh4206/DiagnoraX-AI — `main` @ `409e46b`, git identity `Somesh M <someshm7662@gmail.com>` (token in `.git/config` remote URL; rotate when the project wraps up).
- **The app is the EXACT DARK NEON MOBILE APPLICATION from the first chat, restored.** The user rejected the light-emerald mobile app (commits `540e4bf`+`cbb4d8a`) as "not the same as previous" and asked to revert to the original assignment: **dark neon theme + mobile application**. This round restored the exact Dark Neon Medical design system and all first-release views from git history (commit `7cf813b`), presented as a mobile app.
- **Theme (exact, dark-fixed)**: bg `#050807` · card `#0D1712` · elevated `#122019` · border `#1C3529` · neon `#00FFA3` · cyan `#40D9FF` · warn `#FFBF47` · danger `#FF4D6D`. Utilities: `neon-card`, `neon-card-hover`, `grid-bg`, `hero-fade`, `text-glow`, `gradient-neon-text`, `glow-primary`, `chip-neon`, `dot-pulse`, `scrollbar-neon`. **Do not re-theme.** The user has now twice reverted theme changes — any restyle must keep these exact tokens.
- **Form factor**: single-route mobile app at `/`. On phones (<1024px) the app fills the viewport edge-to-edge with its bottom tab bar. On desktop it runs inside a phone mockup (`device-frame.tsx`: dark bezel, dynamic island, status bar, ambient neon glow) via a **same-origin iframe at phone width**, so the app's own mobile layout is always what renders — it can never degrade into a "website" look. Neon boot splash while the presentation mode resolves. PWA manifest re-themed to `#050807`.
- Stack: Next.js 16 App Router, TypeScript, Tailwind 4, shadcn/ui, Prisma + SQLite (`HealthRecord`), Recharts (BMI trend), framer-motion, z-ai-web-dev-sdk (LLM, server-side only), Bun.

## 2. Current Goals / Completed Changes / Verification

**This round — "Restore exact dark-neon mobile app" (user request: "revert changes upto last 4 chats… exact theme and layout which was assigned in the first chat"):**

- `git checkout 7cf813b -- src/app/globals.css src/components/diagnorax/{api,app,body,dashboard,ecg,history,landing,symptoms,ui-bits}.tsx` — byte-exact restore of the first-release theme + views. Deleted the light-app files (`screens/*`, `tab-bar.tsx`, `phone-frame.tsx`).
- New `src/components/diagnorax/device-frame.tsx` (dark-neon phone mockup + showcase panel) and new `src/app/page.tsx` presentation router: `useSyncExternalStore` resolves mode → `embedded` (inside the frame's iframe → raw app), `desktop` (≥1024px → DeviceFrame + iframe), `mobile` (raw app full-screen), `boot` (server snapshot → neon splash). Hydration-safe, no lint errors.
- `layout.tsx`: first-release base (dark-fixed, Toaster) + kept PWA manifest, `/icon-1024.png` icons, apple-web-app, viewport (themeColor `#050807`). `manifest.webmanifest` background/theme colors → `#050807`.
- Backend untouched (identical to first release; records route still supports the optional `?all=true` clear-all). README rewritten to describe the dark neon mobile app.
- **Dev-server note**: after `git checkout` of `globals.css`, Turbopak served a stale light CSS chunk — fixed by killing dev, `rm -rf .next`, restart. If theme ever looks light after a git restore, restart dev with a clean `.next`.

**Verification (agent-browser E2E at both viewports + VLM design review):**

- `bun run lint` clean. Dev 200. No console/page errors; dev.log clean.
- Desktop 1440×900: dark neon page, phone mockup (dynamic island, status bar), app inside iframe renders landing (VLM: "high-fidelity, professional… no visual problems"). Showcase panel with feature list + Add-to-Home-Screen hint.
- Mobile 375×812: raw app full-screen, dark bg `rgb(5,8,7)`, 5-tab bottom nav (VLM: "looks like a native mobile app… no glitches").
- Golden paths: Symptom Checker — filled description + age 28 → "Analyze with AI" → LLM returned "Routine — non-urgent care" with summary, conditions (migraine/cluster/sinus/eye strain), self-care, red flags, saved to history. Body Analysis — 175cm/70kg → BMI 22.9 Normal, healthy 56.7–76.3 kg. Dashboard — stats (4 checks, 22.9 BMI, 4 records), BMI trend chart, recent activity. History — tabs + records with timestamps.

## 3. Unresolved Issues / Risks & Next-Phase Priorities

**Known limitations / risks:**

- LLM occasionally flaky (502 seen in an earlier round) — UI surfaces a retry state; acceptable.
- Emergency keyword triage is English-only; LLM path still instructed to return `emergency`.
- Single-user, no auth — by design for now (local personal app).
- The `severity` column stores urgency level or BMI category (union) — tone-mapping handles both; a future schema could split them.
- Desktop presentation relies on the iframe trick — if a future change adds URL params/routing, verify the iframe still resolves `embedded` (it uses `window.self !== window.top`, so URLs stay clean).

**Next-phase priorities (recommended order) — all must preserve the exact dark-neon theme:**

1. **Report Explainer module** — paste lab values, deterministic out-of-range flagging + LLM plain-language summary (new view + `POST /api/v1/reports/explain`; add tab or Home card)
2. **Medication & interaction awareness** — `POST /api/v1/medications/interactions` with "never the sole authority" framing + curated static list
3. **Smart reminders** — `Reminder` model + CRUD + Home widget + browser notifications
4. Home polish: weekly urgency-mix chart, streaks, pull-to-refresh feel
5. i18n (Hindi/Marathi) emergency keywords; 108/112 surfaced in UI
6. Rotate/revoke the GitHub token when the project is considered finished
