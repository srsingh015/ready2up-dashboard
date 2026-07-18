import {
  Compass, Plane, TrendingUp, Calculator, AlertTriangle,
  ListChecks, Users, IdCard, Layers, ShieldAlert,
  GitBranch, Handshake,
} from 'lucide-react';
import { PageHeader, Card, Pill } from '../ui/Section.jsx';

// Static maps so Tailwind's JIT keeps these classes (no dynamic string building)
const BULLET = {
  amber: 'text-amber-400', sky: 'text-sky-400', emerald: 'text-emerald-400',
  violet: 'text-violet-400', rose: 'text-rose-400',
};
const VALUE = {
  amber: 'text-amber-300', sky: 'text-sky-300', emerald: 'text-emerald-300',
  violet: 'text-violet-300', rose: 'text-rose-300',
};

export default function Settle({ data }) {
  const { settle } = data;

  return (
    <div className="space-y-8 pb-10">
      <PageHeader
        eyebrow="The Big Plan"
        title={settle.intro.title}
        subtitle={settle.intro.subtitle}
      />

      {/* BIG IDEA */}
      <Card className="!border-amber-500/25 bg-gradient-to-br from-amber-500/[0.07] to-transparent">
        <div className="flex items-center gap-2 mb-2">
          <Compass className="w-5 h-5 text-amber-300" />
          <h3 className="font-display text-lg font-extrabold">The whole plan in one line</h3>
        </div>
        <p className="text-[15px] text-slate-200 leading-relaxed">{settle.bigIdea}</p>
      </Card>

      {/* TWO PHASES */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Layers className="w-5 h-5 text-emerald-300" />
          <h3 className="font-display text-lg font-extrabold">Two phases, in order</h3>
        </div>
        <div className="grid lg:grid-cols-2 gap-4">
          {settle.phases.map((p, i) => (
            <Card key={i}>
              <Pill color={p.color}>{p.tag}</Pill>
              <h4 className="font-display text-base font-extrabold mt-3 mb-3">{p.title}</h4>
              <ul className="space-y-2">
                {p.points.map((pt, j) => (
                  <li key={j} className="flex gap-2 text-[13px] text-slate-300 leading-relaxed">
                    <span className={`mt-0.5 ${BULLET[p.color]}`}>▸</span><span>{pt}</span>
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      </section>

      {/* THE PROFIT MATH */}
      <Card className="!border-amber-500/25 bg-gradient-to-br from-amber-500/[0.06] to-transparent">
        <div className="flex items-center gap-2 mb-4">
          <Calculator className="w-5 h-5 text-amber-300" />
          <h3 className="font-display text-lg font-extrabold">{settle.math.headline}</h3>
        </div>
        <div className="space-y-2 mb-4">
          {settle.math.rows.map((r, i) => (
            <div key={i} className="flex items-center justify-between gap-3 rounded-xl bg-white/[0.03] border border-white/[0.06] px-3 py-2.5">
              <span className="text-[13px] text-slate-300 leading-snug">{r.label}</span>
              <span className="text-[13px] font-bold text-amber-300 shrink-0 text-right">{r.value}</span>
            </div>
          ))}
        </div>
        <div className="rounded-xl bg-rose-500/[0.05] border border-rose-500/15 p-3 text-sm text-slate-200 leading-relaxed">
          <span className="text-rose-300 font-bold">Margin truth: </span>{settle.math.marginTruth}
        </div>
      </Card>

      {/* TWO TRACKS */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <GitBranch className="w-5 h-5 text-amber-300" />
          <h3 className="font-display text-lg font-extrabold">{settle.tracks.title}</h3>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          {settle.tracks.list.map((t, i) => (
            <Card key={i}>
              <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                <h4 className="font-display text-base font-extrabold">{t.name}</h4>
                <Pill color={t.color}>{t.badge}</Pill>
              </div>
              <div className={`font-display text-lg font-extrabold mb-2 ${VALUE[t.color]}`}>{t.profit}</div>
              <p className="text-[13px] text-slate-400 leading-relaxed">{t.what}</p>
            </Card>
          ))}
        </div>
        <div className="rounded-xl bg-amber-500/[0.06] border border-amber-500/20 p-3 text-sm text-slate-200 leading-relaxed mt-3">
          <span className="text-amber-300 font-bold">Bottom line: </span>{settle.tracks.verdict}
        </div>
      </section>

      {/* VOLUME TRAP */}
      <Card className="!border-rose-500/20 bg-gradient-to-br from-rose-500/[0.05] to-transparent">
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle className="w-5 h-5 text-rose-300" />
          <h3 className="font-display text-lg font-extrabold">{settle.volumeTrap.title}</h3>
        </div>
        <ul className="space-y-2">
          {settle.volumeTrap.points.map((pt, i) => (
            <li key={i} className="flex gap-2 text-sm text-slate-300 leading-relaxed"><span className="text-rose-400 mt-0.5">▸</span><span>{pt}</span></li>
          ))}
        </ul>
      </Card>

      {/* OFFER LADDER */}
      <section>
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp className="w-5 h-5 text-sky-300" />
          <h3 className="font-display text-lg font-extrabold">{settle.offerLadder.title}</h3>
        </div>
        <p className="text-[13px] text-slate-400 leading-relaxed mb-3">{settle.offerLadder.note}</p>
        <div className="space-y-2">
          {settle.offerLadder.tiers.map((t, i) => (
            <div key={i} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 rounded-xl bg-white/[0.03] border border-white/[0.06] px-4 py-3">
              <div className="sm:w-44 shrink-0">
                <div className="font-bold text-sm text-slate-100">{t.tier}</div>
                <div className={`text-[12px] font-semibold ${VALUE[t.color]}`}>{t.price}</div>
              </div>
              <div className="text-[13px] text-slate-400 leading-relaxed">{t.role}</div>
            </div>
          ))}
        </div>
      </section>

      {/* BUILD PARTNER */}
      <Card className="!border-sky-500/20 bg-gradient-to-br from-sky-500/[0.05] to-transparent">
        <div className="flex items-center gap-2 mb-2">
          <Handshake className="w-5 h-5 text-sky-300" />
          <h3 className="font-display text-lg font-extrabold">{settle.partner.title}</h3>
        </div>
        <p className="text-sm text-slate-300 leading-relaxed mb-3">{settle.partner.context}</p>
        <ul className="space-y-2">
          {settle.partner.thoughts.map((t, i) => (
            <li key={i} className="flex gap-2 text-[13px] text-slate-300 leading-relaxed"><span className="text-sky-400 mt-0.5">▸</span><span>{t}</span></li>
          ))}
        </ul>
      </Card>

      {/* SELL-THROUGH BLUEPRINT */}
      <section>
        <div className="flex items-center gap-2 mb-2">
          <ListChecks className="w-5 h-5 text-emerald-300" />
          <h3 className="font-display text-lg font-extrabold">{settle.blueprint.title}</h3>
        </div>
        <p className="text-[13px] text-slate-400 leading-relaxed mb-3">{settle.blueprint.note}</p>
        <Card hover={false} className="!p-0 overflow-hidden">
          {/* header row */}
          <div className="hidden sm:grid grid-cols-[2.5fr_1fr_1fr_1fr] gap-2 px-4 py-2.5 bg-white/[0.03] border-b border-white/[0.06] text-[10px] font-bold uppercase tracking-widest text-slate-500">
            <span>Product line</span><span className="text-right">Price</span><span className="text-right">Qty (2 yrs)</span><span className="text-right">Sales</span>
          </div>
          {settle.blueprint.lines.map((l, i) => (
            <div key={i} className="grid grid-cols-2 sm:grid-cols-[2.5fr_1fr_1fr_1fr] gap-x-2 gap-y-1 px-4 py-3 border-b border-white/[0.04] text-[13px]">
              <span className="col-span-2 sm:col-span-1 text-slate-200 font-medium">{l.line}</span>
              <span className="text-slate-400 sm:text-right"><span className="sm:hidden text-slate-500">Price: </span>{l.price}</span>
              <span className="text-slate-400 sm:text-right"><span className="sm:hidden text-slate-500">Qty: </span>{l.qty}</span>
              <span className="text-emerald-300 font-bold sm:text-right">{l.total}</span>
            </div>
          ))}
          <div className="px-4 py-3 bg-emerald-500/[0.06] text-sm font-bold text-emerald-300 text-right">
            {settle.blueprint.total}
          </div>
        </Card>
        <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3 text-[13px] text-slate-300 leading-relaxed mt-3">
          <span className="text-slate-100 font-bold">Reality of scale: </span>{settle.blueprint.scale}
        </div>
      </section>

      {/* YEAR RAMP */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="w-5 h-5 text-amber-300" />
          <h3 className="font-display text-lg font-extrabold">The 2-year ramp</h3>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          {settle.ramp.map((r, i) => (
            <Card key={i}>
              <Pill color={r.color}>{r.year}</Pill>
              <div className="flex items-baseline gap-3 mt-3 mb-1">
                <span className={`font-display text-2xl font-extrabold ${VALUE[r.color]}`}>{r.sales}</span>
              </div>
              <div className="text-sm font-bold text-slate-200 mb-2">{r.profit}</div>
              <p className="text-[13px] text-slate-400 leading-relaxed">{r.focus}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* TEAM */}
      <Card>
        <div className="flex items-center gap-2 mb-3">
          <Users className="w-5 h-5 text-sky-300" />
          <h3 className="font-display text-lg font-extrabold">{settle.team.title}</h3>
        </div>
        <ul className="space-y-2 mb-3">
          {settle.team.roles.map((r, i) => (
            <li key={i} className="flex gap-2 text-sm text-slate-300 leading-relaxed"><span className="text-sky-400 mt-0.5">▸</span><span>{r}</span></li>
          ))}
        </ul>
        <div className="rounded-xl bg-sky-500/[0.05] border border-sky-500/15 p-3 text-[13px] text-slate-200 leading-relaxed">
          {settle.team.note}
        </div>
      </Card>

      {/* UAE VISA LADDER */}
      <section>
        <div className="flex items-center gap-2 mb-2">
          <IdCard className="w-5 h-5 text-violet-300" />
          <h3 className="font-display text-lg font-extrabold">{settle.visaLadder.title}</h3>
        </div>
        <p className="text-[13px] text-slate-400 leading-relaxed mb-3">{settle.visaLadder.intro}</p>
        <div className="grid-auto-cards gap-3">
          {settle.visaLadder.options.map((o, i) => (
            <Card key={i}>
              <div className="flex items-center gap-2 mb-2">
                <span className="shrink-0 w-6 h-6 rounded-full bg-white/[0.06] text-slate-300 text-xs font-bold flex items-center justify-center">{i + 1}</span>
                <h4 className="font-bold text-sm">{o.name}</h4>
              </div>
              <Pill color={o.color}>{o.cost}</Pill>
              <p className="text-[13px] text-slate-300 leading-relaxed mt-3"><span className="text-emerald-300 font-semibold">Good: </span>{o.best}</p>
              <p className="text-[13px] text-slate-400 leading-relaxed mt-1.5"><span className="text-rose-300 font-semibold">Limit: </span>{o.limit}</p>
            </Card>
          ))}
        </div>
        <div className="rounded-xl bg-violet-500/[0.06] border border-violet-500/20 p-3 text-sm text-slate-200 leading-relaxed mt-3">
          <span className="text-violet-300 font-bold">Smart order: </span>{settle.visaLadder.recommendation}
        </div>
      </section>

      {/* SETTLEMENT SHORTLIST */}
      <section>
        <div className="flex items-center gap-2 mb-2">
          <Plane className="w-5 h-5 text-sky-300" />
          <h3 className="font-display text-lg font-extrabold">{settle.destinations.title}</h3>
        </div>
        <p className="text-[13px] text-slate-400 leading-relaxed mb-3">{settle.destinations.intro}</p>
        <div className="grid-auto-cards gap-3">
          {settle.destinations.list.map((d, i) => (
            <Card key={i}>
              <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
                <h4 className="font-display text-base font-extrabold">{d.name}</h4>
                <Pill color={d.color}>#{d.rank}</Pill>
              </div>
              <div className="text-[11px] font-bold uppercase tracking-wide text-slate-500 mb-3">{d.tag}</div>
              <div className="space-y-1.5 mb-3">
                <Row label="Living" value={d.living} />
                <Row label="Path" value={d.path} />
              </div>
              <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3 text-[13px] text-slate-300 leading-relaxed">
                {d.fit}
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* GUARDRAILS */}
      <Card className="!border-rose-500/15 bg-gradient-to-br from-rose-500/[0.04] to-transparent">
        <div className="flex items-center gap-2 mb-3">
          <ShieldAlert className="w-5 h-5 text-rose-300" />
          <h3 className="font-display text-lg font-extrabold">Honest guardrails</h3>
        </div>
        <ul className="space-y-2">
          {settle.guardrails.map((g, i) => (
            <li key={i} className="flex gap-2 text-sm text-slate-300 leading-relaxed"><span className="text-rose-400 mt-0.5">●</span><span>{g}</span></li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex gap-2 text-[12px] leading-relaxed">
      <span className="text-slate-500 font-semibold uppercase tracking-wide shrink-0 w-14">{label}</span>
      <span className="text-slate-300">{value}</span>
    </div>
  );
}
