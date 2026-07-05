import { useState, useMemo } from 'react';
import * as Icons from 'lucide-react';
import { Check, TrendingUp, Lightbulb, Globe2, Plus, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PageHeader, Card, Pill } from '../ui/Section.jsx';
import Flag from '../ui/Flag.jsx';
import { formatInr, formatRange } from '../../utils/format.js';

// Map each market id to a real SVG flag code (Windows can't render emoji flags).
const FLAG_CODE = {
  'in-t3': 'IN', 'in-t2': 'IN', 'in-t1': 'IN',
  'uae': 'AE', 'sg-apac': 'SG', 'us-ca': 'US', 'uk-eu': 'GB', 'eu': 'EU', 'au-nz': 'NZ',
};

export default function Pricing({ data }) {
  const { pricing } = data;
  const [marketId, setMarketId] = useState('uae');
  const [showInINR, setShowInINR] = useState(false);
  const market = useMemo(() => pricing.markets.find((m) => m.id === marketId), [marketId, pricing]);
  const cur = pricing.currencies[market.currency];

  function localFormat(amount) {
    if (amount == null) return '—';
    if (amount >= 1000) return `${cur.symbol}${(amount / 1000).toFixed(amount % 1000 === 0 ? 0 : 1)}k`;
    return `${cur.symbol}${amount.toLocaleString('en-US')}`;
  }
  function localRange(range) {
    if (!range) return '—';
    return `${localFormat(range.from)} – ${localFormat(range.to)}`;
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Money & Margins"
        title="Pricing — built for every market you'll work in"
        subtitle="Priced for every market you'll work in — starting with the UAE (your target market), plus India, Singapore, the US and Europe. Real 2026 data, quoted in local currency. Switch markets to see pricing."
        accent="amber"
      />

      {/* Market selector */}
      <Card className="!p-3 sticky top-0 z-10 backdrop-blur-md">
        <div className="flex items-center gap-2 flex-wrap">
          <Globe2 className="w-4 h-4 text-amber-300 ml-1 shrink-0" />
          <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mr-1 shrink-0">Market</span>
          <button
            onClick={() => setShowInINR((s) => !s)}
            className="ml-auto text-[10px] font-bold uppercase tracking-widest text-slate-400 px-3 py-1.5 rounded-lg border border-white/[0.08] transition-colors shrink-0"
          >
            {showInINR ? `Show ${market.currency}` : 'Show ₹'}
          </button>
          <div className="w-full overflow-x-auto -mx-1 px-1 mt-1">
            <div className="flex gap-1.5 flex-nowrap">
              {pricing.markets.map((m) => {
                const isActive = m.id === marketId;
                return (
                  <button
                    key={m.id}
                    onClick={() => setMarketId(m.id)}
                    className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                      isActive
                        ? 'bg-amber-500/15 border-amber-500/30 text-amber-100'
                        : 'border-white/[0.08] text-slate-300 hover:bg-white/[0.04] hover:text-slate-100'
                    }`}
                  >
                    <Flag code={FLAG_CODE[m.id]} className="w-5 h-[14px]" />
                    <span>{m.shortName}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </Card>

      {/* Market summary */}
      <motion.div
        key={market.id}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card>
          <div className="flex items-center gap-3 flex-wrap mb-3">
            <Flag code={FLAG_CODE[market.id]} className="w-9 h-6" />
            <div>
              <h2 className="font-display text-2xl font-extrabold leading-tight">{market.name}</h2>
              <div className="text-xs text-slate-400 mt-1">{market.tagline}</div>
            </div>
          </div>
          <div className="text-sm text-slate-400 mt-3">
            <span className="text-slate-500 uppercase tracking-wider text-[10px] font-bold">Cities · </span>
            <span>{market.cities}</span>
          </div>
          <div className="grid sm:grid-cols-2 gap-3 mt-5">
            <InfoBox icon={Icons.CreditCard} title="Payment terms" body={market.paymentTerms} color="emerald" />
            <InfoBox icon={Icons.Receipt} title="Tax / VAT" body={market.taxNote} color="violet" />
          </div>
          <div className="mt-5">
            <div className="text-[10px] font-bold uppercase tracking-widest text-amber-300 mb-2">Market intelligence</div>
            <ul className="space-y-1.5">
              {market.marketNotes.map((n, i) => (
                <li key={i} className="flex gap-2 text-sm text-slate-300 leading-relaxed">
                  <span className="text-amber-400 mt-1.5">▸</span><span>{n}</span>
                </li>
              ))}
            </ul>
          </div>
        </Card>
      </motion.div>

      {/* Philosophy */}
      <Card>
        <div className="flex items-center gap-2 mb-3">
          <Lightbulb className="w-5 h-5 text-amber-300" />
          <h3 className="font-display text-lg font-extrabold">Pricing philosophy</h3>
        </div>
        <ul className="space-y-2">
          {pricing.philosophy.map((p, i) => (
            <li key={i} className="flex gap-2 text-sm text-slate-300 leading-relaxed">
              <span className="text-amber-400 mt-1">●</span><span>{p}</span>
            </li>
          ))}
        </ul>
      </Card>

      {/* Project packages */}
      <section>
        <h3 className="font-display text-xl font-extrabold mb-1">Project packages — {market.shortName}</h3>
        <p className="text-sm text-slate-500 mb-5">Starting prices. Final quote based on scope, timeline, and revisions needed.</p>
        <div className="grid lg:grid-cols-2 gap-4">
          {market.packages.map((p) => (
            <PackageCard
              key={p.id}
              pkg={p}
              localFormat={localFormat}
              localRange={localRange}
              showInINR={showInINR}
              currency={market.currency}
            />
          ))}
        </div>
      </section>

      {/* Care plans */}
      <section>
        <h3 className="font-display text-xl font-extrabold mb-1">Care plans (recurring)</h3>
        <p className="text-sm text-slate-500 mb-5">Every project upsells to one of these. Recurring is the base.</p>
        <div className="grid-auto-cards-sm gap-3">
          {market.carePlans.map((p) => (
            <Card key={p.id}>
              <h4 className="font-bold text-sm">{p.name}</h4>
              <div className="font-display text-xl font-extrabold gold-text mt-2">
                {showInINR ? formatInr(p.priceInr) : localFormat(p.priceLocal)}
                <span className="text-xs font-normal text-slate-400">/mo</span>
              </div>
              {!showInINR && p.priceInr && (
                <div className="text-[11px] text-slate-500 mt-0.5">≈ {formatInr(p.priceInr)}/mo</div>
              )}
              <ul className="mt-3 space-y-1.5">
                {p.includes.map((it, i) => (
                  <li key={i} className="flex gap-2 text-[11px] text-slate-300 leading-relaxed">
                    <Check className="w-3 h-3 text-emerald-400 mt-0.5 shrink-0" /><span>{it}</span>
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      </section>

      {/* Add-ons */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Plus className="w-5 h-5 text-violet-300" />
          <h3 className="font-display text-xl font-extrabold">Add-ons (a la carte)</h3>
        </div>
        <p className="text-sm text-slate-500 mb-5">Mix and match with any package. Expand the deal size, raise the average.</p>
        <div className="grid-auto-cards-sm gap-2">
          {pricing.addOns.map((a, i) => (
            <div key={i} className="flex items-center justify-between p-3 bg-ink-800/60 border border-white/[0.06] rounded-xl">
              <span className="text-sm text-slate-200">{a.name}</span>
              <span className="font-display text-sm font-extrabold gold-text whitespace-nowrap ml-3">
                {market.currency === 'INR' ? formatInr(a.priceInr) : `${pricing.currencies[market.currency].symbol}${a.priceUsd}`}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Price-raise rules */}
      <Card>
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="w-5 h-5 text-emerald-300" />
          <h3 className="font-display text-lg font-extrabold">Price-raise rules</h3>
        </div>
        <div className="space-y-2">
          {pricing.raiseRules.map((r, i) => (
            <div key={i} className="flex items-center gap-3 p-3 bg-white/[0.03] rounded-lg border border-white/[0.06]">
              <div className="text-[10px] uppercase tracking-widest text-emerald-300 font-bold w-1/3 shrink-0">{r.trigger}</div>
              <div className="text-sm text-slate-200 flex-1">→ {r.action}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* T&C */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Icons.ScrollText className="w-5 h-5 text-rose-300" />
          <h3 className="font-display text-xl font-extrabold">Standard Terms & Conditions</h3>
        </div>
        <p className="text-sm text-slate-500 mb-5">These ride along with every quote. Click any to expand.</p>
        <div className="space-y-2">
          {pricing.termsAndConditions.map((t) => <TermBlock key={t.id} term={t} />)}
        </div>
      </section>
    </div>
  );
}

function PackageCard({ pkg, localFormat, localRange, showInINR, currency }) {
  return (
    <Card className={pkg.featured ? '!border-amber-500/30 bg-gradient-to-br from-amber-500/[0.04] to-transparent' : ''}>
      {pkg.featured && <Pill color="amber">⭐ Bread & Butter</Pill>}
      <h4 className="font-display text-xl font-extrabold mt-2">{pkg.name}</h4>
      <div className="text-xs text-slate-400 mt-1">{pkg.tagline}</div>
      <div className="mt-4 flex flex-wrap items-baseline gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Starting at</span>
        <div className="font-display text-2xl font-extrabold gold-text">
          {showInINR ? formatInr(pkg.priceInr.from) : localFormat(pkg.priceLocal.from)}
        </div>
        {!showInINR && currency !== 'INR' && (
          <div className="text-xs text-slate-400">≈ {formatInr(pkg.priceInr.from)}</div>
        )}
      </div>
      <div className="text-[11px] text-slate-500 mt-1">Final quote after discovery · scope-based · Timeline: {pkg.timeline} · {pkg.revisions} revision rounds</div>
      <div className="text-[11px] text-slate-500 mt-0.5">Stack: {pkg.tools}</div>

      <div className="mt-4">
        <div className="text-[10px] font-bold uppercase tracking-widest text-emerald-300 mb-1.5">Ideal for</div>
        <div className="text-sm text-slate-300 leading-relaxed">{pkg.idealFor}</div>
      </div>

      <div className="mt-4">
        <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Includes</div>
        <ul className="space-y-1.5">
          {pkg.includes.map((it, i) => (
            <li key={i} className="flex gap-2 text-[13px] text-slate-300 leading-relaxed">
              <Check className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
              <span>{it}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-4 pt-4 border-t border-white/[0.06] text-xs text-slate-500">
        <span className="text-amber-300 font-semibold">Care upsell:</span> {pkg.careUpsell}
      </div>
    </Card>
  );
}

function TermBlock({ term }) {
  const [open, setOpen] = useState(false);
  const Icon = Icons[term.icon] || Icons.FileText;
  return (
    <Card className="!p-0 overflow-hidden">
      <button onClick={() => setOpen((o) => !o)} className="w-full flex items-center gap-3 p-4 text-left hover:bg-white/[0.02] transition-colors">
        <div className="w-9 h-9 rounded-lg bg-rose-500/10 text-rose-300 flex items-center justify-center shrink-0">
          <Icon className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-sm">{term.title}</h4>
        </div>
        <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <div className="px-4 pb-4 pt-1 border-t border-white/[0.06]">
              <ul className="space-y-1.5 mt-3">
                {term.body.map((b, i) => (
                  <li key={i} className="flex gap-2 text-sm text-slate-300 leading-relaxed">
                    <span className="text-rose-400 mt-1.5 text-xs">▸</span><span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}

function InfoBox({ icon: Icon, title, body, color = 'amber' }) {
  const colorMap = { amber: 'bg-amber-500/[0.06] border-amber-500/15 text-amber-300', emerald: 'bg-emerald-500/[0.06] border-emerald-500/15 text-emerald-300', violet: 'bg-violet-500/[0.06] border-violet-500/15 text-violet-300' };
  return (
    <div className={`rounded-xl border p-3 ${colorMap[color]}`}>
      <div className="flex items-center gap-2 mb-1.5">
        <Icon className="w-3.5 h-3.5" />
        <div className="text-[10px] font-bold uppercase tracking-widest">{title}</div>
      </div>
      <div className="text-xs text-slate-300 leading-relaxed">{body}</div>
    </div>
  );
}
