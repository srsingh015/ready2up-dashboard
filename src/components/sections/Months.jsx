import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, AlertTriangle, Target, ListTodo, GitBranch } from 'lucide-react';
import { PageHeader, Card, Pill } from '../ui/Section.jsx';
import { formatInr } from '../../utils/format.js';

const PHASE_COLOR = { p0: 'rose', p1: 'violet', p2: 'sky', p3: 'amber', p4: 'emerald' };

export default function Months({ data, role }) {
  const { months, roadmap } = data;
  const [active, setActive] = useState(1);
  const month = months[active - 1];
  const phase = roadmap.find((p) => p.id === month.phase);
  const phaseColor = PHASE_COLOR[month.phase];
  const redactMoney = role && role !== 'owner';
  const visibleKpis = redactMoney
    ? (month.kpis || []).filter((k) => !(typeof k.target === 'number' && k.target > 1000))
    : (month.kpis || []);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="The Operating Plan"
        title="Monthly plans, week by week"
        subtitle="What to do, when, and why — for each of the 24 months. Every month has a theme, weekly actions, KPIs, risks, and the decisions to make."
        accent="amber"
      />

      <MonthPicker active={active} setActive={setActive} months={months} />

      <Card>
        <div className="flex flex-wrap items-start justify-between gap-3 mb-2">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Pill color={phaseColor}>Phase: {phase?.title}</Pill>
              <Pill color="slate">Month {month.n}</Pill>
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-extrabold leading-tight">{month.title}</h2>
            <p className="text-sm text-slate-400 mt-2 max-w-2xl leading-relaxed">{month.theme}</p>
          </div>
          {!redactMoney && (
            <div className="text-right shrink-0">
              <div className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Revenue Target</div>
              <div className="font-display text-xl font-extrabold gold-text whitespace-nowrap">{formatInr(month.revenueTargetInr.from)} – {formatInr(month.revenueTargetInr.to)}</div>
              {month.mrrTargetInr ? (
                <div className="text-[11px] text-slate-500 mt-1">MRR target: {formatInr(month.mrrTargetInr)}/mo</div>
              ) : null}
            </div>
          )}
        </div>

        <div className="grid sm:grid-cols-3 gap-3 mt-5">
          {month.topOutcomes.map((o, i) => (
            <div key={i} className="rounded-xl bg-emerald-500/[0.05] border border-emerald-500/15 p-4">
              <div className="text-[10px] font-bold uppercase tracking-widest text-emerald-300 mb-1.5">Top Outcome {i + 1}</div>
              <div className="text-sm text-slate-200 leading-relaxed">{o}</div>
            </div>
          ))}
        </div>
      </Card>

      <section>
        <div className="flex items-center gap-2 mb-3">
          <ListTodo className="w-5 h-5 text-amber-300" />
          <h3 className="font-display text-lg font-extrabold">Weekly breakdown</h3>
        </div>
        <div className="space-y-3">
          {month.weeks.map((w) => (
            <Card key={w.week}>
              <div className="flex items-center gap-3 mb-3 flex-wrap">
                <div className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-amber-500/10 text-amber-300 font-extrabold text-sm">W{w.week}</div>
                <div className="font-bold text-sm">{w.focus}</div>
              </div>
              <ul className="space-y-2 ml-1">
                {w.actions.map((a, i) => (
                  <li key={i} className="flex gap-2 text-sm text-slate-300 leading-relaxed">
                    <span className="text-amber-400 mt-1">●</span>
                    <span>{a}</span>
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      </section>

      <section className="grid sm:grid-cols-2 gap-4">
        {visibleKpis.length > 0 && (
          <Card>
            <div className="flex items-center gap-2 mb-3">
              <Target className="w-4 h-4 text-emerald-300" />
              <h3 className="text-sm font-bold uppercase tracking-widest text-emerald-300">KPIs to hit</h3>
            </div>
            <div className="space-y-2">
              {visibleKpis.map((k, i) => (
                <div key={i} className="flex items-center justify-between p-2.5 bg-white/[0.03] rounded-lg border border-white/[0.06]">
                  <span className="text-sm text-slate-300">{k.label}</span>
                  <span className="font-display text-sm font-extrabold gold-text">
                    {typeof k.target === 'number' && k.target > 1000 ? formatInr(k.target) : k.target}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        )}
        <div className="space-y-4">
          {month.risks && month.risks.length > 0 && (
            <Card>
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                <h3 className="text-sm font-bold uppercase tracking-widest text-rose-300">Risks to watch</h3>
              </div>
              <ul className="space-y-2">
                {month.risks.map((r, i) => (
                  <li key={i} className="flex gap-2 text-sm text-slate-300 leading-relaxed">
                    <span className="text-rose-400 mt-1">⛔</span><span>{r}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}
          {month.decisionsToMake && month.decisionsToMake.length > 0 && (
            <Card>
              <div className="flex items-center gap-2 mb-3">
                <GitBranch className="w-4 h-4 text-violet-300" />
                <h3 className="text-sm font-bold uppercase tracking-widest text-violet-300">Decisions to make</h3>
              </div>
              <ul className="space-y-2">
                {month.decisionsToMake.map((d, i) => (
                  <li key={i} className="flex gap-2 text-sm text-slate-300 leading-relaxed">
                    <span className="text-violet-400 mt-1">⚡</span><span>{d}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      </section>
    </div>
  );
}

function MonthPicker({ active, setActive, months }) {
  return (
    <Card className="!p-3 sticky top-0 z-10 backdrop-blur-md">
      <div className="flex items-center gap-2">
        <button
          onClick={() => setActive(Math.max(1, active - 1))}
          disabled={active === 1}
          className="p-2 rounded-lg hover:bg-white/[0.05] disabled:opacity-30 disabled:cursor-not-allowed"
          aria-label="Previous month"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div className="flex-1 overflow-x-auto">
          <div className="flex gap-1.5 min-w-max">
            {months.map((m) => {
              const isActive = m.n === active;
              const phaseColor = PHASE_COLOR[m.phase];
              return (
                <button
                  key={m.n}
                  onClick={() => setActive(m.n)}
                  className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                    isActive
                      ? `bg-${phaseColor}-500/15 border-${phaseColor}-500/30 text-${phaseColor}-200`
                      : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
                  }`}
                >
                  M{m.n}
                </button>
              );
            })}
          </div>
        </div>
        <button
          onClick={() => setActive(Math.min(24, active + 1))}
          disabled={active === 24}
          className="p-2 rounded-lg hover:bg-white/[0.05] disabled:opacity-30 disabled:cursor-not-allowed"
          aria-label="Next month"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </Card>
  );
}
