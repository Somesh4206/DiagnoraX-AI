# DiagnoraX AI — Development Worklog

> Live handover document. Read this **first** at the start of any session, then continue where the last phase left off.
> Never store secrets (tokens, keys) in this file.

---

## 1. Current Project Status (Assessment)

- **Repository**: https://github.com/Somesh4206/DiagnoraX-AI — `main`, git identity `Somesh M <someshm7662@gmail.com>` (token in `.git/config` remote URL; rotate when the project wraps up).
- **First feature release is LIVE (this round)**: DiagnoraX AI is now a functional web app with 3 working modules and a full backend, verified end-to-end in a real browser.
- Stack in use: Next.js 16 App Router, TypeScript, Tailwind 4, shadcn/ui, Prisma + SQLite (`HealthRecord` model), z-ai-web-dev-sdk (LLM, server-side only), Recharts, Framer Motion.
- Design system: **Dark Neon Medical** (dark-fixed): bg `#050807`, card `#0D1712`, elevated `#122019`, border `#1C3529`, neon `#00FFA3`, cyan `#40D9FF`, warn `#FFBF47`, danger `#FF4D6D`. Tokens live in `src/app/globals.css` (`:root`/`.dark` identical → app is dark by design; a light theme is NOT implemented).
- App is a **single-route SPA** at `/` (platform rule): client-side view switching between `home | dashboard | symptoms | body | history`, desktop nav + mobile bottom nav, sticky footer (flex `min-h-screen` + `mt-auto`), mobile `pb-24` clearance for the fixed bottom nav.

## 2. Current Goals / Completed Changes / Verification

**This round — "First feature release" (frontend → backend → QA → ship):**

- Design system rewrite of `globals.css` (neon tokens + utilities: `neon-card`, `glow-primary`, `grid-bg`, `scrollbar-neon`, reduced-motion support)
- Frontend (`src/components/diagnorax/`): `app.tsx` (shell: header/desktop nav/mobile bottom nav/footer), `landing.tsx` (hero + animated ECG canvas card + stats + 6 feature cards with honest Live/Planned states + how-it-works + CTA), `symptoms.tsx` (form + validation + example prefill chips + AI result rendering with urgency banners), `body.tsx` (BMI form + gauge + healthy range + formula transparency card), `dashboard.tsx` (4 stat cards + Recharts BMI trend + recent activity + quick actions), `history.tsx` (tabs + debounced search + expandable details incl. raw JSON + AlertDialog delete), shared `ui-bits.tsx` / `ecg.tsx` / `api.ts` (typed client)
- Backend: Prisma `HealthRecord` model (type/title/summary/severity/JSON data) + `db:push`; 3 API routes under `/api/v1/`:
  - `POST /symptoms/analyze` — zod validation → **deterministic emergency triage first** (EMERGENCY_RE, no LLM call) → LLM path via z-ai-web-dev-sdk with strict JSON schema prompt, 45s timeout, shape validation; every analysis persisted
  - `POST /body/analysis` — deterministic BMI (never LLM): categories incl. obesity classes I–III, healthy weight range, static recommendations/caveats per category, formula echoed back
  - `GET/DELETE /records` — list with type/search/limit filters; delete with P2025→404

**Verification (agent-browser E2E + curl):**

- `bun run lint` clean; dev server 200; no console/page errors
- curl: BMI 22.5 ✓, invalid input 400 ✓, emergency triage (no LLM) ✓, LLM path 3.5s with hedged conditions ✓, delete + 404-on-repeat ✓
- Browser: landing + animated ECG canvas render; golden path UI→LLM round-trip (urgent banner, conditions, self-care); BMI via UI (26.8 → Overweight, healthy 58.6–78.9 kg); dashboard stats + trend chart; history search/debounce/details/delete-with-confirm (list 5 = DB 5); mobile 375×812 bottom nav + footer pushed naturally on long pages (footerBottom = docH)
- One QA rabbit hole worth remembering: agent-browser's `fill` with an **empty string** doesn't fire React's onChange — it looked like the search-clear was broken. Fresh reload proved the app correct. Not an app bug.

## 3. Unresolved Issues / Risks & Next-Phase Priorities

**Known limitations / risks:**

- No authentication yet — anyone with the URL can use the app (single-user local assumption; NextAuth.js v4 is available when needed)
- LLM prompt outputs are validated by zod but not perfect — occasional 502 "unreadable response" is surfaced cleanly to the UI with retry
- Emergency keyword list is English-only; non-English symptom descriptions won't trigger the deterministic triage (the LLM is still instructed to return `emergency`)
- Search is SQLite `contains` (ASCII case-insensitive); no fuzzy matching
- Light theme not implemented (dark-fixed by design); reduced-motion honored in CSS + canvas + BPM jitter

**Next-phase priorities (recommended order):**

1. **Medication & interaction awareness module** (high user value): `POST /api/v1/medications/interactions` — LLM with strict "never the sole authority, never 'guaranteed safe'" framing + a curated static top-interactions list that overrides/complements the LLM
2. **Smart reminders** — `Reminder` Prisma model + CRUD `/api/v1/reminders` + dashboard widget + browser notifications
3. **Report explainer** — structured text input (paste lab values), deterministic flagging of out-of-range values + LLM plain-language summary; clearly label examples
4. Dashboard polish: weekly chart of symptom-check urgency mix; export history (JSON/CSV download)
5. i18n / emergency keywords for Hindi + Marathi (user timezone Asia/Calcutta suggests an Indian audience; also add 108 as a recognized emergency number in guidance copy)
6. Auth (NextAuth) + per-user records if multi-user is ever needed
7. Rotate/revoke the GitHub token when the project is considered finished
