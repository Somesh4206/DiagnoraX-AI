# DiagnoraX AI — Development Worklog

> Live handover document. Read this **first** at the start of any session, then continue where the last phase left off.
> Never store secrets (tokens, keys) in this file.

---

## 1. Current Project Status (Assessment)

- **Repository**: https://github.com/Somesh4206/DiagnoraX-AI — `main` @ `d3db337`, git identity `Somesh M <someshm7662@gmail.com>` (token in `.git/config` remote URL; rotate when the project wraps up). `core.fileMode=false` set locally (sandbox chmod noise).
- **COMPLETE FROM-SCRATCH REBUILD delivered (user request: "remove all the stuffs and build it from scratch").** All previous code was `git rm`'d (commit `f8ea4dd`) and every file was written fresh in 3 pushed milestones: foundation `1b24bc7`, API `fd0f2d0`, app `d3db337`. Nothing was copied from the old implementation.
- **Language rule (user request: "don't use Chinese — use English")**: every user-facing string, LLM prompt and reply is ENGLISH-ONLY. The symptom-analyze system prompt contains an absolute "LANGUAGE RULE: every word in ENGLISH only" instruction. Verified in-browser: zero Chinese characters in rendered output.
- **Theme (dark-fixed, unchanged tokens)**: bg `#050807` · card `#0D1712` · elevated `#122019` · border `#1C3529` · neon `#00FFA3` · cyan `#40D9FF` · warn `#FFBF47` · danger `#FF4D6D`. Utilities: `neon-card`, `neon-card-hover`, `neon-inset`, `grid-bg`, `hero-fade`, `text-glow`, `gradient-neon-text`, `glow-primary`, `dot-pulse`, `scrollbar-neon`. **Never re-theme; never add website chrome (desktop nav / footer / marketing panels).**
- **Form factor**: mobile application at EVERY width. `<640px` raw app edge-to-edge; `≥640px` app runs inside a phone-only device frame via same-origin iframe. Bottom tab bar (5 tabs: Home/Check/Body/History/Profile) is the ONLY navigation. Neon boot splash while presentation mode resolves.
- Stack: Next.js 16 App Router, TypeScript, Tailwind 4, shadcn/ui, Prisma + SQLite (`HealthRecord`), framer-motion, z-ai-web-dev-sdk (server-side only), Bun.

## 2. Current Goals / Completed Changes / Verification

**This round — full from-scratch rebuild + English-only enforcement:**

- Removed: entire previous implementation (`git rm -r` of `src/components/diagnorax` + `src/app/api/v1`).
- Fresh backend (`src/app/api/v1/`):
  - `symptoms/analyze` — zod input; deterministic emergency triage (30+ phrases) with **negation scrubbing** ("no chest pain" does NOT trigger; "no fever and chest pain" still does); LLM path via z-ai-web-dev-sdk with 45s timeout, markdown-fence stripping, strict output schema; **absolute English-only rule in system prompt**; best-effort persistence.
  - `body/analysis` — deterministic BMI with 6 classes, healthy range, recommendations, caveats.
  - `records` — GET (type/q/limit filters), DELETE (id, or `?all=true` clear-all).
- Fresh frontend (`src/components/diagnorax/`):
  - `api.ts` typed client + `recordData()` defensive parser; `ui.tsx` primitives (URGENCY tones, UrgencyBadge, LogoMark, SectionTitle, StatTile, AIThinking, EmptyState, relTime/fmtDateTime/dayKey, disclaimer).
  - `app.tsx` shell: AppContext (view/navigate/records/refreshRecords), sticky app header, AnimatePresence screen stack, fixed 5-tab bottom bar with neon glow active state.
  - `screens/home.tsx`: greeting (+localStorage name), animated SVG wellness ring (activity+BMI heuristic), 4 stat tiles incl. day-streak, 2×2 quick actions, recent activity (3), tel:112/108 emergency strip.
  - `screens/symptoms.tsx`: form (textarea+counter, 3 example chips, age, sex, duration, severity slider with live label), loading AIThinking, error+retry, result (urgency banner w/ engine+timestamp, summary, conditions w/ likelihood chips, self-care, red flags, when-to-seek, actions).
  - `screens/body.tsx`: height/weight, big result + category badge, animated CSS BMI scale with spring marker, healthy range, formula code card, recommendations, caveats, last-analysis hint.
  - `screens/history.tsx`: debounced search, 3 filter chips, day-grouped timeline with sticky labels, expandable rows (summary, self-care, red flags, BMI stat tiles), AlertDialog delete.
  - `screens/profile.tsx`: editable name (localStorage → Home greeting), 112/108 tel links, JSON export download, clear-all with confirm, about card.
  - `device-frame.tsx` (phone only) + `page.tsx` (useSyncExternalStore mode router: boot/phone/app/embedded, ≥640px threshold).
- QA data cleared after testing (0 records — clean first run).

**Verification (agent-browser E2E at 375/800/1440 + curl + VLM):**

- `bun run lint` clean; 0 errors in dev.log; 0 console errors.
- **375×812**: dark neon `#050807`, header, 5 tabs, no footer. Golden paths: Home (greeting/ring/stats/actions); Symptoms — "no chest pain" input → LLM → "Routine — non-urgent care", full result rendered, **zero Chinese characters verified programmatically**; Body 175/70 → BMI 22.9 Normal + scale + range; History day-groups + expand; Profile name "Somesh" → Home greets "Good morning, Somesh".
- **800×900 & 1440×900**: phone frame only — no footer, no marketing text, `onlyPhone:true`. VLM: "Both show the same dark neon-green mobile app… only a phone mockup… no website navigation bars, footers, or marketing text… no visual glitches."
- API edge cases: negated → `ai-llm`/routine; "chest pain + can't breathe" → `emergency-triage`/emergency.

## 3. Unresolved Issues / Risks & Next-Phase Priorities

**Known limitations / risks:**

- LLM occasionally flaky (transient 502s) — UI surfaces retry; acceptable.
- Negation scrubbing covers ≤1 filler word; exotic phrasings may still false-trigger triage (LLM path unaffected). English-only.
- Wellness score is a heuristic, not medical.
- Single-user, no auth — by design.
- If dev serves stale CSS after git file swaps, restart dev with clean `.next`.

**Next-phase priorities (recommended order) — preserve theme + mobile form + English-only:**

1. **Report Explainer** — paste lab values; deterministic out-of-range flagging + English-only LLM plain-language summary (`POST /api/v1/reports/explain`; Home module card → new screen or History-adjacent tab)
2. **Medication awareness** — `POST /api/v1/medications/interactions` + curated static list, "never the sole authority" framing
3. **Smart reminders** — `Reminder` model + CRUD + Home widget + browser notifications
4. Home polish: weekly activity mini-chart, pull-to-refresh feel, streak flame animation
5. i18n emergency keywords (Hindi/Marathi input tolerance, English output)
6. Rotate/revoke the GitHub token when the project is finished
