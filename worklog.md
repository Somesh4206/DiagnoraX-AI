# DiagnoraX AI — Development Worklog

> Live handover document. Read this **first** at the start of any session, then continue where the last phase left off.
> Never store secrets (tokens, keys) in this file.

---

## 1. Current Project Status (Assessment)

- **Repository**: https://github.com/Somesh4206/DiagnoraX-AI — `main`, git identity `Somesh M <someshm7662@gmail.com>` (token in `.git/config` remote URL; rotate when the project wraps up).
- **The app is now a MOBILE APPLICATION (user's explicit direction)**: the previous "Dark Neon Medical website" release (commit `7cf813b`) was **reverted** (commit `dc51070`) because the user said it looked like a website with a changed theme and asked for the mobile app instead. The proven backend was restored from git history, and the frontend was rebuilt as a native-style mobile app.
- **Form factor**: single-route mobile app at `/`. On phones (<lg) it fills the viewport edge-to-edge; on desktop it renders inside a **phone mockup frame** (dynamic island, status bar, bezel) beside a small showcase panel — it must always read as "mobile app", never as a website. PWA manifest (`public/manifest.webmanifest`) + AI-generated app icon (`public/icon-1024.png`) allow Add-to-Home-Screen installs.
- **Theme**: light-first "mobile health" design — emerald primary `oklch(0.608 0.134 163)`, white cards, mist-green canvas. **Dark mode** is a toggle in Profile (next-themes, class strategy, default light, system preference disabled deliberately). No blue/indigo anywhere.
- Stack: Next.js 16 App Router, TypeScript, Tailwind 4, shadcn/ui, Prisma + SQLite (`HealthRecord`), z-ai-web-dev-sdk (LLM, server-side only), framer-motion, lucide icons.

## 2. Current Goals / Completed Changes / Verification

**This round — "Revert to mobile app" (per user request):**

- `git revert 7cf813b` (→ `dc51070`) removed the entire dark-neon website; then restored the backend from history: `src/app/api/v1/**` (symptoms analyze, body analysis, records CRUD) + `prisma/schema.prisma` (`HealthRecord`), `bun run db:push` OK.
- New mobile app shell (`src/components/diagnorax/`): `phone-frame.tsx` (device mockup + status bar + desktop showcase panel), `tab-bar.tsx` (5 tabs: Home/Check/Body/History/Profile, iOS-style active pill, safe-area padding), `app.tsx` (client state shell — records loading, per-screen header config, AnimatePresence screen transitions, in-app toast that renders INSIDE the phone so the illusion never breaks), `ui-bits.tsx` (Chip, IconBadge, ListRow, SegmentedControl, SelectChips, EmptyState, time helpers, urgency/category tone maps), `api.ts` (typed client + new `deleteAllRecords()`).
- Screens (`screens/`): `home.tsx` (greeting, animated wellness ring with score heuristic, 4 quick-action cards, recent activity, emergency 112/108 strip, privacy line), `symptoms.tsx` (textarea + example chips + age + duration chips + sex segmented + severity slider, AI result: urgency banner, conditions, self-care, red flags, seek-help, raw JSON collapsible), `body.tsx` (height/weight sliders with live BMI chip, save → big result, BMI scale with spring marker, healthy range, formula, caveats), `history.tsx` (search + filter chips, day-grouped timeline with sticky labels, expandable details incl. stat tiles, AlertDialog delete), `profile.tsx` (local editable name via localStorage, dark-mode Switch, emergency tel: links, export JSON download, clear-all-data, privacy rows, about).
- Backend addition: `DELETE /api/v1/records?all=true` → `deleteMany` (for Profile's clear-all).
- Theme rewrite in `globals.css` (light+dark emerald tokens, `success`/`warning`/`teal-accent` custom tokens, `app-card`/`no-scrollbar`/`pb-safe`/`dot-grid` utilities). `layout.tsx`: DiagnoraX metadata, PWA manifest, apple-web-app, viewport (cover, no zoom), ThemeProvider default light.

**Verification (agent-browser E2E + curl + VLM design review):**

- `bun run lint` clean; dev 200; no console/page errors.
- Golden paths all verified in-browser: Check tab → example prefill → AI analysis (first attempt hit a transient LLM 502 which the UI surfaced gracefully with retry; retry succeeded → "Routine care" result fully rendered); Body tab → slider drag updates live BMI 22.5 → save → result + healthy range; History → day groups, expand details, delete via AlertDialog (DB count 7→6); Profile → dark-mode toggle flips `.dark` on `<html>` (VLM: "Excellent, passes WCAG AA"); `DELETE ?all=true` deleted 6 → 0 (then re-seeded 2 demo records).
- Viewports: desktop 1440×900 (phone frame + showcase panel) and mobile 375×812 (full-screen app, 5-tab bar). VLM review of home screen: "high-fidelity, professional design… looks ready for development".
- **Bugs found & fixed this round**: (1) quick-action cards had unequal heights (button didn't fill grid row → `h-full` fix; re-measured 147.5/147.5 + 128.75/128.75, VLM confirmed aligned); (2) on analysis error the banner grew the form and left the Analyze button hidden under the tab bar (now scrolls button back into view); (3) muted text contrast darkened (`--muted-foreground` 0.518→0.472); (4) tab bar backdrop opacity 85→92, icon-label gap widened; (5) **nested-`<button>` hydration error** — `ListRow` always rendered a `<button>`, and the Dark-mode row placed a Radix `Switch` (button) inside it; `ListRow` now renders `<a>`/`<button>`/`<div>` depending on `href`/`onClick` (console re-verified: 0 errors, toggle still works).

## 3. Unresolved Issues / Risks & Next-Phase Priorities

**Known limitations / risks:**

- LLM is occasionally flaky (one 502 mid-QA) — UI handles it cleanly with retry; acceptable
- Emergency keyword triage is English-only; LLM path still instructed to return `emergency`
- Single-user, no auth — by design for now (local personal app)
- `severity` column stores either urgency level or BMI category (union) — tone-mapping handles both, but a future schema could split them
- Wellness score is a simple heuristic (activity + latest BMI), not medical

**Next-phase priorities (recommended order):**

1. **Medication & interaction awareness module** (5th tab is reserved already? No — currently 5 tabs used; add module as a Home card + section, or replace: consider ` meds` quick-action card → new screen): `POST /api/v1/medications/interactions` — LLM with strict "never the sole authority" framing + curated static top-interactions list
2. **Smart reminders** — `Reminder` Prisma model + CRUD `/api/v1/reminders` + Home widget + browser notifications (great fit for a mobile app)
3. **Report explainer** — paste lab values, deterministic out-of-range flagging + LLM plain-language summary
4. Home polish: weekly urgency-mix chart; streaks; pull-to-refresh feel
5. i18n (Hindi/Marathi) emergency keywords; 108 already surfaced in UI
6. Rotate/revoke the GitHub token when the project is considered finished
