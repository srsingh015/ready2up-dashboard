import { useState } from 'react';
import * as Icons from 'lucide-react';
import { Calendar, Sun, CalendarDays, CalendarRange } from 'lucide-react';
import { PageHeader, Card, Pill } from '../ui/Section.jsx';

const TABS = [
  { id: 'daily', label: 'Daily', icon: Sun },
  { id: 'weekly', label: 'Weekly', icon: CalendarDays },
  { id: 'monthly', label: 'Monthly', icon: CalendarRange },
];

const COLOR = {
  amber: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
  sky: 'bg-sky-500/10 text-sky-300 border-sky-500/20',
  violet: 'bg-violet-500/10 text-violet-300 border-violet-500/20',
  emerald: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
  rose: 'bg-rose-500/10 text-rose-300 border-rose-500/20',
};

export default function Rhythm({ data }) {
  const { dailyRoutine, weeklyRhythm, monthlyRhythm } = data;
  const [tab, setTab] = useState('daily');

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Operating Rhythm"
        title="Same shape, every day. Same shape, every week."
        subtitle="When the structure is fixed, willpower is never required. This is the operating rhythm we run for 24 months — without exception."
        accent="emerald"
      />

      <div className="flex gap-2 p-1 bg-ink-800/60 rounded-xl border border-white/[0.06] inline-flex">
        {TABS.map((t) => {
          const Ico = t.icon;
          const isActive = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                isActive ? 'bg-amber-500/15 text-amber-200' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Ico className="w-4 h-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === 'daily' && <DailyView routine={dailyRoutine} />}
      {tab === 'weekly' && <WeeklyView weekly={weeklyRhythm} />}
      {tab === 'monthly' && <MonthlyView monthly={monthlyRhythm} />}
    </div>
  );
}

function DailyView({ routine }) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-400 leading-relaxed max-w-2xl">{routine.description}</p>
      {routine.blocks.map((b, i) => {
        const Icon = Icons[b.icon] || Icons.Sun;
        return (
          <Card key={i}>
            <div className="flex items-start gap-3 mb-2 flex-wrap">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border ${COLOR[b.color] || COLOR.amber}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-bold text-base sm:text-lg">{b.title}</h3>
                  <Pill color={b.color}>{b.time}</Pill>
                </div>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">{b.whyFirst}</p>
              </div>
            </div>
            <ul className="mt-4 space-y-2 ml-1">
              {b.tasks.map((t, j) => (
                <li key={j} className="flex gap-2 text-sm text-slate-300 leading-relaxed">
                  <span className="text-amber-400 mt-1">●</span>
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </Card>
        );
      })}
    </div>
  );
}

function WeeklyView({ weekly }) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-400 leading-relaxed max-w-2xl">{weekly.description}</p>
      <div className="grid sm:grid-cols-2 gap-3">
        {weekly.days.map((d, i) => (
          <Card key={i}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-base">{d.day}</h3>
              <Pill color={d.color}>{d.theme}</Pill>
            </div>
            <ul className="space-y-1.5">
              {d.tasks.map((t, j) => (
                <li key={j} className="flex gap-2 text-sm text-slate-300 leading-relaxed">
                  <span className="text-amber-400 mt-1.5 text-xs">▸</span>
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </div>
    </div>
  );
}

function MonthlyView({ monthly }) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-400 leading-relaxed max-w-2xl">{monthly.description}</p>
      <Card>
        <div className="space-y-2">
          {monthly.cadence.map((c, i) => (
            <div key={i} className="flex gap-4 items-start py-3 border-b border-white/[0.05] last:border-0">
              <div className="text-xs font-bold text-amber-300 uppercase tracking-wider w-16 shrink-0 pt-0.5">{c.day}</div>
              <div className="text-sm text-slate-300 leading-relaxed flex-1">{c.what}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
