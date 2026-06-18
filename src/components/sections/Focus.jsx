import { useEffect, useMemo, useState } from 'react';
import * as Icons from 'lucide-react';
import {
  Play, Pause, RotateCcw, Brain, Coffee, Target, Plus, Trash2, Check, Flame, Volume2, VolumeX, Clock,
  Maximize2, Minimize2,
} from 'lucide-react';
import { PageHeader, Card, Pill } from '../ui/Section.jsx';
import { useCloudState } from '../../lib/cloudSync.js';

// Pomodoro durations (minutes). Focus = deep work, Short/Long = breaks.
const MODES = {
  focus: { label: 'Focus', minutes: 25, icon: Brain, color: 'amber' },
  short: { label: 'Short break', minutes: 5, icon: Coffee, color: 'emerald' },
  long: { label: 'Long break', minutes: 15, icon: Coffee, color: 'sky' },
};

const COLOR = {
  amber: { ring: '#f59e0b', water: 'rgba(245,158,11,0.85)', text: 'text-amber-300', soft: 'bg-amber-500/10 border-amber-500/25 text-amber-200', bar: 'bg-amber-400' },
  emerald: { ring: '#10b981', water: 'rgba(16,185,129,0.82)', text: 'text-emerald-300', soft: 'bg-emerald-500/10 border-emerald-500/25 text-emerald-200', bar: 'bg-emerald-400' },
  sky: { ring: '#0ea5e9', water: 'rgba(14,165,233,0.82)', text: 'text-sky-300', soft: 'bg-sky-500/10 border-sky-500/25 text-sky-200', bar: 'bg-sky-400' },
};

const todayKey = () => new Date().toISOString().slice(0, 10);
const TIMER_KEY = 'r2up_focus_timer_v1';

const DEFAULT_TIMER = {
  mode: 'focus',
  running: false,
  endAt: null,
  remaining: {
    focus: MODES.focus.minutes * 60,
    short: MODES.short.minutes * 60,
    long: MODES.long.minutes * 60,
  },
};

function loadTimer() {
  try {
    const saved = JSON.parse(localStorage.getItem(TIMER_KEY));
    if (!saved) return DEFAULT_TIMER;
    return { ...DEFAULT_TIMER, ...saved, remaining: { ...DEFAULT_TIMER.remaining, ...(saved.remaining || {}) } };
  } catch {
    return DEFAULT_TIMER;
  }
}
function saveTimer(t) {
  try { localStorage.setItem(TIMER_KEY, JSON.stringify(t)); } catch {}
}
function remainingOf(t, now = Date.now()) {
  if (t.running && t.endAt) return Math.max(0, Math.round((t.endAt - now) / 1000));
  return t.remaining[t.mode];
}
function fmtMins(m) {
  if (!m) return '0m';
  return m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m}m`;
}
// Build a tiling water-wave as an SVG background, coloured per mode.
function waveDataUrl(color) {
  const svg =
    `<svg xmlns='http://www.w3.org/2000/svg' width='100' height='15' viewBox='0 0 100 15' preserveAspectRatio='none'>` +
    `<path d='M0 8 Q 25 0 50 8 T 100 8 V 15 H 0 Z' fill='${color}'/></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

export default function Focus({ data }) {
  const dailyRoutine = data?.dailyRoutine;
  const today = todayKey();

  // ---- Persistent (cloud-synced) data ----
  const [tasks, setTasks] = useCloudState('focus_top3', []);
  const [focusNow, setFocusNow] = useCloudState('focus_now', '');
  const [log, setLog] = useCloudState('focus_log', {}); // { 'YYYY-MM-DD': { sessions, minutes } }
  const [soundOn, setSoundOn] = useCloudState('focus_sound', true);

  // ---- Timer (device-local, survives navigation + refresh) ----
  const [timer, setTimer] = useState(loadTimer);
  const [, setTick] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const [flash, setFlash] = useState(null); // brief confirmation after a block ends

  useEffect(() => { saveTimer(timer); }, [timer]);

  useEffect(() => {
    if (!timer.running) return;
    const id = setInterval(() => setTick((n) => n + 1), 250);
    return () => clearInterval(id);
  }, [timer.running]);

  const secondsLeft = remainingOf(timer);

  // When the running timer reaches zero: stop, chime, log a focus session, and
  // RESET that same mode to full. We do NOT auto-jump to another mode — the user
  // chooses what's next by tapping a tab. (Auto-switching was confusing.)
  useEffect(() => {
    if (!timer.running || secondsLeft > 0) return;
    const finished = timer.mode;
    if (soundOn) beep();
    if (finished === 'focus') {
      setLog((prev) => {
        const d = prev[today] || { sessions: 0, minutes: 0 };
        return { ...prev, [today]: { sessions: d.sessions + 1, minutes: d.minutes + MODES.focus.minutes } };
      });
      setFlash('Focus session saved 🎉  Take a break when you’re ready.');
    } else {
      setFlash('Break done — tap Focus when you’re ready.');
    }
    setTimer((t) => ({
      ...t,
      running: false,
      endAt: null,
      remaining: { ...t.remaining, [finished]: MODES[finished].minutes * 60 },
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft, timer.running]);

  // Exit fullscreen on Escape.
  useEffect(() => {
    if (!fullscreen) return;
    const onKey = (e) => { if (e.key === 'Escape') exitFull(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fullscreen]);

  function toggleRun() {
    setFlash(null);
    setTimer((t) => {
      const rem = remainingOf(t);
      if (t.running) {
        return { ...t, running: false, endAt: null, remaining: { ...t.remaining, [t.mode]: rem } };
      }
      const r = rem > 0 ? rem : MODES[t.mode].minutes * 60;
      return { ...t, running: true, endAt: Date.now() + r * 1000, remaining: { ...t.remaining, [t.mode]: r } };
    });
  }

  // Switching modes PRESERVES each mode's remaining time (fixes the reset bug).
  function switchMode(m) {
    setFlash(null);
    setTimer((t) => {
      const rem = remainingOf(t);
      return { ...t, mode: m, running: false, endAt: null, remaining: { ...t.remaining, [t.mode]: rem } };
    });
  }

  function reset() {
    setFlash(null);
    setTimer((t) => ({
      ...t,
      running: false,
      endAt: null,
      remaining: { ...t.remaining, [t.mode]: MODES[t.mode].minutes * 60 },
    }));
  }

  function enterFull() {
    setFullscreen(true);
    try { document.documentElement.requestFullscreen?.(); } catch {}
  }
  function exitFull() {
    setFullscreen(false);
    try { if (document.fullscreenElement) document.exitFullscreen?.(); } catch {}
  }

  const mode = timer.mode;
  const total = MODES[mode].minutes * 60;
  const level = total > 0 ? 1 - secondsLeft / total : 0; // 0 = empty, 1 = full
  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
  const ss = String(secondsLeft % 60).padStart(2, '0');
  const c = COLOR[MODES[mode].color];

  // ---- Tasks ----
  function addTask() {
    setTasks((t) => (t.length >= 6 ? t : [...t, { id: Date.now(), text: '', done: false }]));
  }
  function updateTask(id, patch) {
    setTasks((t) => t.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  }
  function removeTask(id) {
    setTasks((t) => t.filter((x) => x.id !== id));
  }
  const doneTasks = tasks.filter((t) => t.done).length;

  // ---- Today + last 7 days ----
  const todayStat = log[today] || { sessions: 0, minutes: 0 };
  const last7 = useMemo(() => {
    const arr = [];
    const base = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(base);
      d.setDate(base.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const stat = log[key] || { sessions: 0, minutes: 0 };
      arr.push({ key, label: d.toLocaleDateString(undefined, { weekday: 'short' }).slice(0, 2), ...stat, isToday: key === today });
    }
    return arr;
  }, [log, today]);
  const maxSessions = Math.max(1, ...last7.map((d) => d.sessions));
  const weekSessions = last7.reduce((s, d) => s + d.sessions, 0);

  // ---- Current recommended block by time of day ----
  const currentBlock = useMemo(() => {
    if (!dailyRoutine?.blocks) return null;
    const h = new Date().getHours();
    let id = 'guardrails';
    if (h >= 9 && h < 12) id = 'morning-sales';
    else if (h >= 13 && h < 17) id = 'midday-delivery';
    else if (h >= 18 && h < 21) id = 'evening-build';
    return dailyRoutine.blocks.find((b) => b.id === id) || dailyRoutine.blocks[0];
  }, [dailyRoutine]);
  const BlockIcon = currentBlock ? (Icons[currentBlock.icon] || Icons.Sun) : Icons.Sun;

  const controls = (
    <div className="flex items-center gap-3">
      <button
        onClick={reset}
        className="p-3 rounded-xl border border-white/[0.08] text-slate-300 hover:text-white hover:bg-white/[0.04] transition-colors active:scale-95"
        aria-label="Reset timer"
      >
        <RotateCcw className="w-5 h-5" />
      </button>
      <button
        onClick={toggleRun}
        className={`inline-flex items-center gap-2 px-8 sm:px-10 py-3.5 rounded-2xl font-bold text-ink-950 shadow-lg transition-transform active:scale-95 ${
          timer.running ? 'bg-slate-200 hover:bg-white' : 'bg-gradient-to-br from-amber-400 to-amber-600 hover:from-amber-300'
        }`}
      >
        {timer.running ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
        {timer.running ? 'Pause' : 'Start'}
      </button>
      <button
        onClick={() => setSoundOn((s) => !s)}
        className="p-3 rounded-xl border border-white/[0.08] text-slate-300 hover:text-white hover:bg-white/[0.04] transition-colors active:scale-95"
        aria-label={soundOn ? 'Mute chime' : 'Unmute chime'}
      >
        {soundOn ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
      </button>
    </div>
  );

  return (
    <div className="space-y-6 sm:space-y-8">
      <PageHeader
        eyebrow="Focus Mode"
        title="One block. One timer. Nothing else."
        subtitle="The whole plan comes down to focused blocks done daily. Set your top tasks, start the timer, and let everything else wait."
        accent="amber"
      />

      {/* TIMER + TODAY */}
      <div className="grid lg:grid-cols-5 gap-5">
        <Card className="!p-0 overflow-hidden lg:col-span-3">
          {/* Mode tabs */}
          <div className="flex border-b border-white/[0.06]">
            {Object.entries(MODES).map(([key, m]) => {
              const Ico = m.icon;
              const isActive = mode === key;
              const rem = timer.remaining[key];
              const partial = rem > 0 && rem < m.minutes * 60;
              return (
                <button
                  key={key}
                  onClick={() => switchMode(key)}
                  className={`flex-1 inline-flex items-center justify-center gap-1.5 sm:gap-2 py-3 px-1 text-xs sm:text-sm font-semibold transition-colors relative ${
                    isActive ? `${COLOR[m.color].text} bg-white/[0.03]` : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  <Ico className="w-4 h-4 shrink-0" />
                  <span className="hidden sm:inline">{m.label}</span>
                  <span className="sm:hidden">{m.minutes}m</span>
                  {partial && <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-current opacity-70" title="In progress" />}
                </button>
              );
            })}
          </div>

          <div className="p-6 sm:p-8 flex flex-col items-center relative">
            {/* Fullscreen button */}
            <button
              onClick={enterFull}
              className="absolute top-4 right-4 p-2 rounded-lg border border-white/[0.08] text-slate-400 hover:text-white hover:bg-white/[0.04] transition-colors"
              aria-label="Open fullscreen focus"
              title="Fullscreen"
            >
              <Maximize2 className="w-4 h-4" />
            </button>

            <WaveTimer level={level} mode={mode} sizeClass="w-52 h-52 sm:w-60 sm:h-60">
              <div className="font-display text-5xl sm:text-6xl font-extrabold tabular-nums tracking-tight" style={{ textShadow: '0 2px 16px rgba(0,0,0,0.18)' }}>
                {mm}:{ss}
              </div>
              <div className={`text-[11px] font-bold uppercase tracking-widest mt-2 ${c.text}`}>
                {timer.running ? MODES[mode].label : `${MODES[mode].label} · paused`}
              </div>
            </WaveTimer>

            <div className="mt-7">{controls}</div>
            {flash && (
              <div className="mt-4 text-xs sm:text-sm text-center text-amber-200 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-2 max-w-xs">
                {flash}
              </div>
            )}
          </div>
        </Card>

        {/* TODAY + 7-DAY HISTORY */}
        <Card className="lg:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <Flame className="w-5 h-5 text-amber-300" />
            <h3 className="font-display text-lg font-extrabold">Today</h3>
          </div>
          <div className="grid grid-cols-3 gap-3 mb-5">
            <MiniStat value={todayStat.sessions} label="sessions" color="amber" />
            <MiniStat value={fmtMins(todayStat.minutes)} label="focused" color="emerald" />
            <MiniStat value={`${doneTasks}/${tasks.length || 0}`} label="tasks done" color="sky" />
          </div>

          <div className="flex items-center justify-between mb-2">
            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Last 7 days</div>
            <div className="text-[10px] text-slate-500">{weekSessions} sessions</div>
          </div>
          <div className="flex items-end justify-between gap-2 h-24">
            {last7.map((d) => (
              <div key={d.key} className="flex-1 flex flex-col items-center gap-1.5">
                <div className="w-full flex-1 flex items-end">
                  <div
                    className={`w-full rounded-md transition-all ${d.isToday ? c.bar : 'bg-white/[0.12]'}`}
                    style={{ height: `${Math.max(6, (d.sessions / maxSessions) * 100)}%` }}
                    title={`${d.sessions} sessions · ${fmtMins(d.minutes)}`}
                  />
                </div>
                <span className={`text-[10px] ${d.isToday ? 'text-amber-300 font-bold' : 'text-slate-500'}`}>{d.label}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* WHAT AM I FOCUSING ON RIGHT NOW */}
      <Card>
        <div className="flex items-center gap-2 mb-3">
          <Target className="w-5 h-5 text-amber-300" />
          <h3 className="font-display text-lg font-extrabold">Right now, I am working on…</h3>
        </div>
        <input
          value={focusNow}
          onChange={(e) => setFocusNow(e.target.value)}
          placeholder="e.g. 5 Upwork proposals — no tabs, no phone"
          className="w-full bg-ink-900 border border-white/[0.08] hover:border-white/[0.14] focus:border-amber-500/40 rounded-xl px-4 py-3 text-sm focus:outline-none placeholder-slate-600 transition-colors"
        />
        <p className="text-xs text-slate-500 mt-2">One sentence. The single thing this block is for. (Saved automatically.)</p>
      </Card>

      {/* TOP TASKS FOR TODAY */}
      <Card>
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Check className="w-5 h-5 text-emerald-300" />
            <h3 className="font-display text-lg font-extrabold">Today's top tasks</h3>
          </div>
          <div className="flex items-center gap-2">
            {tasks.length > 0 && <Pill color="emerald">{doneTasks} / {tasks.length} done</Pill>}
            <button
              onClick={addTask}
              disabled={tasks.length >= 6}
              className="inline-flex items-center gap-1.5 bg-emerald-500/15 hover:bg-emerald-500/25 disabled:opacity-40 disabled:cursor-not-allowed text-emerald-200 text-xs font-bold px-3 py-2 rounded-lg transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Add task
            </button>
          </div>
        </div>

        {tasks.length === 0 ? (
          <div className="text-center py-8 border border-dashed border-white/10 rounded-xl">
            <p className="text-sm text-slate-500">No tasks yet. Add the 3 most important things for today.</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {tasks.map((t) => (
              <li key={t.id} className="flex items-center gap-3 group">
                <button
                  onClick={() => updateTask(t.id, { done: !t.done })}
                  className={`shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                    t.done ? 'bg-emerald-500 border-emerald-500' : 'border-white/20 hover:border-emerald-400'
                  }`}
                  aria-label={t.done ? 'Mark not done' : 'Mark done'}
                >
                  {t.done && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
                </button>
                <input
                  value={t.text}
                  onChange={(e) => updateTask(t.id, { text: e.target.value })}
                  placeholder="What needs to get done?"
                  className={`flex-1 min-w-0 bg-transparent border-b border-transparent hover:border-white/[0.08] focus:border-amber-500/40 px-1 py-1.5 text-sm focus:outline-none transition-colors ${
                    t.done ? 'text-slate-500 line-through' : 'text-slate-100'
                  }`}
                />
                <button
                  onClick={() => removeTask(t.id)}
                  className="shrink-0 text-slate-600 hover:text-rose-400 p-1.5 rounded-lg hover:bg-white/5 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                  aria-label="Remove task"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* CURRENT BLOCK SUGGESTION */}
      {currentBlock && (
        <Card>
          <div className="flex items-start gap-3 mb-3 flex-wrap">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border ${c.soft}`}>
              <BlockIcon className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1 flex items-center gap-1.5">
                <Clock className="w-3 h-3" /> Right now, your plan says
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-base sm:text-lg">{currentBlock.title}</h3>
                <Pill color={MODES[mode].color}>{currentBlock.time}</Pill>
              </div>
            </div>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed mb-3">{currentBlock.whyFirst}</p>
          <ul className="space-y-1.5">
            {currentBlock.tasks.slice(0, 5).map((t, i) => (
              <li key={i} className="flex gap-2 text-sm text-slate-300 leading-relaxed">
                <span className="text-amber-400 mt-1 text-xs">●</span>
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* FULLSCREEN OVERLAY */}
      {fullscreen && (
        <div className="fixed inset-0 z-[60] bg-ink-950 flex flex-col items-center justify-center p-6 text-center">
          <button
            onClick={exitFull}
            className="absolute top-5 right-5 p-2.5 rounded-xl border border-white/[0.1] text-slate-300 hover:text-white hover:bg-white/[0.05] transition-colors"
            aria-label="Exit fullscreen"
            title="Exit (Esc)"
          >
            <Minimize2 className="w-5 h-5" />
          </button>

          {focusNow && (
            <div className="mb-8 max-w-md">
              <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1.5">Focusing on</div>
              <div className="text-lg text-slate-200">{focusNow}</div>
            </div>
          )}

          <WaveTimer level={level} mode={mode} sizeClass="w-72 h-72 sm:w-80 sm:h-80">
            <div className="font-display text-6xl sm:text-7xl font-extrabold tabular-nums tracking-tight" style={{ textShadow: '0 2px 18px rgba(0,0,0,0.22)' }}>
              {mm}:{ss}
            </div>
            <div className={`text-xs font-bold uppercase tracking-widest mt-2 ${c.text}`}>
              {timer.running ? MODES[mode].label : `${MODES[mode].label} · paused`}
            </div>
          </WaveTimer>

          <div className="mt-10">{controls}</div>
          {flash && (
            <div className="mt-5 text-sm text-center text-amber-200 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-2.5 max-w-sm">
              {flash}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function WaveTimer({ level, mode, sizeClass, children }) {
  const c = COLOR[MODES[mode].color];
  const wave = useMemo(() => waveDataUrl(c.ring), [c.ring]);
  return (
    <div className={`relative ${sizeClass} rounded-full overflow-hidden border border-white/[0.08] bg-white/[0.02]`}>
      <div
        className="focus-water"
        style={{ height: `${Math.min(100, Math.max(0, level * 100))}%`, background: c.water, transition: 'height 0.6s linear' }}
      >
        <div className="focus-wave" style={{ backgroundImage: wave, animationDuration: '6.5s', opacity: 0.45 }} />
        <div className="focus-wave" style={{ backgroundImage: wave, animationDuration: '3.8s', opacity: 0.9, animationDirection: 'reverse' }} />
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {children}
      </div>
    </div>
  );
}

function MiniStat({ value, label, color = 'amber' }) {
  const map = { amber: 'text-amber-300', emerald: 'text-emerald-300', sky: 'text-sky-300' };
  return (
    <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3 text-center">
      <div className={`font-display text-xl font-extrabold ${map[color]}`}>{value}</div>
      <div className="text-[10px] text-slate-500 mt-0.5 uppercase tracking-wider">{label}</div>
    </div>
  );
}

// A short, gentle chime using the Web Audio API — no audio file needed.
function beep() {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    [880, 1175].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      osc.connect(gain);
      gain.connect(ctx.destination);
      const start = ctx.currentTime + i * 0.18;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.25, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.35);
      osc.start(start);
      osc.stop(start + 0.4);
    });
    setTimeout(() => ctx.close().catch(() => {}), 1200);
  } catch {
    /* sound is optional */
  }
}
