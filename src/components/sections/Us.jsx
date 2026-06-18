import { useMemo, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid, ReferenceLine } from 'recharts';
import {
  HeartHandshake, Check, Flame, Plus, Trash2, Scale, Sparkles, Heart, Trophy, Target, ChevronDown, Dumbbell,
} from 'lucide-react';
import { PageHeader, Card, Pill } from '../ui/Section.jsx';
import { useCloudState } from '../../lib/cloudSync.js';

// ── Two people, two sets of habits tuned to their real goals ──
const PEOPLE = {
  saurabh: {
    name: 'Saurabh',
    emoji: '🦅',
    color: 'amber',
    habits: [
      { id: 'water', icon: '💧', label: '3L water through the day' },
      { id: 'protein', icon: '🍳', label: 'Protein-rich breakfast' },
      { id: 'meals', icon: '🍚', label: '3 full meals (no skipping)' },
      { id: 'workout', icon: '🏋️', label: 'Strength / workout' },
      { id: 'sun', icon: '☀️', label: '10 min morning sunlight' },
      { id: 'english', icon: '📚', label: '15 min English practice' },
      { id: 'screen', icon: '📵', label: 'Screen breaks (20-20-20)' },
      { id: 'sleep', icon: '😴', label: 'In bed by 10 pm' },
    ],
  },
  kaira: {
    name: 'Kaira',
    emoji: '🌸',
    color: 'rose',
    habits: [
      { id: 'water', icon: '💧', label: '3L water through the day' },
      { id: 'meals', icon: '🥗', label: 'Real, colourful meals' },
      { id: 'move', icon: '🧘‍♀️', label: 'Move / workout' },
      { id: 'skin', icon: '✨', label: 'Skin + self-care' },
      { id: 'sun', icon: '☀️', label: '10 min morning sunlight' },
      { id: 'english', icon: '📚', label: '15 min English / learning' },
      { id: 'winddown', icon: '🌙', label: 'Evening wind-down' },
      { id: 'sleep', icon: '😴', label: 'Restful sleep' },
    ],
  },
};

const WEIGHT = {
  saurabh: { target: 64, note: 'Goal: reach a healthy 63–66 kg (gain slowly, with strength).', showTarget: true },
  kaira: { target: null, note: 'Goal: maintain & feel strong — already in a healthy range.', showTarget: false },
};

const RITUALS = [
  { id: 'call', icon: '📞', label: 'A proper call — voice is perfect, just be fully present' },
  { id: 'morningnight', icon: '🌅', label: 'Good morning & good night message, every day' },
  { id: 'watch', icon: '🎬', label: 'Watch a movie/show at the same time, together' },
  { id: 'voice', icon: '🎙️', label: 'Send a voice note — warmer than texts' },
  { id: 'plan', icon: '🗓️', label: 'Talk about our someday — the first time we meet' },
  { id: 'surprise', icon: '🎁', label: 'One small surprise — order something, send a photo' },
  { id: 'gratitude', icon: '🤍', label: 'Tell each other one good thing today' },
];

// Simple, beginner-friendly, well-established guidance (not medical advice).
const PLAN = {
  saurabh: {
    goal: 'Gain to a healthy 63–66 kg with real strength — slow and steady wins.',
    gym: [
      '3 days/week, full-body beginner strength: squats, push-ups or bench, rows, overhead press, light deadlift.',
      'Progressive overload — add a little weight or 1 rep each week. That’s the whole secret.',
      'Rest a day between sessions. Muscle is built during rest, not just in the gym.',
      'Form first, ego last. A trainer for 1–2 sessions to fix form is worth it.',
    ],
    nutrition: [
      'Eat in a surplus: +300–500 calories/day. 3 meals + 2 snacks, never skip.',
      'Protein ~90–110g/day: eggs, paneer, dal, milk, curd, chicken, soya.',
      'Easy calorie adds: banana + peanut butter, full-fat milk, ghee on rice, dry fruits.',
      'Protein within an hour of waking — it sets up the whole day.',
    ],
    supps: [
      'Whey protein — optional, just a convenient way to hit your protein. Food first; whey fills the gap (~24g/scoop).',
      'Creatine monohydrate, 5g/day — one of the safest, most-researched supplements for strength & muscle. (You said "carotene" — I think you mean creatine. Carotene is a vitamin-A nutrient from carrots, not a muscle supplement.)',
      'Drink more water when taking creatine.',
      'Skip the fancy expensive stuff. Whey + creatine covers ~95% of what a beginner needs.',
    ],
    note: 'Do a blood test first (B12, Vitamin D, thyroid/TSH, CBC). Fixing a hidden deficiency can transform your energy on its own.',
  },
  kaira: {
    goal: 'Maintain a healthy weight; build strength, energy, and good posture.',
    gym: [
      'Strength 2–3x/week (bodyweight or light weights) — great for tone and posture.',
      'Add mobility / yoga + a daily walk.',
      'Consistency over intensity — gentle and regular beats hard and rare.',
    ],
    nutrition: [
      'Balanced, colourful meals with enough protein (~1g per kg of body weight).',
      'Plenty of water; go easy on ultra-processed snacks.',
      'Regular meals = steady energy for studies and modeling.',
    ],
    supps: [
      'Usually none needed if eating well. Whey only if protein is hard to hit.',
      'A doctor can check Vitamin D / iron (common for women) if she ever feels low on energy.',
    ],
    note: 'Her focus is feeling strong and energetic — she’s already in a healthy range, so it’s about maintaining, not changing.',
  },
};

const COLORS = {
  amber: { text: 'text-amber-300', ring: '#f59e0b', soft: 'bg-amber-500/10 border-amber-500/25', dot: 'bg-amber-400' },
  rose: { text: 'text-rose-300', ring: '#f43f5e', soft: 'bg-rose-500/10 border-rose-500/25', dot: 'bg-rose-400' },
};

const todayKey = () => new Date().toISOString().slice(0, 10);
function isoWeekKey(d = new Date()) {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = (date.getUTCDay() + 6) % 7;
  date.setUTCDate(date.getUTCDate() - dayNum + 3);
  const firstThursday = new Date(Date.UTC(date.getUTCFullYear(), 0, 4));
  const week = 1 + Math.round(((date - firstThursday) / 86400000 - 3 + ((firstThursday.getUTCDay() + 6) % 7)) / 7);
  return `${date.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

function streakOf(habits, personId) {
  let count = 0;
  const d = new Date();
  for (let i = 0; i < 400; i++) {
    const key = d.toISOString().slice(0, 10);
    const day = habits[key]?.[personId] || {};
    const done = Object.values(day).filter((v) => v === true).length;
    if (done >= 1) count++;
    else if (i > 0) break;
    d.setDate(d.getDate() - 1);
  }
  return count;
}

export default function Us() {
  const today = todayKey();
  const week = isoWeekKey();

  const [habits, setHabits] = useCloudState('us_habits', {});
  const [weight, setWeight] = useCloudState('us_weight', { saurabh: [], kaira: [] });
  const [wins, setWins] = useCloudState('us_wins', []);
  const [rituals, setRituals] = useCloudState('us_rituals', {});
  const [nextMeet, setNextMeet] = useCloudState('us_next_meet', '');
  const [person, setPerson] = useState('saurabh');
  const [winText, setWinText] = useState('');
  const [winBy, setWinBy] = useState('us');
  const [weightInput, setWeightInput] = useState('');
  const [planOpen, setPlanOpen] = useState(false);

  const p = PEOPLE[person];
  const c = COLORS[p.color];

  // Days until we next see each other — a concrete thing to move toward.
  const daysToMeet = useMemo(() => {
    if (!nextMeet) return null;
    const t = new Date(today + 'T00:00:00');
    const m = new Date(nextMeet + 'T00:00:00');
    return Math.round((m - t) / 86400000);
  }, [nextMeet, today]);

  // ── Habits ──
  function toggleHabit(personId, habitId) {
    setHabits((h) => {
      const day = h[today] || {};
      const personDay = day[personId] || {};
      return {
        ...h,
        [today]: { ...day, [personId]: { ...personDay, [habitId]: !personDay[habitId] } },
      };
    });
  }
  const todayDone = (personId) => {
    const day = habits[today]?.[personId] || {};
    return PEOPLE[personId].habits.filter((hb) => day[hb.id]).length;
  };

  // ── Weight ──
  function addWeight() {
    const v = Number(weightInput);
    if (!v || v <= 0) return;
    setWeight((w) => {
      const arr = [...(w[person] || [])];
      const idx = arr.findIndex((e) => e.date === today);
      if (idx >= 0) arr[idx] = { date: today, kg: v };
      else arr.push({ date: today, kg: v });
      arr.sort((a, b) => a.date.localeCompare(b.date));
      return { ...w, [person]: arr };
    });
    setWeightInput('');
  }
  const weightData = useMemo(() => {
    const arr = (weight[person] || []).slice(-30);
    return arr.map((e) => ({
      label: e.date.slice(5),
      kg: e.kg,
    }));
  }, [weight, person]);
  const latestWeight = weightData.length ? weightData[weightData.length - 1].kg : null;

  // ── Rituals (weekly, shared) ──
  const weekRituals = rituals[week] || {};
  function toggleRitual(id) {
    setRituals((r) => ({ ...r, [week]: { ...(r[week] || {}), [id]: !(r[week] || {})[id] } }));
  }
  const ritualsDone = RITUALS.filter((r) => weekRituals[r.id]).length;

  // ── Wins & gratitude ──
  function addWin() {
    const text = winText.trim();
    if (!text) return;
    setWins((w) => [{ id: Date.now(), by: winBy, text, date: today }, ...w].slice(0, 100));
    setWinText('');
  }
  function removeWin(id) {
    setWins((w) => w.filter((x) => x.id !== id));
  }

  return (
    <div className="space-y-8 pb-10">
      <PageHeader
        eyebrow="Us 💞"
        title="The life we're building — together, every day."
        subtitle="Right now there's distance between us — you in Maharashtra, me in Rajasthan, both with our families. The whole plan is to close that distance for good. Until then, the habits we keep apart are what build the life we'll share. Calm, consistent, together — even from far."
        accent="rose"
      />

      {/* IDENTITY ANCHOR — the 'why', stated as who we are */}
      <div className="rounded-2xl p-5 sm:p-6 border border-rose-500/15 bg-gradient-to-br from-rose-500/[0.06] to-amber-500/[0.04]">
        <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-rose-300/90 mb-2">Who we are</div>
        <p className="text-base sm:text-lg text-slate-100 leading-relaxed font-medium">
          We are two people who <span className="text-rose-300 font-bold">show up</span> — even across the distance.
          Discipline today is love for our future selves. The distance is temporary; the habits we build now are not.
        </p>
      </div>

      {/* COUNTDOWN TO MEETING — something gentle to move toward */}
      <Card className="border-amber-500/15 bg-gradient-to-br from-amber-500/[0.05] to-transparent">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/15 border border-amber-500/25 flex items-center justify-center text-3xl shrink-0">
              💞
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-amber-300/90 mb-1">The day we meet in person</div>
              {daysToMeet === null ? (
                <div className="text-sm text-slate-400 max-w-md">No date yet — and that's perfectly okay. When the time feels right, set the day. Something beautiful to work toward together.</div>
              ) : daysToMeet > 0 ? (
                <div className="font-display text-2xl sm:text-3xl font-extrabold gold-text">
                  {daysToMeet} {daysToMeet === 1 ? 'day' : 'days'} to go 💞
                </div>
              ) : daysToMeet === 0 ? (
                <div className="font-display text-2xl sm:text-3xl font-extrabold gold-text">Today. 💞</div>
              ) : (
                <div className="text-sm text-slate-400">That day has passed — set the next one. 🌸</div>
              )}
            </div>
          </div>
          <label className="shrink-0">
            <span className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold block mb-1">Set the date</span>
            <input
              type="date"
              value={nextMeet}
              onChange={(e) => setNextMeet(e.target.value)}
              className="bg-ink-900 border border-white/[0.08] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500/40"
            />
          </label>
        </div>
      </Card>

      {/* TODAY TOGETHER */}
      <div className="grid sm:grid-cols-2 gap-4">
        {Object.entries(PEOPLE).map(([id, person2]) => {
          const cc = COLORS[person2.color];
          const done = todayDone(id);
          const total = person2.habits.length;
          const streak = streakOf(habits, id);
          const pct = Math.round((done / total) * 100);
          return (
            <Card key={id} className={`border ${cc.soft}`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{person2.emoji}</span>
                  <h3 className="font-display text-lg font-extrabold">{person2.name}</h3>
                </div>
                {streak > 0 && <Pill color={person2.color === 'rose' ? 'rose' : 'amber'}>🔥 {streak}-day streak</Pill>}
              </div>
              <div className="flex items-end justify-between mb-2">
                <div className={`font-display text-3xl font-extrabold ${cc.text}`}>{done}<span className="text-slate-500 text-lg font-bold">/{total}</span></div>
                <div className="text-xs text-slate-500">habits today</div>
              </div>
              <div className="w-full h-2 bg-white/[0.06] rounded-full overflow-hidden">
                <div className={`h-full ${cc.dot} transition-all duration-500`} style={{ width: `${pct}%` }} />
              </div>
              {streak > 0 && (
                <div className="text-[11px] text-slate-500 mt-2">🔗 {streak} days strong — don't break the chain.</div>
              )}
            </Card>
          );
        })}
      </div>

      {/* PERSON TABS */}
      <div>
        <div className="inline-flex gap-1 p-1 bg-ink-800/60 rounded-xl border border-white/[0.06] mb-4">
          {Object.entries(PEOPLE).map(([id, person2]) => (
            <button
              key={id}
              onClick={() => setPerson(id)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                person === id ? `${COLORS[person2.color].soft} border ${COLORS[person2.color].text}` : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>{person2.emoji}</span>
              {person2.name}
            </button>
          ))}
        </div>

        {/* DAILY HABITS */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Check className={`w-5 h-5 ${c.text}`} />
            <h3 className="font-display text-lg font-extrabold">{p.name}'s daily habits</h3>
          </div>
          <div className="grid sm:grid-cols-2 gap-2">
            {p.habits.map((hb) => {
              const done = !!habits[today]?.[person]?.[hb.id];
              return (
                <button
                  key={hb.id}
                  onClick={() => toggleHabit(person, hb.id)}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                    done ? 'bg-emerald-500/[0.08] border-emerald-500/25' : 'bg-white/[0.02] border-white/[0.06] hover:border-white/[0.12]'
                  }`}
                >
                  <span className="text-xl shrink-0">{hb.icon}</span>
                  <span className={`flex-1 text-sm font-medium ${done ? 'text-slate-400 line-through' : 'text-slate-200'}`}>{hb.label}</span>
                  <span className={`shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                    done ? 'bg-emerald-500 border-emerald-500' : 'border-white/20'
                  }`}>
                    {done && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
                  </span>
                </button>
              );
            })}
          </div>
        </Card>

        {/* WEIGHT LOG */}
        <Card className="mt-4">
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Scale className={`w-5 h-5 ${c.text}`} />
              <h3 className="font-display text-lg font-extrabold">{p.name}'s weight</h3>
            </div>
            {latestWeight && <Pill color={p.color === 'rose' ? 'rose' : 'amber'}>Now: {latestWeight} kg</Pill>}
          </div>
          <p className="text-xs text-slate-400 mb-4 flex items-center gap-1.5">
            <Target className="w-3.5 h-3.5" /> {WEIGHT[person].note}
          </p>
          <div className="flex items-end gap-2 mb-4">
            <label className="flex-1">
              <span className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">Log today's weight (kg)</span>
              <input
                type="number"
                inputMode="decimal"
                value={weightInput}
                onChange={(e) => setWeightInput(e.target.value)}
                placeholder="e.g. 55"
                className="mt-1 w-full bg-ink-900 border border-white/[0.08] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500/40 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </label>
            <button onClick={addWeight} className="bg-amber-500/15 hover:bg-amber-500/25 text-amber-200 text-sm font-bold px-4 py-2 rounded-lg transition-colors">
              Save
            </button>
          </div>
          {weightData.length > 0 ? (
            <div className="h-48 -mx-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weightData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="label" stroke="#475569" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                  <YAxis stroke="#475569" tick={{ fontSize: 10 }} domain={['dataMin - 2', 'dataMax + 2']} tickLine={false} axisLine={false} width={32} />
                  <Tooltip contentStyle={{ background: '#0e0e1a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, fontSize: 12 }} formatter={(v) => [`${v} kg`, 'Weight']} />
                  {WEIGHT[person].showTarget && WEIGHT[person].target && (
                    <ReferenceLine y={WEIGHT[person].target} stroke="#10b981" strokeDasharray="4 4" label={{ value: `target ${WEIGHT[person].target}kg`, fill: '#10b981', fontSize: 10, position: 'insideTopRight' }} />
                  )}
                  <Line type="monotone" dataKey="kg" stroke={c.ring} strokeWidth={2.5} dot={{ r: 3, fill: c.ring }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="text-center py-8 border border-dashed border-white/10 rounded-xl">
              <p className="text-sm text-slate-500">No weigh-ins yet. Log once a week, same time of day (morning is best).</p>
            </div>
          )}
        </Card>

        {/* FITNESS & NUTRITION PLAN (collapsible) */}
        <div className="mt-4 rounded-2xl border border-white/[0.06] bg-ink-800/60 overflow-hidden">
          <button
            onClick={() => setPlanOpen((o) => !o)}
            className="w-full flex items-center gap-3 p-5 text-left hover:bg-white/[0.02] transition-colors"
            aria-expanded={planOpen}
          >
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border ${c.soft}`}>
              <Dumbbell className={`w-5 h-5 ${c.text}`} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-display text-lg font-extrabold leading-tight">{p.name}'s fitness & nutrition plan</h3>
              <p className="text-xs text-slate-400 mt-0.5">{PLAN[person].goal}</p>
            </div>
            <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${planOpen ? 'rotate-180' : ''}`} />
          </button>
          {planOpen && (
            <div className="px-5 pb-5 pt-0 space-y-4">
              <PlanBlock title="🏋️ Training" items={PLAN[person].gym} />
              <PlanBlock title="🍽️ Nutrition" items={PLAN[person].nutrition} />
              <PlanBlock title="💊 Supplements" items={PLAN[person].supps} />
              <div className="rounded-xl bg-amber-500/[0.06] border border-amber-500/15 p-3 text-xs text-slate-300 leading-relaxed">
                <span className="text-amber-300 font-bold">Note: </span>{PLAN[person].note}
              </div>
              <p className="text-[10px] text-slate-500 italic">General guidance, not medical advice. Check with a doctor before supplements, and a trainer for gym form.</p>
            </div>
          )}
        </div>
      </div>

      {/* WEEKLY RITUALS */}
      <Card>
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-violet-300" />
            <h3 className="font-display text-lg font-extrabold">This week, together — across the distance</h3>
          </div>
          <Pill color="violet">{ritualsDone} / {RITUALS.length} done</Pill>
        </div>
        <p className="text-xs text-slate-500 mb-4">Small rituals that keep us close even when we're apart. Resets every week — no guilt for the ones we skip.</p>
        <div className="grid sm:grid-cols-2 gap-2">
          {RITUALS.map((r) => {
            const done = !!weekRituals[r.id];
            return (
              <button
                key={r.id}
                onClick={() => toggleRitual(r.id)}
                className={`flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                  done ? 'bg-violet-500/[0.10] border-violet-500/25' : 'bg-white/[0.02] border-white/[0.06] hover:border-white/[0.12]'
                }`}
              >
                <span className="text-xl shrink-0">{r.icon}</span>
                <span className={`flex-1 text-sm font-medium ${done ? 'text-slate-400 line-through' : 'text-slate-200'}`}>{r.label}</span>
                <span className={`shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center ${done ? 'bg-violet-500 border-violet-500' : 'border-white/20'}`}>
                  {done && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
                </span>
              </button>
            );
          })}
        </div>
      </Card>

      {/* WINS & GRATITUDE */}
      <Card>
        <div className="flex items-center gap-2 mb-3">
          <Trophy className="w-5 h-5 text-amber-300" />
          <h3 className="font-display text-lg font-extrabold">Wins & gratitude</h3>
        </div>
        <p className="text-xs text-slate-500 mb-4">Anything good — a small win, a kind moment, something we're thankful for. Looking back at these on a hard day helps.</p>

        <div className="flex flex-col sm:flex-row gap-2 mb-4">
          <div className="inline-flex gap-1 p-1 bg-ink-900 rounded-lg border border-white/[0.06] shrink-0">
            {[
              { id: 'us', label: '💞 Us' },
              { id: 'saurabh', label: '🦅 Me' },
              { id: 'kaira', label: '🌸 Her' },
            ].map((opt) => (
              <button
                key={opt.id}
                onClick={() => setWinBy(opt.id)}
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${winBy === opt.id ? 'bg-amber-500/15 text-amber-200' : 'text-slate-400 hover:text-slate-200'}`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <input
            value={winText}
            onChange={(e) => setWinText(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') addWin(); }}
            placeholder="Something good that happened…"
            className="flex-1 min-w-0 bg-ink-900 border border-white/[0.08] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500/40 placeholder-slate-600"
          />
          <button onClick={addWin} className="inline-flex items-center justify-center gap-1.5 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-200 text-sm font-bold px-4 py-2 rounded-lg transition-colors shrink-0">
            <Plus className="w-4 h-4" /> Add
          </button>
        </div>

        {wins.length === 0 ? (
          <div className="text-center py-8 border border-dashed border-white/10 rounded-xl">
            <p className="text-sm text-slate-500">No entries yet. Add the first good thing from today. 🤍</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {wins.map((w) => {
              const tag = w.by === 'saurabh' ? '🦅' : w.by === 'kaira' ? '🌸' : '💞';
              return (
                <li key={w.id} className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] group">
                  <span className="text-lg shrink-0">{tag}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-200 leading-relaxed">{w.text}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">{w.date}</p>
                  </div>
                  <button onClick={() => removeWin(w.id)} className="shrink-0 text-slate-600 hover:text-rose-400 p-1.5 rounded-lg hover:bg-white/5 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity" aria-label="Remove">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      {/* GENTLE NOTE */}
      <div className="rounded-2xl p-6 text-center border border-rose-500/15 bg-rose-500/[0.04]">
        <Heart className="w-6 h-6 text-rose-400 mx-auto mb-3" />
        <p className="text-sm text-slate-300 leading-relaxed max-w-xl mx-auto italic">
          The miles between us are just for now. Every habit we keep, every call we make, every small win we log — it's us, quietly closing the distance. We don't have to be perfect. We just have to keep showing up, for ourselves and for each other. 🌸
        </p>
      </div>
    </div>
  );
}

function PlanBlock({ title, items }) {
  return (
    <div>
      <div className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-2">{title}</div>
      <ul className="space-y-1.5">
        {items.map((it, i) => (
          <li key={i} className="flex gap-2 text-sm text-slate-300 leading-relaxed">
            <span className="text-amber-400 mt-1 text-xs">●</span>
            <span>{it}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
