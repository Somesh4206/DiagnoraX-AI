# DiagnoraX AI — Development Worklog

> Live handover document. Read this **first** at the start of any session, then continue where the last phase left off.
> Never store secrets (tokens, keys) in this file.

---

## 1. Current Project Status (Assessment)

- **Repository**: https://github.com/Somesh4206/DiagnoraX-AI — `main` @ `de6b363`, git identity `Somesh M <someshm7662@gmail.com>` (token in `.git/config` remote URL; rotate when the project wraps up). `core.fileMode=false` is set locally (the sandbox chmod'ed the tree +x; ignore mode-only churn).
- **The app is the EXACT DARK NEON MOBILE APPLICATION from the first chat.** After three user complaints ("looks like a website"), the root cause was found this round: the first-release app shell (`7cf813b`) still contained **website chrome** — a desktop navigation bar (`hidden md:block`), a full website footer, and a bottom-tab bar that hid itself ≥768px. At 768–1023px viewports (e.g. the preview panel) the app literally rendered as a website. That chrome is now **gone**.
- **Theme (exact, dark-fixed, byte-exact from first release)**: bg `#050807` · card `#0D1712` · elevated `#122019` · border `#1C3529` · neon `#00FFA3` · cyan `#40D9FF` · warn `#FFBF47` · danger `#FF4D6D`. Utilities: `neon-card`, `neon-card-hover`, `grid-bg`, `hero-fade`, `text-glow`, `gradient-neon-text`, `glow-primary`, `chip-neon`, `dot-pulse`, `scrollbar-neon`. **Never re-theme, never re-introduce desktop nav/footer/marketing panels.**
- **Form factor (mobile application at EVERY width)**: `src/app/page.tsx` uses `useSyncExternalStore` + `matchMedia('(min-width: 640px)')` → below 640px the raw app runs edge-to-edge (real phones); from 640px up the app runs inside the phone frame (`device-frame.tsx`: dark bezel, dynamic island, status bar, ambient neon glow — **only the phone, no showcase/marketing panel**) via a same-origin iframe. Neon boot splash while mode resolves. There is NO layout, viewport, or width at which the app renders as a website: the header is app-style only, the bottom tab bar (5 tabs) is the only navigation and is always visible, and no footer exists.
- Stack: Next.js 16 App Router, TypeScript, Tailwind 4, shadcn/ui, Prisma + SQLite (`HealthRecord`), Recharts (BMI trend), framer-motion, z-ai-web-dev-sdk (LLM, server-side only), Bun.

## 2. Current Goals / Completed Changes / Verification

**This round — "purge every remaining website trait" (user: "still this is look like the website… exact result from the first prompt"):**

- Investigated: git history + worklogs prove the FIRST feature result ever delivered was `7cf813b` (dark neon) — the restored theme was already byte-exact. The "website" impression came from form, not theme: desktop nav, footer, and the 768–1023px raw-website gap, plus the showcase marketing panel added last round.
- `app.tsx`: removed desktop nav bar + desktop emergency hint + entire `Footer` component; bottom tab bar always visible (dropped `md:hidden`); header right side now a small neon "AI health companion" status pill. Everything else (sticky header, AnimatePresence view transitions, view-reset scroll) unchanged from first release.
- `device-frame.tsx`: stripped to ONLY the phone (no ShowcasePanel, no watermark, no marketing text). Frame height `min(860px, 100dvh-3rem)` so it never clips on short viewports (verified at 1024×768).
- `page.tsx`: phone-frame threshold moved 1024px → **640px**, closing the 640–1023px zone where the raw app previously rendered in website form (desktop nav visible, tabs hidden). Modes: boot splash / embedded (inside frame iframe) / phone (≥640) / app (<640).
- Views + `globals.css`: **byte-exact first-release files, untouched** (their `lg:` variants are dead code in every render path: iframe content viewport ≈378px, raw app <640px).
- **Bug fix (backend)**: emergency triage regex matched negated phrases — "no chest pain" produced a false "Emergency — act now". Added `NEGATED_EMERGENCY_RE` (negation cue + ≤1 filler + phrase is scrubbed before testing; longer spans like "no fever and chest pain" stay intact so real emergencies are never masked). Verified: negated → `ai-llm`/routine; real emergency → `emergency-triage`/emergency.
- Git: commit `de6b363` pushed. Note: that commit also carries permission-bit noise (644→755 on ~92 files, zero content) from a sandbox-wide chmod; `core.fileMode=false` set locally to prevent recurrence.

**Verification (agent-browser E2E at 4 viewports + curl + VLM):**

- `bun run lint` clean; no console errors; dev.log clean.
- **375×812** (raw app): dark neon `rgb(5,8,7)`, app header, 5 bottom tabs, no footer, no desktop nav. Golden paths: Symptom Checker (negated text → LLM "Routine — non-urgent care" with conditions/self-care/red-flags — previously false Emergency), Body Analysis (175/70 → BMI 22.9 Normal, 56.7–76.3 kg range), Dashboard (greeting, stats, BMI trend), History (tabs, day-grouped records).
- **800×900** (the old broken zone): phone frame renders — NOT the website form. Inside iframe: no header nav, no footer, tabs fixed at bottom. VLM: "MOBILE APPLICATION being previewed".
- **1024×768**: phone fits fully, no clipping.
- **1440×900**: phone only, no marketing panel/watermark. VLM: dark neon app, 5 tabs, "No marketing content outside the phone frame".

## 3. Unresolved Issues / Risks & Next-Phase Priorities

**Known limitations / risks:**

- The "LIVE · Cardiac monitor" ECG hero is a demo visualization (labeled as such) — keep the label.
- Negation scrubbing handles ≤1 filler word; exotic phrasings ("not experiencing any chest pain") are not covered — the LLM path still gets them right, but they may false-trigger triage. English-only.
- Single-user, no auth — by design (local personal app).
- LLM occasionally flaky (transient 502s seen in past rounds) — UI surfaces retry; acceptable.
- If dev server serves stale CSS after git file operations, restart dev with a clean `.next` (happened once).
- The iframe presentation requires `window.self !== window.top` detection — keep URLs param-free on `/`.

**Next-phase priorities (recommended order) — all must preserve the exact dark-neon theme and mobile-app form:**

1. **Report Explainer module** — paste lab values, deterministic out-of-range flagging + LLM plain-language summary (`POST /api/v1/reports/explain`; add as a Home module card → new view)
2. **Medication & interaction awareness** — `POST /api/v1/medications/interactions`, "never the sole authority" framing + curated static list
3. **Smart reminders** — `Reminder` model + CRUD + Home widget + browser notifications
4. Home polish: weekly urgency-mix chart, streaks, pull-to-refresh feel
5. i18n (Hindi/Marathi) emergency keywords; 108/112 surfaced in UI
6. Rotate/revoke the GitHub token when the project is considered finished
