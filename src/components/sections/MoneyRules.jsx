import { Wallet, ShieldCheck, PiggyBank, ListChecks, AlertTriangle } from 'lucide-react';
import { PageHeader, Card, Pill } from '../ui/Section.jsx';

const BUCKET_COLOR = {
  emerald: { bar: 'from-emerald-500 to-emerald-700', text: 'text-emerald-300', soft: 'bg-emerald-500/[0.06] border-emerald-500/15' },
  amber: { bar: 'from-amber-500 to-amber-700', text: 'text-amber-300', soft: 'bg-amber-500/[0.06] border-amber-500/15' },
};

export default function MoneyRules({ data }) {
  const { money } = data;

  return (
    <div className="space-y-8 pb-10">
      <PageHeader
        eyebrow="Capital Discipline"
        title={money.intro.title}
        subtitle={money.intro.subtitle}
        accent="amber"
      />

      {/* CAPITAL SPLIT */}
      <Card>
        <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
          <div className="flex items-center gap-2">
            <PiggyBank className="w-5 h-5 text-amber-300" />
            <h3 className="font-display text-lg font-extrabold">The capital: {money.capital.total}</h3>
          </div>
        </div>
        <p className="text-sm text-slate-400 leading-relaxed mb-4">{money.capital.note}</p>
        <div className="grid sm:grid-cols-2 gap-3">
          {money.capital.buckets.map((b, i) => {
            const c = BUCKET_COLOR[b.color] || BUCKET_COLOR.amber;
            return (
              <div key={i} className={`rounded-xl border p-4 ${c.soft}`}>
                <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                  <h4 className="font-bold text-sm">{b.label}</h4>
                  <div className={`font-display text-lg font-extrabold ${c.text}`}>{b.amount}</div>
                </div>
                <div className="w-full h-2 bg-white/[0.06] rounded-full overflow-hidden mb-2">
                  <div className={`h-full bg-gradient-to-r ${c.bar}`} style={{ width: b.pct.replace('~', '') }} />
                </div>
                <div className={`text-[11px] font-bold uppercase tracking-wider ${c.text} mb-1`}>{b.pct} of capital</div>
                <p className="text-xs text-slate-400 leading-relaxed">{b.use}</p>
              </div>
            );
          })}
        </div>
      </Card>

      {/* THE RULES */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <ShieldCheck className="w-5 h-5 text-emerald-300" />
          <h3 className="font-display text-lg font-extrabold">The rules</h3>
        </div>
        <div className="grid-auto-cards gap-3">
          {money.rules.map((r, i) => (
            <Card key={i}>
              <div className="text-3xl mb-3">{r.icon}</div>
              <h4 className="font-bold text-sm mb-2">{r.title}</h4>
              <p className="text-sm text-slate-400 leading-relaxed">{r.body}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* THE LESSON */}
      <div className="rounded-2xl p-5 sm:p-6 border border-rose-500/20 bg-gradient-to-br from-rose-500/[0.06] to-transparent">
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle className="w-5 h-5 text-rose-300" />
          <h3 className="font-display text-lg font-extrabold">{money.lesson.title}</h3>
        </div>
        <p className="text-sm text-slate-200 leading-relaxed">{money.lesson.body}</p>
      </div>

      {/* RECURRING CHECKS */}
      <Card>
        <div className="flex items-center gap-2 mb-3">
          <ListChecks className="w-5 h-5 text-sky-300" />
          <h3 className="font-display text-lg font-extrabold">Recurring checks</h3>
        </div>
        <ul className="space-y-2">
          {money.reviews.map((r, i) => (
            <li key={i} className="flex gap-2 text-sm text-slate-300 leading-relaxed"><span className="text-sky-400 mt-0.5">✓</span><span>{r}</span></li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
