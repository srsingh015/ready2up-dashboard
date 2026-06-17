import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, BookOpen, Sparkles, Sun, Moon, Coffee, Wind, ChevronDown, Check } from 'lucide-react';
import { Card, Pill } from '../ui/Section.jsx';
import { useLocalStorage } from '../../hooks/useLocalStorage.js';
import { useCloudState } from '../../lib/cloudSync.js';

export default function ForKaira({ data }) {
  const { kaira } = data;
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const [checkin, setCheckin] = useCloudState('kaira_checkin', {});
  const [visited, setVisited] = useCloudState('kaira_visited', {});
  const [openWeek, setOpenWeek] = useState(1);
  const [openLetter, setOpenLetter] = useState('l1');
  const [showLibrary, setShowLibrary] = useState(false);

  const todayCheckin = checkin[today] || {};
  function toggleAnswer(qId) {
    setCheckin((c) => ({
      ...c,
      [today]: { ...(c[today] || {}), [qId]: !((c[today] || {})[qId]) },
    }));
  }
  function setJournal(text) {
    setCheckin((c) => ({
      ...c,
      [today]: { ...(c[today] || {}), journal: text },
    }));
  }

  function toggleVisited(itemId) {
    setVisited((v) => ({ ...v, [itemId]: !v[itemId] }));
  }

  const streakDays = useMemo(() => {
    let count = 0;
    const d = new Date();
    for (let i = 0; i < 365; i++) {
      const key = d.toISOString().slice(0, 10);
      const day = checkin[key] || {};
      const ticked = Object.values(day).filter((v) => v === true).length;
      if (ticked >= 1) count++;
      else if (i > 0) break;
      d.setDate(d.getDate() - 1);
    }
    return count;
  }, [checkin]);

  return (
    <div className="space-y-10 pb-10">
      {/* HERO — warm welcome */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-3xl p-7 sm:p-10 petal-bg"
        style={{ background: 'var(--hero-bg)', border: '1px solid var(--hero-border)' }}
      >
        <div className="relative">
          <div className="text-3xl mb-3">{kaira.intro.emoji}</div>
          <div className="text-xs uppercase tracking-widest text-slate-400 mb-2">{kaira.intro.salutation},</div>
          <h1 className="font-display text-3xl sm:text-4xl font-extrabold leading-[1.15] mb-5">
            <span className="gold-text">{kaira.intro.title}</span>
          </h1>
          <div className="space-y-3 max-w-2xl">
            {kaira.intro.welcomeMessage.map((p, i) => (
              <p key={i} className="text-[15px] text-slate-300 leading-relaxed">{p}</p>
            ))}
          </div>
        </div>
      </motion.section>

      {/* DAILY CHECK-IN — interactive */}
      <section>
        <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-rose-400" />
            <h2 className="font-display text-xl font-extrabold">{kaira.dailyCheckin.title}</h2>
          </div>
          {streakDays > 0 && (
            <Pill color="amber">🔥 {streakDays}-day streak</Pill>
          )}
        </div>
        <p className="text-sm text-slate-500 mb-5">{kaira.dailyCheckin.subtitle}</p>

        <Card>
          <div className="space-y-2">
            {kaira.dailyCheckin.questions.map((q) => {
              const ticked = todayCheckin[q.id];
              return (
                <button
                  key={q.id}
                  onClick={() => toggleAnswer(q.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                    ticked
                      ? 'bg-emerald-500/[0.08] border-emerald-500/25'
                      : 'bg-white/[0.02] border-white/[0.06] hover:border-white/[0.12]'
                  }`}
                >
                  <span className="text-2xl shrink-0">{q.emoji}</span>
                  <span className="flex-1 text-sm text-slate-200 font-medium">{q.label}</span>
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                    ticked ? 'bg-emerald-500 border-emerald-500' : 'border-white/20'
                  }`}>
                    {ticked && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-5">
            <label className="text-[10px] font-bold uppercase tracking-widest text-amber-300 mb-2 block">{kaira.dailyCheckin.journalPrompt}</label>
            <textarea
              value={todayCheckin.journal || ''}
              onChange={(e) => setJournal(e.target.value)}
              rows={2}
              placeholder="A laugh, a flower, something kind someone said, a small thing you did well..."
              className="w-full bg-ink-900 border border-white/[0.08] hover:border-white/[0.14] focus:border-amber-500/40 rounded-xl px-4 py-3 text-sm focus:outline-none placeholder-slate-500 resize-none transition-colors"
            />
          </div>
        </Card>
      </section>

      {/* DAILY RHYTHM */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Wind className="w-5 h-5 text-sky-300" />
          <h2 className="font-display text-xl font-extrabold">{kaira.dailyRhythm.title}</h2>
        </div>
        <p className="text-sm text-slate-500 mb-5">{kaira.dailyRhythm.subtitle}</p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <RhythmBox block={kaira.dailyRhythm.morning} icon={Sun} color="amber" />
          <RhythmBox block={kaira.dailyRhythm.midday} icon={Coffee} color="emerald" />
          <RhythmBox block={kaira.dailyRhythm.evening} icon={Moon} color="violet" />
          <RhythmBox block={kaira.dailyRhythm.weekly} icon={Sparkles} color="rose" />
        </div>
      </section>

      {/* MINDSET ANCHORS */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-5 h-5 text-violet-300" />
          <h2 className="font-display text-xl font-extrabold">Little reminders, when you need them</h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {kaira.mindsetAnchors.map((a, i) => (
            <Card key={i}>
              <div className="text-3xl mb-3">{a.icon}</div>
              <h3 className="font-bold text-sm mb-2">{a.title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{a.body}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* MONEY JOURNEY — 12 weeks */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <BookOpen className="w-5 h-5 text-emerald-300" />
          <h2 className="font-display text-xl font-extrabold">{kaira.moneyJourney.title}</h2>
        </div>
        <p className="text-sm text-slate-400 leading-relaxed mb-3 max-w-2xl">{kaira.moneyJourney.subtitle}</p>
        <div className="rounded-xl bg-amber-500/[0.05] border border-amber-500/15 p-4 mb-6 max-w-2xl">
          <p className="text-sm text-slate-200 leading-relaxed italic">"{kaira.moneyJourney.coreIdea}"</p>
        </div>

        {/* Week pill nav */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {kaira.moneyJourney.weeks.map((w) => (
            <button
              key={w.n}
              onClick={() => setOpenWeek(w.n)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                openWeek === w.n
                  ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-200'
                  : 'border-white/[0.08] text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
              }`}
            >
              W{w.n}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {kaira.moneyJourney.weeks.filter((w) => w.n === openWeek).map((w) => (
            <motion.div
              key={w.n}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25 }}
            >
              <Card>
                <div className="flex items-center gap-3 mb-4 flex-wrap">
                  <Pill color="emerald">Week {w.n} of 12</Pill>
                  <h3 className="font-display text-lg font-extrabold">{w.topic}</h3>
                </div>
                <div className="space-y-4">
                  <Block label="Why this matters" body={w.why} accent="amber" />
                  <Block label="This week, do this" body={w.activity} accent="emerald" />
                  <Block label="Recommended resource" body={w.resource} accent="violet" />
                </div>
                <div className="flex justify-between items-center mt-5 pt-4 border-t border-white/[0.06]">
                  <button
                    onClick={() => setOpenWeek(Math.max(1, w.n - 1))}
                    disabled={w.n === 1}
                    className="text-xs text-slate-400 hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    ← Previous week
                  </button>
                  <button
                    onClick={() => setOpenWeek(Math.min(12, w.n + 1))}
                    disabled={w.n === 12}
                    className="text-xs text-amber-300 hover:text-amber-200 disabled:opacity-30 disabled:cursor-not-allowed font-semibold"
                  >
                    Next week →
                  </button>
                </div>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </section>

      {/* RESOURCES (collapsible behind a button) */}
      <section>
        <div className="flex items-center justify-between flex-wrap gap-3 mb-3">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-amber-300" />
            <h2 className="font-display text-xl font-extrabold">{kaira.resources.title}</h2>
          </div>
          <button
            onClick={() => setShowLibrary((s) => !s)}
            className="inline-flex items-center gap-1.5 bg-amber-500/15 hover:bg-amber-500/25 text-amber-200 text-xs font-bold px-4 py-2 rounded-lg transition-colors"
          >
            <BookOpen className="w-3.5 h-3.5" />
            {showLibrary ? 'Hide library' : 'Open the library'}
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showLibrary ? 'rotate-180' : ''}`} />
          </button>
        </div>
        <AnimatePresence initial={false}>
          {showLibrary && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="overflow-hidden"
            >
              <div className="grid sm:grid-cols-2 gap-4 pt-3">
                <ResourceCard title="Books" icon="📚" items={kaira.resources.books} fields={['title', 'author', 'why']} />
                <ResourceCard title="YouTube channels" icon="📺" items={kaira.resources.youtube} fields={['name', null, 'why']} />
                <ResourceCard title="Podcasts" icon="🎧" items={kaira.resources.podcasts} fields={['name', null, 'why']} />
                <ResourceCard title="Apps to try" icon="📱" items={kaira.resources.apps} fields={['name', null, 'why']} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        {!showLibrary && (
          <p className="text-xs text-slate-500 italic">Tap the button when you feel like it — no rush, no pressure.</p>
        )}
      </section>

      {/* OUR VISION — the life we are building (with tappable items) */}
      <section>
        <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-rose-400" />
            <h2 className="font-display text-xl font-extrabold">{kaira.ourVision.title}</h2>
          </div>
          <VisionProgress vision={kaira.ourVision} visited={visited} />
        </div>
        <p className="text-sm text-slate-400 leading-relaxed mb-2 max-w-2xl">{kaira.ourVision.subtitle}</p>
        {kaira.ourVision.note && (
          <p className="text-xs text-amber-300/90 italic mb-6 max-w-2xl">{kaira.ourVision.note}</p>
        )}

        <div className="grid lg:grid-cols-2 gap-4">
          {kaira.ourVision.categories.map((cat) => (
            <VisionCategory
              key={cat.id}
              cat={cat}
              visited={visited}
              onToggle={toggleVisited}
            />
          ))}
        </div>
      </section>

      {/* LOVE LETTERS */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Heart className="w-5 h-5 text-rose-400" />
          <h2 className="font-display text-xl font-extrabold">A few words</h2>
        </div>
        <div className="space-y-2">
          {kaira.loveLetters.map((l) => {
            const isOpen = openLetter === l.id;
            return (
              <Card key={l.id} className="!p-0 overflow-hidden">
                <button
                  onClick={() => setOpenLetter(isOpen ? null : l.id)}
                  className="w-full flex items-center gap-3 p-4 text-left hover:bg-white/[0.02] transition-colors"
                >
                  <Heart className="w-4 h-4 text-rose-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-sm">{l.title}</h4>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                    >
                      <div className="px-4 pb-5 pt-1 border-t border-white/[0.06]">
                        <p className="text-[15px] text-slate-300 leading-relaxed mt-3 italic">{l.body}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function RhythmBox({ block, icon: Icon, color }) {
  const colorMap = {
    amber: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
    emerald: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
    violet: 'bg-violet-500/10 text-violet-300 border-violet-500/20',
    rose: 'bg-rose-500/10 text-rose-300 border-rose-500/20',
  };
  return (
    <Card>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center border mb-3 ${colorMap[color]}`}>
        <Icon className="w-5 h-5" />
      </div>
      <h3 className="font-bold text-sm mb-3">{block.title}</h3>
      <ul className="space-y-2">
        {block.items.map((it, i) => (
          <li key={i} className="flex gap-2 text-sm text-slate-300 leading-relaxed">
            <span className="shrink-0">{it.icon}</span>
            <span>{it.label}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function Block({ label, body, accent = 'amber' }) {
  const accentMap = {
    amber: 'text-amber-300',
    emerald: 'text-emerald-300',
    violet: 'text-violet-300',
  };
  return (
    <div>
      <div className={`text-[10px] font-bold uppercase tracking-widest ${accentMap[accent]} mb-1.5`}>{label}</div>
      <p className="text-sm text-slate-300 leading-relaxed">{body}</p>
    </div>
  );
}

function ResourceCard({ title, icon, items, fields }) {
  const [titleField, subField, whyField] = fields;
  return (
    <Card>
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xl">{icon}</span>
        <h3 className="font-bold text-base">{title}</h3>
      </div>
      <ul className="space-y-3">
        {items.map((it, i) => (
          <li key={i} className="border-b border-white/[0.04] last:border-0 pb-3 last:pb-0">
            <div className="text-sm font-bold text-slate-100">
              {it[titleField]}
              {subField && <span className="text-slate-500 font-normal ml-1.5">· {it[subField]}</span>}
            </div>
            <div className="text-xs text-slate-400 mt-1 leading-relaxed">{it[whyField]}</div>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function VisionCategory({ cat, visited = {}, onToggle }) {
  const colorMap = {
    sky: { wrap: 'border-sky-500/20', icon: 'bg-sky-500/15 text-sky-300', accent: 'text-sky-300' },
    violet: { wrap: 'border-violet-500/20', icon: 'bg-violet-500/15 text-violet-300', accent: 'text-violet-300' },
    amber: { wrap: 'border-amber-500/20', icon: 'bg-amber-500/15 text-amber-300', accent: 'text-amber-300' },
    rose: { wrap: 'border-rose-500/20', icon: 'bg-rose-500/15 text-rose-300', accent: 'text-rose-300' },
    emerald: { wrap: 'border-emerald-500/20', icon: 'bg-emerald-500/15 text-emerald-300', accent: 'text-emerald-300' },
  };
  const c = colorMap[cat.color] || colorMap.amber;
  const doneCount = cat.items.filter((it) => visited[it.id]).length;

  return (
    <div className={`relative rounded-2xl p-5 sm:p-6 border ${c.wrap} bg-ink-800/60 overflow-hidden`}>
      <div className="flex items-start gap-3 mb-3">
        <div className={`w-12 h-12 rounded-xl ${c.icon} flex items-center justify-center text-2xl shrink-0`}>
          {cat.icon}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-lg font-extrabold leading-tight">{cat.title}</h3>
          <p className={`text-xs mt-1 font-semibold ${c.accent}`}>{cat.subtitle}</p>
        </div>
        {onToggle && (
          <div className={`text-[10px] font-bold uppercase tracking-widest ${c.accent} bg-white/[0.04] border border-white/[0.06] rounded-full px-2.5 py-1 whitespace-nowrap`}>
            {doneCount} / {cat.items.length}
          </div>
        )}
      </div>
      {cat.intro && (
        <p className="text-sm text-slate-400 italic mb-4 leading-relaxed">{cat.intro}</p>
      )}
      <ul className="space-y-2">
        {cat.items.map((it) => {
          const done = !!visited[it.id];
          const isHighlight = it.highlight;
          return (
            <li key={it.id}>
              <button
                onClick={() => onToggle?.(it.id)}
                className={`w-full text-left flex items-start gap-3 p-2.5 rounded-lg border transition-all ${
                  done
                    ? 'bg-emerald-500/[0.08] border-emerald-500/25'
                    : isHighlight
                      ? 'bg-amber-500/[0.06] border-amber-500/25 hover:border-amber-500/40'
                      : 'bg-white/[0.03] border-white/[0.04] hover:border-white/[0.10] hover:bg-white/[0.05]'
                } active:scale-[0.99]`}
              >
                <span className="text-lg leading-none mt-0.5 shrink-0">{it.icon}</span>
                <span className={`text-sm leading-relaxed flex-1 ${done ? 'text-slate-400 line-through' : 'text-slate-200'}`}>
                  {it.label}
                </span>
                <span className={`shrink-0 mt-0.5 w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                  done ? 'bg-emerald-500 border-emerald-500' : 'border-white/15'
                }`}>
                  {done && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function VisionProgress({ vision, visited }) {
  const totals = useMemo(() => {
    const all = vision.categories.flatMap((c) => c.items);
    const done = all.filter((it) => visited[it.id]).length;
    return { done, total: all.length };
  }, [vision, visited]);
  const pct = totals.total ? Math.round((totals.done / totals.total) * 100) : 0;

  return (
    <div className="inline-flex items-center gap-2 bg-rose-500/[0.08] border border-rose-500/20 rounded-full pl-2.5 pr-3 py-1.5">
      <span className="text-xs">🌸</span>
      <span className="text-[11px] font-bold text-rose-300 tracking-wide">
        {totals.done} of {totals.total} lived
      </span>
      <div className="w-14 sm:w-20 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-rose-400 to-amber-400 transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
