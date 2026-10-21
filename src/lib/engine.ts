/* DiagnoraX AI — shared health engine.
 *
 * Pure TypeScript with ZERO server imports. The exact same code runs:
 *   - inside the Next.js API routes (server), and
 *   - on-device inside the Android APK when no backend is reachable,
 * so triage decisions are identical everywhere.
 *
 * Health information only — never a diagnosis. */

/* ---------- shared types ---------- */

export type UrgencyLevel = 'emergency' | 'urgent' | 'routine' | 'low'

export interface PossibleCondition {
  name: string
  likelihood: 'commonly reported' | 'possible' | 'less common'
  note: string
}

export interface SymptomAnalysis {
  urgencyLevel: UrgencyLevel
  summary: string
  possibleConditions: PossibleCondition[]
  selfCare: string[]
  redFlags: string[]
  whenToSeekHelp: string
}

export type SymptomSex = 'male' | 'female' | 'other' | 'prefer-not-to-say'

export interface SymptomInput {
  symptoms: string
  age?: number
  sex?: SymptomSex
  duration?: 'hours' | '1-3 days' | '4-7 days' | '1-4 weeks' | 'over a month' | 'not sure'
  severity?: number
}

export interface BodyResult {
  bmi: number
  category: string
  tone: 'ok' | 'warn' | 'danger'
  healthyRangeKg: { min: number; max: number }
  midBandBmi: number
  deltaToMid: number
  formula: string
  caveats: string[]
  recommendations: string[]
}

/* ---------- emergency triage (deterministic, runs BEFORE any AI call) ---------- */

export const EMERGENCY_PHRASES =
  "chest pain|chest pressure|crushing chest|can'?t breathe|cannot breathe|difficulty breathing|trouble breathing|struggling to breathe|severe bleeding|bleeding heavily|unconscious|unresponsive|passed out|seizure|convulsion|convulsions|stroke|face drooping|face droop|slurred speech|numbness on one side|one side is numb|sudden weakness on one side|suicidal|suicide|kill myself|end my life|overdose|poisoning|poisoned|anaphylaxis|anaphylactic|severe allergic reaction|throat closing|throat is closing|tongue swelling|coughing blood|coughing up blood|vomiting blood|worst headache of my life"

export const EMERGENCY_RE = new RegExp(`\\b(${EMERGENCY_PHRASES})\\b`, 'i')

/* Negated mentions ("no chest pain", "denies chest pain") must NOT trigger
 * the emergency path. A negation cue + at most one filler word + the phrase
 * is scrubbed before testing. Longer spans ("no fever and chest pain") are
 * deliberately left intact so a real emergency mention is never masked. */
export const NEGATED_EMERGENCY_RE = new RegExp(
  `\\b(?:no|without|denies|deny|negative for)\\s+(?:\\w+\\s+)?(?:${EMERGENCY_PHRASES})\\b`,
  'gi'
)

export function detectEmergency(symptoms: string): boolean {
  const scrubbed = symptoms.replace(NEGATED_EMERGENCY_RE, ' ')
  return EMERGENCY_RE.test(scrubbed)
}

export function emergencyAnalysis(): SymptomAnalysis {
  return {
    urgencyLevel: 'emergency',
    summary:
      "Your description includes signs that can indicate a medical emergency. This tool cannot rule anything out, and for signs like these the safe assumption is that it needs professional attention right now — not later, and not from a chat window.",
    possibleConditions: [],
    selfCare: [
      'Call your local emergency number (112 / 911 / 999 — whichever applies to you) right now. Do not wait to see if it improves.',
      'Do not drive yourself. Stay where you are, or have someone stay with you.',
      'If this involves chest pain, severe bleeding, or trouble breathing: keep still, sit or lie down, and wait for help.',
      'If someone can collect them, have a list of your medications and any allergies ready for the responders.',
    ],
    redFlags: [
      'Any new confusion, fainting, or unresponsiveness',
      'Symptoms suddenly getting much worse',
      'Trouble breathing becoming severe',
    ],
    whenToSeekHelp:
      'Immediately — these signs warrant emergency care now, not an appointment later.',
  }
}

/* ---------- on-device knowledge base (offline rule engine) ----------
 * Honest, conservative, pre-written English guidance per symptom area.
 * Used when no backend / cloud AI is reachable (e.g. inside the APK). */

interface Category {
  id: string
  label: string // "a headache pattern"
  keywords: RegExp
  conditions: PossibleCondition[]
  selfCare: string[]
  redFlags: string[]
}

const COMMON_REDFLAGS = [
  'Symptoms steadily worsening instead of improving after 48–72 hours',
  'Fever above 39°C (102°F) that will not come down',
  'Feeling faint, confused, or unable to keep fluids down',
]

const CATEGORIES: Category[] = [
  {
    id: 'headache',
    label: 'a headache pattern',
    keywords: /\b(headache|head ache|migraine|head pain|throbbing (?:in|behind) (?:my )?head|temple(?:s)? (?:hurt|pain)|pressure in my head)\b/i,
    conditions: [
      { name: 'Tension-type headache', likelihood: 'commonly reported', note: 'The most common headache — often tied to stress, screen time, posture, or poor sleep.' },
      { name: 'Migraine', likelihood: 'possible', note: 'One-sided, throbbing, worse with light or noise — your bright-light detail fits this pattern.' },
      { name: 'Dehydration / eye-strain headache', likelihood: 'possible', note: 'Long hours without water or breaks reproduce exactly this kind of pain.' },
    ],
    selfCare: [
      'Rest in a quiet, dimly lit room and pause screens for 30–60 minutes.',
      'Drink water steadily — 1–2 glasses now, then keep sipping.',
      'A warm compress on the neck or a cool one on the forehead helps many people.',
      'Over-the-counter pain relief (as per the label) is reasonable for healthy adults.',
    ],
    redFlags: [
      'Sudden "worst headache of your life" — emergency, not self-care',
      'Headache with fever and a stiff neck',
      'Headache after a head injury, or with vision loss, weakness, or confusion',
    ],
  },
  {
    id: 'respiratory',
    label: 'an upper-respiratory pattern',
    keywords: /\b(cough|sore throat|runny nose|blocked nose|congestion|sneez|cold|phlegm|mucus|wheez|hoarse|nasal)\b/i,
    conditions: [
      { name: 'Common cold (viral URI)', likelihood: 'commonly reported', note: 'Sore throat plus runny nose for a few days is the classic cold picture.' },
      { name: 'Allergic rhinitis', likelihood: 'possible', note: 'Sneezing and clear discharge without fever points more to allergies than infection.' },
      { name: 'Bronchitis', likelihood: 'less common', note: 'A lingering cough that outlasts the other symptoms by 1–3 weeks.' },
    ],
    selfCare: [
      'Warm fluids — water, soup, honey-lemon — soothe the throat and thin mucus.',
      'Salt-water gargles 2–3 times a day for a sore throat.',
      'Rest and sleep as much as your body asks for.',
      'Steam inhalation or a humidifier can ease congestion at night.',
    ],
    redFlags: [
      'Any difficulty breathing, or shortness of breath at rest',
      'Coughing up blood, or chest pain when breathing',
      'Fever lasting more than 3 days on top of the cough',
    ],
  },
  {
    id: 'fever',
    label: 'a fever pattern',
    keywords: /\b(fever|febrile|high temperature|chills|shivering|burning up|hot and cold)\b/i,
    conditions: [
      { name: 'Viral infection', likelihood: 'commonly reported', note: 'Most fevers under 39°C that last 2–3 days are viral and self-limiting.' },
      { name: 'Flu (influenza)', likelihood: 'possible', note: 'Fever with body aches and exhaustion, more knock-out than a common cold.' },
      { name: 'Bacterial infection', likelihood: 'less common', note: 'More likely when fever is high, one-sided (ear, throat, sinus) or lasting past 4–5 days.' },
    ],
    selfCare: [
      'Fluids in small, frequent sips — fever dries you out faster than you notice.',
      'Paracetamol or ibuprofen per the label for comfort (not to "chase" the number).',
      'Light clothing, no heavy blankets while the fever is climbing.',
      'Track your temperature 2–3 times a day so you can describe the pattern to a doctor.',
    ],
    redFlags: [
      'Fever above 39.5°C (103°F), or any fever lasting more than 4–5 days',
      'Fever with a stiff neck, rash, or extreme drowsiness',
      'Reduced urination — a sign of dehydration needing review',
    ],
  },
  {
    id: 'gastro',
    label: 'a digestive pattern',
    keywords: /\b(nausea|nauseous|vomit|throwing up|diarrh|loose motion|stomach (?:ache|pain|cramp)|abdominal|belly (?:ache|pain)|bloat|indigestion|heartburn|acid reflux|appetite)\b/i,
    conditions: [
      { name: 'Viral gastroenteritis', likelihood: 'commonly reported', note: 'Sudden nausea, cramps and loose stools for 1–3 days — usually self-limiting.' },
      { name: 'Food-related irritation', likelihood: 'possible', note: 'Symptoms starting within hours of a meal often track back to what or how much you ate.' },
      { name: 'Acid reflux (GERD)', likelihood: 'possible', note: 'Burning in the upper stomach or chest, worse when lying down after meals.' },
    ],
    selfCare: [
      'Small sips of water or ORS — hydration matters more than food right now.',
      'Return to food slowly: bananas, rice, toast, curd — avoid oily and spicy food.',
      'Rest; skip caffeine and alcohol until you feel normal.',
      'Note what you ate before it started — patterns matter for next time.',
    ],
    redFlags: [
      'Blood in vomit or in stools — needs prompt review',
      'Signs of dehydration: no urine for 8+ hours, dizziness on standing',
      'Severe, localized pain (especially right-lower or right-upper belly)',
    ],
  },
  {
    id: 'musculoskeletal',
    label: 'a muscle / joint pattern',
    keywords: /\b(back pain|backache|joint|knee|shoulder|elbow|wrist|ankle|muscle|sprain|strain|stiff neck|neck pain|pulled|cramp(?:ed|s)?)\b/i,
    conditions: [
      { name: 'Muscle strain', likelihood: 'commonly reported', note: 'Pain after lifting, new exercise, or an awkward night in bed is usually muscular.' },
      { name: 'Mechanical / postural pain', likelihood: 'commonly reported', note: 'Desk posture and long sitting reliably reproduce back and neck ache.' },
      { name: 'Joint sprain', likelihood: 'possible', note: 'Pain around one joint after a twist or overuse, often with mild swelling.' },
    ],
    selfCare: [
      'Relative rest — stop the movement that hurts, but keep gently mobile.',
      'Ice 15 minutes at a time for the first 48 hours; then warmth often feels better.',
      'Gentle stretches once the sharp pain settles; do not force range.',
      'Over-the-counter pain relief per the label if needed for sleep.',
    ],
    redFlags: [
      'Pain with numbness or weakness in a limb',
      'Loss of bladder or bowel control with back pain — emergency',
      'Pain after significant trauma, or with fever and a hot, swollen joint',
    ],
  },
  {
    id: 'skin',
    label: 'a skin pattern',
    keywords: /\b(rash|itch(?:y|ing)?|hives|skin|redness|bump|blister|dry skin|eczema|irritat(?:ed|ion))\b/i,
    conditions: [
      { name: 'Contact irritation', likelihood: 'commonly reported', note: 'Redness or itching where skin met a new product, fabric, or plant.' },
      { name: 'Heat / sweat rash', likelihood: 'possible', note: 'Tiny bumps in covered, sweaty areas during warm weather.' },
      { name: 'Mild eczema flare', likelihood: 'possible', note: 'Dry, itchy patches that come and go, often in the same spots.' },
    ],
    selfCare: [
      'Stop any new soaps, creams, or fabrics that touched the area.',
      'Fragrance-free moisturizer on clean, dry skin 2× a day.',
      'Cool compress for itching; keep nails short to avoid breaks in skin.',
      'Loose, breathable clothing over the area.',
    ],
    redFlags: [
      'Rash with fever, or a rash that does not fade when pressed',
      'Rapid swelling of lips, tongue, or face — emergency',
      'Spreading redness with warmth and pain (possible skin infection)',
    ],
  },
  {
    id: 'fatigue',
    label: 'a fatigue pattern',
    keywords: /\b(tired|fatigue|exhaust|no energy|weak|sleepy|drained|lethargic|burnt? out)\b/i,
    conditions: [
      { name: 'Sleep debt', likelihood: 'commonly reported', note: 'Under-sleeping for even a week produces heavy daytime fatigue.' },
      { name: 'Recovery from illness', likelihood: 'possible', note: 'Energy commonly lags 1–2 weeks behind an infection.' },
      { name: 'Iron / thyroid / vitamin issues', likelihood: 'less common', note: 'Persistent unexplained fatigue over weeks is worth a blood test.' },
    ],
    selfCare: [
      'Anchor your sleep: same bedtime for the next 7 nights, screens off 30 minutes prior.',
      'Eat regular meals — skipped meals read as fatigue by mid-afternoon.',
      'Light movement (a 15-minute walk) paradoxically restores energy.',
      'Track it: 3–4 honest notes per day help a doctor see the pattern.',
    ],
    redFlags: [
      'Fatigue with unexplained weight loss or night sweats',
      'Fatigue with chest discomfort or breathlessness on minor effort',
      'Feeling low, hopeless, or unable to enjoy anything — talk to someone',
    ],
  },
  {
    id: 'mental',
    label: 'a stress / mood pattern',
    keywords: /\b(anxious|anxiety|stress(?:ed)?|panic|worried|low mood|depress(?:ed|ion)|sad|hopeless|overwhelm(?:ed|ing)|can'?t relax|restless mind)\b/i,
    conditions: [
      { name: 'Acute stress reaction', likelihood: 'commonly reported', note: 'A racing mind and tight body under pressure — very human, usually time-limited.' },
      { name: 'Anxiety symptoms', likelihood: 'possible', note: 'Persistent worry with physical symptoms (racing heart, tension, poor sleep).' },
      { name: 'Low mood', likelihood: 'possible', note: 'Two weeks or more of low interest and energy deserves gentle, real support.' },
    ],
    selfCare: [
      'Slow breathing for 2 minutes: in for 4, hold for 4, out for 6 — repeat.',
      'Get outside; 10 minutes of daylight genuinely shifts the dial.',
      'Tell one person you trust how the last few days have felt.',
      'Halve caffeine for a week and notice the difference.',
    ],
    redFlags: [
      'Any thoughts of harming yourself — reach a helpline or doctor now (India: Tele-MANAS 14416)',
      'Symptoms interfering with work, eating, or sleep for over two weeks',
      'Using alcohol or substances to cope',
    ],
  },
  {
    id: 'sleep',
    label: 'a sleep pattern',
    keywords: /\b(insomnia|can'?t sleep|cannot sleep|trouble sleeping|waking up at night|sleep(?:ing)? badly|poor sleep|nightmares?)\b/i,
    conditions: [
      { name: 'Adjustment insomnia', likelihood: 'commonly reported', note: 'Short-term sleep trouble following stress, travel, or schedule shifts.' },
      { name: 'Poor sleep hygiene', likelihood: 'commonly reported', note: 'Screens late at night and irregular hours quietly wreck sleep quality.' },
      { name: 'Caffeine-related disruption', likelihood: 'possible', note: 'Caffeine after mid-afternoon halves deep sleep even if you fall asleep fine.' },
    ],
    selfCare: [
      'Fixed wake-up time — anchor the rhythm from the morning side.',
      'No screens 30–45 minutes before bed; dim lights instead.',
      'Out of bed if awake > 20 minutes; return when sleepy (protects the bed-sleep link).',
      'No caffeine after 2 pm for the next two weeks.',
    ],
    redFlags: [
      'Loud snoring with witnessed pauses in breathing',
      'Sleepiness dangerous in daily life (driving, operating machinery)',
      'Insomnia lasting beyond a month despite good habits',
    ],
  },
  {
    id: 'urinary',
    label: 'a urinary pattern',
    keywords: /\b(urinat|peeing|burning when i|painful pee|blood in (?:my )?urine|bladder|cystitis|frequent trips to the (?:bathroom|toilet))\b/i,
    conditions: [
      { name: 'Urinary tract irritation', likelihood: 'commonly reported', note: 'Burning or urgency without fever is often a mild, treatable UTI.' },
      { name: 'Dehydration-linked irritation', likelihood: 'possible', note: 'Concentrated urine from low water intake stings on its own.' },
    ],
    selfCare: [
      'Water — aim for urine running pale and clear over the next day.',
      'Warmth on the lower belly eases bladder discomfort.',
      'Avoid holding urine; go when you need to.',
    ],
    redFlags: [
      'Fever, chills, or back pain with urinary symptoms — kidney involvement needs a doctor',
      'Blood in urine, or symptoms lasting beyond 2–3 days',
    ],
  },
  {
    id: 'eye',
    label: 'an eye pattern',
    keywords: /\b(eye|eyes|vision|blurry|red eye|watery eyes|eye pain|light hurts)\b/i,
    conditions: [
      { name: 'Digital eye strain', likelihood: 'commonly reported', note: 'Tired, dry, achy eyes after long screen stretches — extremely common.' },
      { name: 'Allergic / irritant conjunctivitis', likelihood: 'possible', note: 'Red, watery, itchy eyes, often both sides, no significant pain.' },
      { name: 'Dry eye', likelihood: 'possible', note: 'Grittiness and late-day discomfort, better with blinking breaks and humidity.' },
    ],
    selfCare: [
      '20-20-20 rule: every 20 minutes, look 20 feet away for 20 seconds.',
      'Lubricating eye drops (artificial tears) are safe and often enough.',
      'No contact lenses until it settles; never rub the eye.',
    ],
    redFlags: [
      'Sudden vision loss, or a curtain over your vision — emergency',
      'Severe eye pain, halos around lights, or nausea',
      'Chemical or object exposure — rinse and get seen',
    ],
  },
  {
    id: 'dental',
    label: 'a dental / mouth pattern',
    keywords: /\b(tooth|teeth|gum|jaw pain|molar|toothache|sensitive tooth)\b/i,
    conditions: [
      { name: 'Tooth decay / cavity pain', likelihood: 'commonly reported', note: 'Lingering ache or sweet/cold sensitivity in one tooth usually means decay.' },
      { name: 'Gum inflammation', likelihood: 'possible', note: 'Tender, bleeding gums — often improves with careful cleaning within days.' },
    ],
    selfCare: [
      'Warm salt-water rinses 2–3× a day.',
      'Avoid very hot, cold, or sweet foods on the affected side.',
      'Clove oil on the gum near the ache gives many people temporary relief.',
    ],
    redFlags: [
      'Facial swelling or fever with dental pain — needs same-day care',
      'Pain disturbing sleep for more than 1–2 nights',
    ],
  },
]

const GENERIC_CONDITIONS: PossibleCondition[] = [
  { name: 'Common, self-limiting illness', likelihood: 'commonly reported', note: 'Most everyday symptom clusters settle on their own within a week.' },
  { name: 'Something worth describing to a doctor', likelihood: 'possible', note: 'If this persists, worsens, or recurs, a clinician can examine what an app cannot.' },
]

const GENERIC_CARE = [
  'Rest and steady hydration — the boring basics fix more than they get credit for.',
  'Track how you feel once a day; a written pattern is genuinely useful at a doctor visit.',
  'If anything worsens sharply, skip self-care and get reviewed.',
]

/* ---------- local (offline) symptom analysis ---------- */

function matchCategories(text: string): Category[] {
  return CATEGORIES.filter((c) => c.keywords.test(text))
}

function localUrgency(input: SymptomInput, matched: Category[]): UrgencyLevel {
  if ((input.severity ?? 4) >= 8) return 'urgent'
  const longRunning = input.duration === '4-7 days' || input.duration === '1-4 weeks' || input.duration === 'over a month'
  const feverish = matched.some((m) => m.id === 'fever')
  if (feverish && (longRunning || (input.severity ?? 0) >= 7)) return 'urgent'
  if ((input.severity ?? 4) <= 3 && (input.duration === 'hours' || input.duration === 'not sure' || !input.duration)) {
    return 'low'
  }
  return 'routine'
}

export interface LocalAnalysisResult {
  analysis: SymptomAnalysis
  engine: 'emergency-triage' | 'offline-triage'
}

/** Fully deterministic on-device analysis — the offline engine inside the APK. */
export function localSymptomAnalysis(input: SymptomInput): LocalAnalysisResult {
  if (detectEmergency(input.symptoms)) {
    return { analysis: emergencyAnalysis(), engine: 'emergency-triage' }
  }

  const matched = matchCategories(`${input.symptoms}`)
  const urgency = localUrgency(input, matched)

  const areas = matched.slice(0, 3)
  const conditions = areas.flatMap((a) => a.conditions).slice(0, 5)
  const selfCare = dedupe(areas.flatMap((a) => a.selfCare)).slice(0, 6)
  const redFlags = dedupe([...areas.flatMap((a) => a.redFlags), ...COMMON_REDFLAGS]).slice(0, 5)

  const areaText = areas.length
    ? areas.map((a) => a.label).join(' with ')
    : 'a general symptom pattern'

  const durText = input.duration && input.duration !== 'not sure' ? ` for ${input.duration}` : ''
  const sevText = input.severity ? `, around ${input.severity}/10 severity` : ''

  const summary = areas.length
    ? `Your description reads as ${areaText}${durText}${sevText}. This on-device engine matches it against common, everyday patterns — most of which settle on their own — but it cannot examine you or consider your history the way a doctor can. ${urgency === 'urgent' ? 'Given the severity and duration you reported, having a clinician review this soon is the safer call.' : urgency === 'low' ? 'At this severity, watching it at home for a couple of days is reasonable.' : 'If it does not improve over the next few days, a routine appointment is the right next step.'}`
    : `Your description does not match a specific pattern in this device's offline knowledge base${durText}${sevText}. That does not mean nothing is there — it means this engine is being honest about its limits. If the symptoms persist, worsen, or worry you, describe them to a doctor directly.`

  return {
    engine: 'offline-triage',
    analysis: {
      urgencyLevel: urgency,
      summary,
      possibleConditions: areas.length ? conditions : GENERIC_CONDITIONS,
      selfCare: areas.length ? selfCare : GENERIC_CARE,
      redFlags,
      whenToSeekHelp:
        urgency === 'urgent'
          ? 'See a doctor within the next 24 hours — urgent care or a same-day appointment, not the emergency room unless red flags appear.'
          : 'Book a routine appointment if things have not clearly improved within 3–5 days, or immediately if any red flag appears.',
    },
  }
}

function dedupe(arr: string[]): string[] {
  return [...new Set(arr)]
}

/* ---------- body analysis (deterministic arithmetic) ---------- */

const BMI_CLASSES = [
  { max: 18.5, label: 'Underweight', tone: 'warn' },
  { max: 25, label: 'Normal weight', tone: 'ok' },
  { max: 30, label: 'Overweight', tone: 'warn' },
  { max: 35, label: 'Obesity class I', tone: 'danger' },
  { max: 40, label: 'Obesity class II', tone: 'danger' },
  { max: Infinity, label: 'Obesity class III', tone: 'danger' },
] as const

export function computeBodyAnalysis(heightCm: number, weightKg: number): BodyResult {
  const m = heightCm / 100
  const bmi = Math.round((weightKg / (m * m)) * 10) / 10

  const cls = BMI_CLASSES.find((c) => bmi < c.max)!
  const healthyMin = Math.round(18.5 * m * m * 10) / 10
  const healthyMax = Math.round(24.9 * m * m * 10) / 10
  // Middle of the healthy BMI BAND (18.5–24.9), not of the kg range.
  const healthyMid = Math.round(((18.5 + 24.9) / 2) * 10) / 10
  const deltaToMid = Math.round((bmi - healthyMid) * 10) / 10

  const recommendations: string[] = []
  if (cls.label === 'Underweight') {
    recommendations.push('Consider speaking with a healthcare provider about healthy ways to gain weight.')
    recommendations.push('Prioritise calorie-dense, nutritious foods rather than empty calories.')
  } else if (cls.label === 'Normal weight') {
    recommendations.push('You are inside the healthy band — keep doing what you are doing.')
    recommendations.push('Regular activity and balanced nutrition help you stay here.')
  } else {
    recommendations.push('Aim for gradual, sustainable change — 0.25–0.5 kg per week is a healthy pace.')
    recommendations.push('Pair balanced nutrition with regular movement you actually enjoy.')
    recommendations.push('A healthcare provider can help you build a plan that fits your life.')
  }

  return {
    bmi,
    category: cls.label,
    tone: cls.tone,
    healthyRangeKg: { min: healthyMin, max: healthyMax },
    midBandBmi: healthyMid,
    deltaToMid,
    formula: 'BMI = weight (kg) ÷ height² (m²)',
    caveats: [
      'BMI cannot tell muscle from fat — athletes often read "overweight" on BMI alone.',
      'It does not reflect fat distribution, age, sex, or ethnicity.',
      'BMI is a screening number, not a measure of health.',
    ],
    recommendations,
  }
}
