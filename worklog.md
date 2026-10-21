# DiagnoraX AI — Development Worklog

> Live handover document. Read this **first** at the start of any session, then continue where the last phase left off.
> Never store secrets (tokens, keys) in this file.

---

## 1. Current Project Status (Assessment)

- **Repository**: https://github.com/Somesh4206/DiagnoraX-AI — `main` (fast-forwarding; see round history at the bottom), git identity `Somesh M <someshm7662@gmail.com>` (token in `.git/config` remote URL; rotate when the project wraps up). `core.fileMode=false` set locally (sandbox chmod noise).
- **ANDROID APK SHIPPED (user request: "i need this application as mobile app (apk) file that should be included in the github readme file")** — Release **v1.0.0** is live with `DiagnoraX-AI.apk` (5.7MB, `com.somesh.diagnorax`, minSdk 23 / targetSdk 35). Stable permalink verified HTTP 200: `https://github.com/Somesh4206/DiagnoraX-AI/releases/latest/download/DiagnoraX-AI.apk`. README links it prominently + neon QR code (`docs/assets/qr-apk-download.png`). CI (`.github/workflows/build-apk.yml`) rebuilds the APK on every `v*` tag and attaches it to a Release.
- **One engine, two runtimes**: `src/lib/engine.ts` (pure TS) powers BOTH the API routes and the on-device offline engine inside the APK (emergency triage + 12-category knowledge base + BMI). The APK runs 100% offline with localStorage history; a remote DiagnoraX server URL can be connected in Profile → AI engine for full cloud LLM (CORS enabled on all routes).
- **Language rule (user request: "don't use Chinese — use English")**: every user-facing string, LLM prompt and reply is ENGLISH-ONLY. Verified again this round in both cloud and offline modes.
- **Theme (dark-fixed, unchanged tokens)**: bg `#050807` · card `#0D1712` · elevated `#122019` · border `#1C3529` · neon `#00FFA3` · cyan `#40D9FF` · warn `#FFBF47` · danger `#FF4D6D`. Utilities: `neon-card`, `neon-card-hover`, `neon-inset`, `grid-bg`, `hero-fade`, `text-glow`, `gradient-neon-text`, `glow-primary`, `dot-pulse`, `scrollbar-neon`. **Never re-theme; never add website chrome (desktop nav / footer / marketing panels).**
- **Form factor**: mobile application at EVERY width. `<640px` raw app edge-to-edge; `≥640px` app runs inside a phone-only device frame via same-origin iframe. Bottom tab bar (5 tabs: Home/Check/Body/History/Profile) is the ONLY navigation. Safe-area insets (top header + bottom nav) for notched devices/APK.
- Stack: Next.js 16 App Router, TypeScript, Tailwind 4, shadcn/ui, Prisma + SQLite (`HealthRecord`), framer-motion, z-ai-web-dev-sdk (server-side only), Bun, **Capacitor 7 + PWA (manifest + sw.js)**.
- Lint: **clean** (`android/`, `out/`, `mini-services/` added to eslint ignores). Dev server on :3000.

## 2. Current Goals / Completed Changes / Verification

**Previous round (context: from-scratch rebuild)** — see round history at the bottom for its details.

**This round — Android APK edition (shipped end-to-end):**

- Shared engine `src/lib/engine.ts`: moved triage regexes + negation scrubbing + emergency analysis out of the API route; added a 12-category offline knowledge base (headache, respiratory, fever, GI, musculoskeletal, skin, fatigue, mental, sleep, urinary, eye, dental — each with conditions/self-care/red flags) + `localSymptomAnalysis()` + `computeBodyAnalysis()`. API routes now import from it (single source of truth).
- Offline-capable client (`src/components/diagnorax/api.ts` rewritten): `probeBackend()` (GET `/api/v1/health`, 3.5s timeout, cached; new health route), localStorage record store, `fellBackToOffline` remote→on-device fallback, optional remote server (`diagnorax.remoteServer`) with `setRemoteServer`/`getRemoteServer`.
- UI: header pill now shows `Cloud AI · online` (neon dot) or `Offline · on-device engine` (warn dot); Symptoms screen has an offline notice card + "Analyze on device" button + engine-aware labels; Profile has an **AI engine** card (status + connect-your-own-server input, shown only when offline) — verified input hidden in cloud mode.
- **Fixed pre-existing BMI bug**: `midBandBmi` averaged the kg range (68.7) instead of the BMI band (21.7), so "X BMI points above/below the middle" was wildly wrong on the web too. Now correct + friendlier in-band copy.
- PWA: `public/sw.js` (version-stamped, network-first navigations, API never cached), `pwa-register.tsx` (production-only, not inside phone-frame iframe), manifest with 192/512/1024 + maskable icons (AI-generated neon ECG-heart icon, VLM-verified), `viewportFit: cover` + safe-area insets.
- APK pipeline: `next.config.ts` `BUILD_TARGET=apk` → `output: 'export'` + unoptimized images; `build:apk` script; `capacitor.config.ts` (`com.somesh.diagnorax`, webDir `out`, https scheme); committed `android/` platform (Capacitor 7, versionName 1.0.0) with **branded launcher icons (all 5 densities + adaptive foreground) and dark splash screens (11 variants)** — generated with sharp from the AI master icon.
- CI `.github/workflows/build-apk.yml`: checkout → bun → JDK 21 (Temurin) → runner's pre-installed Android SDK (`sdkmanager` located via `find`) → `bun install --frozen-lockfile` → remove `src/app/api` → `BUILD_TARGET=apk` build → `cap sync` → stamp versionCode=GITHUB_RUN_NUMBER + versionName from tag → `gradlew assembleDebug` (with defensive `chmod +x`) → upload artifact + softprops release with install-instructions body.
- README rewritten: APK download section (QR + direct link + install steps + PWA alternative), 7 mobile screenshots + desktop phone-frame hero (all captured via agent-browser, VLM-verified), features table, one-engine-two-runtimes diagram, privacy, stack, build-from-source (web + APK), MIT `LICENSE` added.

**Verification (this round):**

- Local gradle build (JDK: portable Temurin 21 at `~/jdk-21.0.12.1+1`, SDK at `~/android-sdk` — system java is JRE-only): APK 5.2MB, `aapt badging` = `com.somesh.diagnorax` 1.0.0 / SDK 23–35 / 52 web assets bundled.
- **Offline E2E (static `out/` served on :3210, agent-browser 390×844)**: header "Offline · on-device engine"; headache example → ROUTINE on-device result with conditions/self-care (matched headache + eye patterns); "chest pain + can't breathe" → EMERGENCY (deterministic); "no chest pain at all" → ROUTINE (negation works offline); BMI 178/72 → 22.7 offline; History day-groups from localStorage; Profile AI-engine card renders. All English.
- **Cloud E2E (dev :3000)**: header "Cloud AI · online"; LLM analysis rendered in ~6s; Profile "Cloud AI · connected"; remote-server input correctly hidden.
- CI: 3 failed attempts (setup-android action license crash → removed, action unused; `sdkmanager` not on PATH → `find`; `gradlew` lost exec bit in git → `update-index --chmod=+x` + defensive chmod), attempt 4 **SUCCESS** (run 39561212515). Release v1.0.0 asset `DiagnoraX-AI.apk` 5.74MB, versionCode 4 — downloaded and `aapt`-verified from the public URL (HTTP 200).
- `bun run lint` clean; dev.log clean.

## 3. Unresolved Issues / Risks & Next-Phase Priorities

**Known limitations / risks:**

- APK is a **debug** build (debug-signed). For Play Store distribution a release build + signing config would be needed (fine for sideloading).
- Offline knowledge base is honest but generic — the cloud LLM is noticeably better; remote-server flow requires the user to deploy the web app.
- versionCode comes from GITHUB_RUN_NUMBER (monotonic ✓); versionName from the tag — tags must be `v*`.
- LLM occasionally flaky (transient 502s) — UI surfaces retry; acceptable.
- Wellness score is a heuristic, not medical. Single-user, no auth — by design.
- If dev serves stale CSS after git file swaps, restart dev with clean `.next`.

**Next-phase priorities (recommended order) — preserve theme + mobile form + English-only + offline capability:**

1. **Release-signed APK** (keystore in GitHub secrets) + Play-Store-ready metadata/screenshots
2. **Report Explainer** — paste lab values; deterministic out-of-range flagging + English-only LLM summary (`POST /api/v1/reports/explain`; Home module card → new screen)
3. **Medication awareness** — `POST /api/v1/medications/interactions` + curated static list, "never the sole authority" framing
4. **Smart reminders** — `Reminder` model + CRUD + Home widget + browser notifications
5. Home polish: weekly activity mini-chart, pull-to-refresh feel, streak flame animation
6. Rotate/revoke the GitHub token when the project is finished

---

## Round history

---
Task ID: 4 (single-agent round)
Agent: Z.ai Code (main)
Task: Deliver DiagnoraX AI as an installable Android APK referenced in the GitHub README (user request)

Work Log:
- Installed Android SDK (platform-35, build-tools 35.0.0) + portable Temurin JDK 21 locally; Capacitor 7 packages added
- Extracted shared `src/lib/engine.ts` (triage + offline KB + BMI); refactored the 3 API routes onto it; added `/api/v1/health` + CORS helpers (`src/lib/http.ts`)
- Rewrote client `api.ts` with probe/offline/remote-server logic; updated app shell (aiMode context + status pill + safe areas), symptoms screen (offline notice/labels), profile screen (AI engine card)
- Fixed pre-existing BMI `midBandBmi` bug (kg-range average → BMI-band average)
- PWA: sw.js + register component + manifest + AI-generated icon set (sharp-processed 192/512/1024/maskable)
- Static export mode (`BUILD_TARGET=apk`), `capacitor.config.ts`, `android/` platform committed with branded icons + splashes
- Verified static export offline E2E on :3210 (agent-browser), cloud E2E on :3000, local gradle APK build
- CI workflow created; iterated 3 fixes (setup-android removal, sdkmanager path, gradlew exec bit) → **SUCCESS on attempt 4**; Release v1.0.0 with DiagnoraX-AI.apk verified via public permalink
- README rewritten (APK + QR + screenshots + docs), LICENSE added; all pushed incrementally

Stage Summary:
- APK shipped: `releases/latest/download/DiagnoraX-AI.apk` (HTTP 200, aapt-verified), README references it + QR
- App now dual-runtime (cloud + offline) with identical deterministic triage
- All E2E green, lint clean, English-only everywhere, theme untouched

---
Task ID: 3 (previous round)
Agent: Z.ai Code (main)
Task: From-scratch rebuild (user request: "remove all the stuffs and build it from scratch") + English-only enforcement

Work Log:
- `git rm`'d previous implementation entirely (commit `f8ea4dd`)
- Fresh foundation: theme tokens/utilities in globals.css, layout, Prisma schema (`1b24bc7`)
- Fresh API: symptom analyze (English-only LLM + deterministic triage + negation scrub), body analysis, records CRUD (`fd0f2d0`)
- Fresh frontend: app shell + 5 screens + device frame + mode router (`d3db337`)
- E2E verified at 375/800/1440 (agent-browser + VLM), zero Chinese characters confirmed

Stage Summary:
- Complete fresh codebase, English-only, dark neon mobile form at every width — user-specified theme preserved exactly
