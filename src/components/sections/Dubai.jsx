import { Globe2, Building2, Wallet, MapPin, Rocket, Package, ShieldAlert, Plane } from 'lucide-react';
import { PageHeader, Card, Pill } from '../ui/Section.jsx';

export default function Dubai({ data }) {
  const { dubai } = data;

  return (
    <div className="space-y-8 pb-10">
      <PageHeader
        eyebrow="Global Expansion"
        title={dubai.intro.title}
        subtitle={dubai.intro.subtitle}
        accent="amber"
      />

      {/* WHY DUBAI + WHY A COMPANY */}
      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <div className="flex items-center gap-2 mb-3">
            <Globe2 className="w-5 h-5 text-emerald-300" />
            <h3 className="font-display text-lg font-extrabold">Why Dubai</h3>
          </div>
          <ul className="space-y-2">
            {dubai.why.map((w, i) => (
              <li key={i} className="flex gap-2 text-sm text-slate-300 leading-relaxed"><span className="text-emerald-400 mt-0.5">▸</span><span>{w}</span></li>
            ))}
          </ul>
        </Card>
        <Card>
          <div className="flex items-center gap-2 mb-3">
            <Building2 className="w-5 h-5 text-sky-300" />
            <h3 className="font-display text-lg font-extrabold">Why register a company</h3>
          </div>
          <ul className="space-y-2">
            {dubai.whyCompany.map((w, i) => (
              <li key={i} className="flex gap-2 text-sm text-slate-300 leading-relaxed"><span className="text-sky-400 mt-0.5">▸</span><span>{w}</span></li>
            ))}
          </ul>
        </Card>
      </div>

      {/* THE MONEY REALITY */}
      <Card className="!border-amber-500/25 bg-gradient-to-br from-amber-500/[0.06] to-transparent">
        <div className="flex items-center gap-2 mb-3">
          <Wallet className="w-5 h-5 text-amber-300" />
          <h3 className="font-display text-lg font-extrabold">The honest money picture</h3>
        </div>
        <div className="grid sm:grid-cols-2 gap-3 mb-3">
          <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3">
            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Setup</div>
            <div className="text-sm text-slate-200 leading-relaxed">{dubai.costs.setup}</div>
          </div>
          <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3">
            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Living / month</div>
            <div className="text-sm text-slate-200 leading-relaxed">{dubai.costs.living}</div>
          </div>
        </div>
        <div className="rounded-xl bg-amber-500/[0.06] border border-amber-500/20 p-3 text-sm text-slate-200 leading-relaxed">
          <span className="text-amber-300 font-bold">Reality: </span>{dubai.costs.reality}
        </div>
      </Card>

      {/* FREE ZONES */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <MapPin className="w-5 h-5 text-violet-300" />
          <h3 className="font-display text-lg font-extrabold">Free-zone options (2026)</h3>
        </div>
        <div className="grid-auto-cards gap-3">
          {dubai.freeZones.map((z, i) => (
            <Card key={i}>
              <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
                <h4 className="font-bold text-sm">{z.name}</h4>
                <Pill color="violet">{z.cost}</Pill>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed mt-1">{z.note}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* PHASED PLAN */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Rocket className="w-5 h-5 text-emerald-300" />
          <h3 className="font-display text-lg font-extrabold">The capital-safe rollout</h3>
        </div>
        <div className="grid-auto-cards gap-3">
          {dubai.phases.map((p, i) => (
            <Card key={i}>
              <Pill color="emerald">{p.tag}</Pill>
              <h4 className="font-bold text-sm mt-3 mb-2">{p.title}</h4>
              <ul className="space-y-1.5">
                {p.items.map((it, j) => (
                  <li key={j} className="flex gap-2 text-[13px] text-slate-300 leading-relaxed"><span className="text-emerald-400 mt-0.5">▸</span><span>{it}</span></li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      </section>

      {/* PRODUCT */}
      <Card>
        <div className="flex items-center gap-2 mb-3">
          <Package className="w-5 h-5 text-amber-300" />
          <h3 className="font-display text-lg font-extrabold">{dubai.product.title}</h3>
        </div>
        <p className="text-sm text-slate-300 leading-relaxed mb-4">{dubai.product.idea}</p>
        <div className="grid sm:grid-cols-3 gap-2 mb-4">
          {dubai.product.build.map((b, i) => (
            <div key={i} className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3 text-[13px] text-slate-300 leading-relaxed">{b}</div>
          ))}
        </div>
        <div className="rounded-xl bg-emerald-500/[0.05] border border-emerald-500/15 p-3 text-sm text-slate-200 leading-relaxed mb-2">
          <span className="text-emerald-300 font-bold">Pricing: </span>{dubai.product.pricing}
        </div>
        <div className="rounded-xl bg-rose-500/[0.05] border border-rose-500/15 p-3 text-sm text-slate-200 leading-relaxed">
          <span className="text-rose-300 font-bold">Don’t build yet: </span>{dubai.product.dontBuildYet}
        </div>
      </Card>

      {/* SETTLEMENT NOTE */}
      <div className="rounded-2xl p-5 border border-sky-500/15 bg-sky-500/[0.04]">
        <div className="flex items-center gap-2 mb-2">
          <Plane className="w-5 h-5 text-sky-300" />
          <h3 className="font-display text-base font-extrabold">Dubai vs long-term settlement</h3>
        </div>
        <p className="text-sm text-slate-300 leading-relaxed">{dubai.settlement}</p>
      </div>

      {/* CAUTIONS */}
      <Card className="!border-rose-500/15 bg-gradient-to-br from-rose-500/[0.04] to-transparent">
        <div className="flex items-center gap-2 mb-3">
          <ShieldAlert className="w-5 h-5 text-rose-300" />
          <h3 className="font-display text-lg font-extrabold">Keep these honest guardrails</h3>
        </div>
        <ul className="space-y-2">
          {dubai.cautions.map((c, i) => (
            <li key={i} className="flex gap-2 text-sm text-slate-300 leading-relaxed"><span className="text-rose-400 mt-0.5">●</span><span>{c}</span></li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
