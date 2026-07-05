import { useMemo, useState } from 'react';
import {
  Sun, Briefcase, Dumbbell, Moon, Check, Flame, Target, Utensils, Pill as PillIcon,
  BookOpen, Brain, Scale, Sparkles, Activity, Eye,
} from 'lucide-react';
import { PageHeader, Card, Pill } from '../ui/Section.jsx';
import DailyTodo from '../ui/DailyTodo.jsx';
import { useCloudState } from '../../lib/cloudSync.js';

const todayKey = () => new Date().toISOString().slice(0, 10);

// ── Daily habits tuned to Saurabh's goals (energy + healthy weight gain + focus) ──
const HABITS = [
  { id: 'water', icon: '💧', label: '3L water through the day' },
  { id: 'meals', icon: '🍽️', label: '3 meals + 2 snacks (eat in a surplus)' },
  { id: 'protein', icon: '🍳', label: 'Hit protein (~110 g)' },
  { id: 'gym', icon: '🏋️', label: 'Gym / strength (or a walk on rest days)' },
  { id: 'sun', icon: '☀️', label: '10 min morning sunlight' },
  { id: 'deepwork', icon: '🎯', label: '1 deep-work focus block' },
  { id: 'english', icon: '📚', label: '15 min English' },
  { id: 'screen', icon: '📵', label: 'Screen breaks (20-20-20)' },
  { id: 'sleep', icon: '😴', label: 'In bed by 10 pm' },
];

const RHYTHM = [
  {
    icon: Sun, color: 'amber', title: 'Early morning', time: '5:00 – 7:00 AM',
    items: [
      'Wake, one big glass of water before anything.',
      '10 min sunlight + a short walk (fixes energy + body clock).',
      'No phone for the first 30 minutes.',
      'Write today’s top 3 — most important first.',
      'Protein breakfast within an hour of waking.',
    ],
  },
  {
    icon: Briefcase, color: 'sky', title: 'Work blocks', time: '9:00 AM – 5:00 PM',
    items: [
      'Morning = SALES (proposals, outreach) — the sacred block.',
      'Afternoon = DELIVERY (deep work, phone in another room).',
      'Use Focus Mode timer: 50 min deep work / 10 min break.',
      'One block at a time. Finish before switching.',
    ],
  },
  {
    icon: Dumbbell, color: 'emerald', title: 'Evening', time: '6:00 – 8:00 PM',
    items: [
      'Gym / strength training (3 days a week).',
      'On rest days: a 30-min walk + light stretching.',
      'Post-workout: protein + a proper meal.',
      'Build-out: portfolio, content, learning (if energy allows).',
    ],
  },
  {
    icon: Moon, color: 'violet', title: 'Night', time: '9:00 – 10:00 PM',
    items: [
      'Dinner + a glass of milk before bed (extra calories).',
      'No screens 45 min before sleep (night mode on after sunset).',
      'Plan tomorrow’s top 3.',
      'Sleep by 10 pm — 7–8 hours is non-negotiable for gaining.',
    ],
  },
];

const TRAINING = [
  'Train 3 days a week (e.g. Mon / Wed / Fri), full body each day. As a lean beginner you’ll gain muscle fast — this is the best time of your life to start.',
  'The 6 core moves: Squat (or goblet squat), Push-up or bench press, Row (bent-over or seated), Overhead press, Romanian deadlift (hip hinge), Plank.',
  'Do 3 sets of 8–12 reps for each. Rest ~90 sec between sets.',
  'PROGRESSIVE OVERLOAD is the whole secret: add a little weight or 1 extra rep every week.',
  'Warm up 5–10 min. Form first, ego last — book 1–2 sessions with a trainer to learn form safely.',
  'Rest days matter — muscle is built during rest, not just in the gym. Walk on those days.',
];

const NUTRITION = [
  'You’re ~55 kg at 174 cm (underweight). Goal: climb slowly to a healthy 63–66 kg with muscle.',
  'Eat in a SURPLUS: aim ~2,500–2,700 calories/day (about +400–500 over maintenance).',
  'Protein ~100–120 g/day — the building block of muscle.',
  'Never skip meals. Eat every 3–4 hours. Skipping = the underweight trap.',
];

const MEAL_DAY = [
  { t: 'Morning', f: '3 eggs + 2 rotis or oats + a glass of full-fat milk + banana with peanut butter' },
  { t: 'Mid-morning', f: 'A handful of nuts + a bowl of curd' },
  { t: 'Lunch', f: 'Rice + dal + paneer or chicken + vegetables + a little ghee' },
  { t: 'Pre/Post gym', f: 'Banana + a whey protein shake' },
  { t: 'Dinner', f: 'Roti + sabzi + paneer/eggs + salad' },
  { t: 'Before bed', f: 'A glass of milk' },
];

const SUPPS = [
  { name: 'Whey protein', good: true, text: 'Optional but convenient — a fast way to hit your protein. 1 scoop ≈ 24 g. Food first; whey fills the gap. Take 1–2 scoops/day.' },
  { name: 'Creatine monohydrate', good: true, text: '5 g every day (any time, just be consistent). One of the safest, most-researched supplements on earth — clearly helps strength and muscle. Drink extra water. (This is what you meant by "carotene" — carotene is a carrot nutrient, not for muscle.)' },
  { name: 'Vitamin D3', good: true, text: 'Deficiency is very common in India and causes fatigue. Get tested; supplement if low (a doctor will guide the dose).' },
  { name: 'Avoid', good: false, text: 'Skip expensive mass-gainers (mostly sugar), pre-workouts, and fat burners. You don’t need them. Whey + creatine + real food is 95% of the game.' },
];

const GROWTH = [
  { icon: '📺', title: 'English — daily input', text: 'Watch English shows/YouTube with English subtitles. Read something out loud for 5 minutes. Daily and tiny beats rare and long.' },
  { icon: '✍️', title: 'English — daily output', text: 'Your agency work IS your English gym: write proposals, client emails, and record short Loom intros in English. Ask me to fix your English and explain the changes.' },
  { icon: '🗣️', title: 'Speak without fear', text: 'Narrate your day in simple English, even to yourself. Mistakes are how you learn — confidence comes from reps, not from waiting.' },
  { icon: '🧠', title: 'Skills', text: 'Keep deepening web dev + the agency app. Add sales & communication — they’re what actually grow the income.' },
];

const ANCHORS = [
  { icon: '🛡️', title: 'Discipline is freedom.', body: 'The routine isn’t a cage — it’s what frees you from depending on motivation. Show up even on the low days.' },
  { icon: '🌱', title: 'Consistency beats intensity.', body: 'A small workout and a full meal every day beats a perfect week followed by quitting. Don’t skip two days in a row.' },
  { icon: '⚙️', title: 'Your body is the engine.', body: 'The ₹5Cr plan runs on your energy. Food, sleep, and the gym aren’t separate from the plan — they power it.' },
  { icon: '🔥', title: 'Confidence is built, not waited for.', body: 'You don’t get fit to deserve good things — you build, and confidence follows the reps. Start now, exactly as you are.' },
  { icon: '🪞', title: 'Compare only to yesterday.', body: 'Not to anyone online. A little stronger, a little calmer, a little wiser than last month = winning.' },
  { icon: '🌊', title: 'Slow is smooth, smooth is fast.', body: 'Rushing burns you out. Steady daily reps compound into something nobody can catch.' },
];

const COLOR = {
  amber: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
  sky: 'bg-sky-500/10 text-sky-300 border-sky-500/20',
  emerald: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
  violet: 'bg-violet-500/10 text-violet-300 border-violet-500/20',
};

const GOAL_FROM = 55;
const GOAL_TO = 64;

// ── Latest full-body blood report (Dr Lal PathLabs, 24 Jun 2026) ──
// Plain-language reading only — NOT medical advice. Doctor follow-up flagged.
const REPORT = {
  date: '24 June 2026',
  lab: 'Dr Lal PathLabs',
  intro: 'A plain-English read of my recent full-body checkup. Most of it is genuinely good — three things to act on, one of them soon.',
  priority: "AST (a liver/muscle enzyme) came back high at 194 (normal <34). It's likely from just starting the gym — hard new exercise leaks AST from muscle, and my GGT and bilirubin are normal, which points away from a serious liver problem. But high AST has other causes too, so this must be confirmed: see a doctor soon and take the report. They'll likely order a CK (muscle) test and repeat the LFT after 5–7 days with no gym and no alcohol.",
  flags: [
    { label: 'AST (SGOT) — liver/muscle enzyme', value: '194 (normal <34)', status: 'see-doctor', note: 'Markedly high and much higher than ALT (ratio 3.5). Likely new-gym muscle effect (GGT & bilirubin normal = reassuring), but confirm with a doctor — do not assume.' },
    { label: 'ALT (SGPT) — liver enzyme', value: '54.5 (normal 10–49)', status: 'watch', note: 'Mildly high; fits the same picture as AST. Re-check on the doctor’s follow-up.' },
    { label: 'Triglycerides', value: '219 (normal <150)', status: 'watch', note: 'High — driven by sugar, refined carbs, fried food, late meals and low cardio. Very improvable with diet + activity.' },
    { label: 'HDL ("good" cholesterol)', value: '34 (normal >40)', status: 'watch', note: 'A little low. Cardio, healthy fats (nuts, olive oil, fish) and losing belly fat raise it. LDL (49) and total (127) are great.' },
    { label: 'Platelet count', value: '135 (normal 150–410)', status: 'watch', note: 'Mildly low — but the lab saw "megaplatelets" (large platelets), which usually makes the counter under-read. Likely not a real low; just recheck.' },
  ],
  good: [
    'Thyroid (TSH 2.40, T3, T4) — all normal',
    'Blood sugar — HbA1c 4.9% & fasting glucose 82 — non-diabetic',
    'Kidneys — creatinine 0.69, eGFR 132 (G1) — excellent',
    'Hemoglobin 15.6 — no anemia',
    'LDL 49 & total cholesterol 127 — great',
    'Bilirubin, GGT, ALP, protein, albumin — all normal',
    'Urine routine — essentially normal',
  ],
  actions: [
    'See a doctor soon about the high AST — take this full report. Very likely the new gym, but confirm it.',
    'Before the repeat blood test: avoid alcohol, skip a hard workout for a few days, and pause any new supplements so the retest is clean.',
    'Lower triglycerides + raise HDL: cut sugary drinks, fried & refined-carb food; add a 30-min brisk walk most days; eat more nuts, fish/omega-3 and fibre. Recheck lipids in ~8–12 weeks.',
    'Re-test the platelet count to confirm it’s just the megaplatelet artifact.',
  ],
  disclaimer: 'I’m not a doctor and this isn’t medical advice — it’s a plain-language read to help me understand the report. The doctor who can examine me is the right person, especially for the AST. If anything feels physically wrong, see a doctor promptly.',
};

// ── Eye prescription (Bhagwati Eye Hospital, Dr Ajit Khune, 29 Jun 2026) ──
// Follow exactly. Lotex is a tapering steroid; Kaimoist is a lubricant.
const EYE_CARE = {
  started: '29 June 2026',
  hospital: 'Bhagwati Eye Hospital · Dr Ajit Khune',
  context: 'For diminution of vision with papillae in both eyes (fundus was normal). Two drops: a short tapering steroid (Lotex) and a long-term lubricant (Kaimoist). The taper matters — follow it exactly.',
  schedule: [
    { drop: 'Lotex (steroid)', phase: 'Week 1', dose: '1 drop · 4× a day', eyes: 'Both eyes', dates: 'Jun 29 – Jul 5', times: '7 AM · 12 PM · 5 PM · 10 PM', steroid: true },
    { drop: 'Lotex (steroid)', phase: 'Week 2', dose: '1 drop · 3× a day', eyes: 'Both eyes', dates: 'Jul 6 – Jul 12', times: '7 AM · 2 PM · 10 PM', steroid: true },
    { drop: 'Lotex (steroid)', phase: 'Week 3', dose: '1 drop · 2× a day', eyes: 'Both eyes', dates: 'Jul 13 – Jul 19', times: '7 AM · 10 PM', steroid: true },
    { drop: 'Kaimoist (lubricant)', phase: '60 days', dose: '1 drop · 4× a day', eyes: 'Both eyes', dates: 'Jun 29 – ~Aug 27', times: 'Through the day (≈10 min after Lotex)', steroid: false },
  ],
  howto: [
    'Wash your hands before every dose.',
    'Tilt head back, pull the lower lid down, drop into the pocket — don’t touch the tip to your eye or lashes.',
    'After the drop, close the eye gently and press the inner corner (near the nose) for ~1 minute — it works better and reduces side effects.',
    'If two drops are due together, do Lotex first, then wait ~10 minutes before Kaimoist.',
    'Keep both bottles capped and clean; gently shake Lotex before use if it’s a suspension.',
  ],
  rules: [
    'Lotex is a steroid — finish the full 3-week taper exactly. Don’t stop early, and don’t keep using it longer on your own.',
    'Steroid eye drops can raise eye pressure if misused, so stick to the schedule and attend any follow-up the doctor sets.',
    'Kaimoist is just a lubricant — safe for the full 60 days; add an extra drop if your eyes feel dry.',
    'If vision worsens, or eyes get red/painful, see the doctor sooner — don’t wait.',
  ],
};

export default function ForMe() {
  const today = todayKey();
  const [checkin, setCheckin] = useCloudState('me_checkin', {});
  const [weight, setWeight] = useCloudState('us_weight', { saurabh: [], kaira: [] });
  const [weightInput, setWeightInput] = useState('');

  const todayCheck = checkin[today] || {};
  function toggle(id) {
    setCheckin((c) => ({ ...c, [today]: { ...(c[today] || {}), [id]: !((c[today] || {})[id]) } }));
  }
  function setJournal(text) {
    setCheckin((c) => ({ ...c, [today]: { ...(c[today] || {}), journal: text } }));
  }
  const doneCount = HABITS.filter((h) => todayCheck[h.id]).length;

  const streak = useMemo(() => {
    let count = 0;
    const d = new Date();
    for (let i = 0; i < 400; i++) {
      const key = d.toISOString().slice(0, 10);
      const day = checkin[key] || {};
      const done = HABITS.filter((h) => day[h.id]).length;
      if (done >= 1) count++;
      else if (i > 0) break;
      d.setDate(d.getDate() - 1);
    }
    return count;
  }, [checkin]);

  const myWeights = weight.saurabh || [];
  const latest = myWeights.length ? myWeights[myWeights.length - 1].kg : null;
  const wPct = latest ? Math.min(100, Math.max(0, ((latest - GOAL_FROM) / (GOAL_TO - GOAL_FROM)) * 100)) : 0;

  function logWeight() {
    const v = Number(weightInput);
    if (!v || v <= 0) return;
    setWeight((w) => {
      const arr = [...(w.saurabh || [])];
      const idx = arr.findIndex((e) => e.date === today);
      if (idx >= 0) arr[idx] = { date: today, kg: v };
      else arr.push({ date: today, kg: v });
      arr.sort((a, b) => a.date.localeCompare(b.date));
      return { ...w, saurabh: arr };
    });
    setWeightInput('');
  }

  return (
    <div className="space-y-8 pb-10">
      <PageHeader
        eyebrow="For Me 💕"
        title="Build the man who builds the dream."
        subtitle="This is my space. Health, discipline, focus, and growth — the engine behind everything else. Strong body, calm mind, steady habits. One day at a time."
        accent="amber"
      />

      {/* DAILY TO-DO */}
      <DailyTodo cloudKey="me_todos" accent="amber" title="My to-do list" />

      {/* IDENTITY ANCHOR */}
      <div className="rounded-2xl p-5 sm:p-6 border border-amber-500/15 bg-gradient-to-br from-amber-500/[0.06] to-transparent">
        <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-300/90 mb-2">Who I am becoming</div>
        <p className="text-base sm:text-lg text-slate-100 leading-relaxed font-medium">
          I am someone who <span className="text-amber-300 font-bold">shows up every day</span> — fit, focused, and disciplined.
          I don’t wait to feel ready; I build, and confidence follows. My health powers the plan.
        </p>
      </div>

      {/* TODAY'S CHECK-IN */}
      <section>
        <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Check className="w-5 h-5 text-emerald-300" />
            <h2 className="font-display text-xl font-extrabold">Today’s check-in</h2>
          </div>
          <div className="flex items-center gap-2">
            <Pill color="emerald">{doneCount} / {HABITS.length} done</Pill>
            {streak > 0 && <Pill color="amber">🔥 {streak}-day streak</Pill>}
          </div>
        </div>
        <Card>
          <div className="grid sm:grid-cols-2 gap-2">
            {HABITS.map((h) => {
              const done = !!todayCheck[h.id];
              return (
                <button
                  key={h.id}
                  onClick={() => toggle(h.id)}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                    done ? 'bg-emerald-500/[0.08] border-emerald-500/25' : 'bg-white/[0.02] border-white/[0.06] hover:border-white/[0.12]'
                  }`}
                >
                  <span className="text-xl shrink-0">{h.icon}</span>
                  <span className={`flex-1 text-sm font-medium ${done ? 'text-slate-400 line-through' : 'text-slate-200'}`}>{h.label}</span>
                  <span className={`shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center ${done ? 'bg-emerald-500 border-emerald-500' : 'border-white/20'}`}>
                    {done && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="mt-5">
            <label className="text-[10px] font-bold uppercase tracking-widest text-amber-300 mb-2 block">One win from today</label>
            <textarea
              value={todayCheck.journal || ''}
              onChange={(e) => setJournal(e.target.value)}
              rows={2}
              placeholder="Closed a lead, hit the gym, ate well, learned something…"
              className="w-full bg-ink-900 border border-white/[0.08] hover:border-white/[0.14] focus:border-amber-500/40 rounded-xl px-4 py-3 text-sm focus:outline-none placeholder-slate-600 resize-none transition-colors"
            />
          </div>
        </Card>
      </section>

      {/* WEIGHT PROGRESS */}
      <Card>
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-amber-300" />
            <h3 className="font-display text-lg font-extrabold">Weight goal</h3>
          </div>
          {latest && <Pill color="amber">{latest} kg → {GOAL_TO} kg</Pill>}
        </div>
        <p className="text-xs text-slate-400 mb-3">Slow and steady — aim for ~2–3 kg gain per month with strength. (Full chart is in the Us section.)</p>
        <div className="w-full h-3 bg-white/[0.06] rounded-full overflow-hidden mb-3">
          <div className="h-full bg-gradient-to-r from-amber-400 to-emerald-400 transition-all duration-500" style={{ width: `${wPct}%` }} />
        </div>
        <div className="flex items-end gap-2">
          <label className="flex-1">
            <span className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">Log today’s weight (kg)</span>
            <input
              type="number" inputMode="decimal" value={weightInput}
              onChange={(e) => setWeightInput(e.target.value)} placeholder="e.g. 55"
              className="mt-1 w-full bg-ink-900 border border-white/[0.08] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500/40 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
          </label>
          <button onClick={logWeight} className="bg-amber-500/15 hover:bg-amber-500/25 text-amber-200 text-sm font-bold px-4 py-2 rounded-lg transition-colors">Save</button>
        </div>
      </Card>

      {/* LATEST HEALTH REPORT */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Activity className="w-5 h-5 text-rose-300" />
          <h2 className="font-display text-xl font-extrabold">Latest health report</h2>
        </div>
        <p className="text-sm text-slate-400 leading-relaxed mb-4 max-w-2xl">
          {REPORT.intro} <span className="text-slate-500">({REPORT.lab}, {REPORT.date})</span>
        </p>

        {/* Priority — see a doctor */}
        <div className="rounded-2xl p-5 border border-rose-500/25 bg-rose-500/[0.06] mb-4">
          <div className="text-[10px] font-bold uppercase tracking-widest text-rose-300 mb-1.5">⚠️ Do this first — see a doctor</div>
          <p className="text-sm text-slate-200 leading-relaxed">{REPORT.priority}</p>
        </div>

        {/* What to watch */}
        <Card className="mb-4">
          <h3 className="font-bold text-sm mb-3">What to keep an eye on</h3>
          <div className="space-y-2">
            {REPORT.flags.map((f, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                <Pill color={f.status === 'see-doctor' ? 'rose' : 'amber'}>{f.status === 'see-doctor' ? 'See doctor' : 'Watch'}</Pill>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-slate-100 font-semibold">{f.label} — <span className="text-slate-400 font-normal">{f.value}</span></div>
                  <div className="text-xs text-slate-400 mt-0.5 leading-relaxed">{f.note}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* The good news */}
        <Card className="mb-4">
          <h3 className="font-bold text-sm mb-3 text-emerald-300">The good news — all normal</h3>
          <ul className="space-y-1.5">
            {REPORT.good.map((g, i) => (
              <li key={i} className="flex gap-2 text-sm text-slate-300 leading-relaxed"><span className="text-emerald-400 mt-0.5">✓</span><span>{g}</span></li>
            ))}
          </ul>
        </Card>

        {/* Action plan */}
        <Card>
          <h3 className="font-bold text-sm mb-3 text-amber-300">My action plan</h3>
          <ul className="space-y-2">
            {REPORT.actions.map((a, i) => (
              <li key={i} className="flex gap-2 text-sm text-slate-300 leading-relaxed"><span className="text-amber-400 mt-0.5">▸</span><span>{a}</span></li>
            ))}
          </ul>
        </Card>

        <p className="text-xs text-slate-500 italic mt-3 max-w-2xl">{REPORT.disclaimer}</p>
      </section>

      {/* EYE DROPS — prescription tracker */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Eye className="w-5 h-5 text-sky-300" />
          <h2 className="font-display text-xl font-extrabold">Eye drops — follow exactly</h2>
        </div>
        <p className="text-sm text-slate-400 leading-relaxed mb-4 max-w-2xl">
          {EYE_CARE.context} <span className="text-slate-500">({EYE_CARE.hospital}, started {EYE_CARE.started})</span>
        </p>

        {/* Schedule */}
        <div className="space-y-2 mb-4">
          {EYE_CARE.schedule.map((s, i) => (
            <Card key={i} className="!p-4">
              <div className="flex items-start gap-3 flex-wrap">
                <Pill color={s.steroid ? 'rose' : 'sky'}>{s.phase}</Pill>
                <div className="flex-1 min-w-[180px]">
                  <div className="text-sm font-bold text-slate-100">{s.drop}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{s.dose} · {s.eyes}</div>
                  <div className="text-[11px] text-sky-300 mt-1">⏰ {s.times}</div>
                </div>
                <div className="text-[11px] text-slate-500 font-semibold whitespace-nowrap">{s.dates}</div>
              </div>
            </Card>
          ))}
        </div>

        {/* How to use + rules */}
        <div className="grid lg:grid-cols-2 gap-4">
          <Card>
            <h3 className="font-bold text-sm mb-3 text-emerald-300">How to put the drops</h3>
            <ul className="space-y-2">
              {EYE_CARE.howto.map((h, i) => (
                <li key={i} className="flex gap-2 text-[13px] text-slate-300 leading-relaxed"><span className="text-emerald-400 mt-0.5">✓</span><span>{h}</span></li>
              ))}
            </ul>
          </Card>
          <Card className="!border-rose-500/15 bg-gradient-to-br from-rose-500/[0.04] to-transparent">
            <h3 className="font-bold text-sm mb-3 text-rose-300">Important rules</h3>
            <ul className="space-y-2">
              {EYE_CARE.rules.map((r, i) => (
                <li key={i} className="flex gap-2 text-[13px] text-slate-300 leading-relaxed"><span className="text-rose-400 mt-0.5">●</span><span>{r}</span></li>
              ))}
            </ul>
          </Card>
        </div>
      </section>

      {/* MY DAILY RHYTHM */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Sun className="w-5 h-5 text-amber-300" />
          <h2 className="font-display text-xl font-extrabold">My daily rhythm</h2>
        </div>
        <p className="text-sm text-slate-500 mb-4">Built around a 5–6 AM wake-up. Same shape every day so willpower is never required.</p>
        <div className="grid-auto-cards-sm gap-4 items-stretch">
          {RHYTHM.map((b, i) => {
            const Icon = b.icon;
            return (
              <div key={i} className="rounded-2xl border border-white/[0.06] bg-ink-800/60 overflow-hidden flex flex-col h-full">
                <div className={`flex items-center gap-3 p-4 border-b border-white/[0.05]`}>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${COLOR[b.color]}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-sm leading-tight">{b.title}</h3>
                    <span className="text-[10px] text-slate-500 font-semibold">{b.time}</span>
                  </div>
                </div>
                <ul className="flex-1 divide-y divide-white/[0.05]">
                  {b.items.map((it, j) => (
                    <li key={j} className="px-4 py-2.5 text-[13px] text-slate-300 leading-relaxed">{it}</li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </section>

      {/* GET STRONG — FITNESS PLAN */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Dumbbell className="w-5 h-5 text-emerald-300" />
          <h2 className="font-display text-xl font-extrabold">Get strong — my plan</h2>
        </div>
        <div className="grid lg:grid-cols-2 gap-4">
          <Card>
            <div className="flex items-center gap-2 mb-3"><Dumbbell className="w-4 h-4 text-emerald-300" /><h3 className="font-bold">Training</h3></div>
            <ul className="space-y-1.5">
              {TRAINING.map((t, i) => (
                <li key={i} className="flex gap-2 text-sm text-slate-300 leading-relaxed"><span className="text-emerald-400 mt-1 text-xs">●</span><span>{t}</span></li>
              ))}
            </ul>
          </Card>
          <Card>
            <div className="flex items-center gap-2 mb-3"><Utensils className="w-4 h-4 text-amber-300" /><h3 className="font-bold">Nutrition</h3></div>
            <ul className="space-y-1.5 mb-4">
              {NUTRITION.map((t, i) => (
                <li key={i} className="flex gap-2 text-sm text-slate-300 leading-relaxed"><span className="text-amber-400 mt-1 text-xs">●</span><span>{t}</span></li>
              ))}
            </ul>
            <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3">
              <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">A simple day of eating</div>
              <ul className="space-y-1.5">
                {MEAL_DAY.map((m, i) => (
                  <li key={i} className="text-[13px] text-slate-300 leading-relaxed">
                    <span className="text-amber-300 font-semibold">{m.t}:</span> {m.f}
                  </li>
                ))}
              </ul>
            </div>
          </Card>
        </div>
        <Card className="mt-4">
          <div className="flex items-center gap-2 mb-3"><PillIcon className="w-4 h-4 text-violet-300" /><h3 className="font-bold">Supplements — what actually helps (researched)</h3></div>
          <ul className="space-y-2">
            {SUPPS.map((s, i) => (
              <li key={i} className={`p-3 rounded-xl border ${s.good ? 'bg-emerald-500/[0.05] border-emerald-500/15' : 'bg-rose-500/[0.05] border-rose-500/15'}`}>
                <div className={`text-sm font-bold ${s.good ? 'text-emerald-300' : 'text-rose-300'}`}>{s.name}</div>
                <div className="text-[13px] text-slate-300 leading-relaxed mt-0.5">{s.text}</div>
              </li>
            ))}
          </ul>
          <div className="mt-3 rounded-xl bg-amber-500/[0.06] border border-amber-500/15 p-3 text-xs text-slate-300 leading-relaxed">
            <span className="text-amber-300 font-bold">First step: </span>get a blood test (B12, Vitamin D, thyroid/TSH, CBC). Your easy tiredness may have a simple, fixable cause — and fixing it makes everything else easier.
          </div>
          <p className="text-[10px] text-slate-500 italic mt-2">General, well-established guidance — not medical advice. Check with a doctor before supplements and a trainer for gym form.</p>
        </Card>
      </section>

      {/* GROW */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <BookOpen className="w-5 h-5 text-sky-300" />
          <h2 className="font-display text-xl font-extrabold">Grow — English & skills</h2>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          {GROWTH.map((g, i) => (
            <Card key={i}>
              <div className="text-2xl mb-2">{g.icon}</div>
              <h3 className="font-bold text-sm mb-1.5">{g.title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{g.text}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* MINDSET */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Brain className="w-5 h-5 text-violet-300" />
          <h2 className="font-display text-xl font-extrabold">Mindset anchors</h2>
        </div>
        <div className="grid-auto-cards gap-3">
          {ANCHORS.map((a, i) => (
            <Card key={i}>
              <div className="text-3xl mb-3">{a.icon}</div>
              <h3 className="font-bold text-sm mb-2">{a.title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{a.body}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* CLOSING */}
      <div className="rounded-2xl p-6 text-center border border-amber-500/15 bg-amber-500/[0.04]">
        <Sparkles className="w-6 h-6 text-amber-300 mx-auto mb-3" />
        <p className="text-sm text-slate-300 leading-relaxed max-w-xl mx-auto italic">
          Every glass of water, every meal, every workout, every focused hour — it’s me becoming the man who lives the life we’re building. Not someday. Starting today. 💕
        </p>
      </div>
    </div>
  );
}
