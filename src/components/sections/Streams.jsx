import * as Icons from 'lucide-react';
import { motion } from 'framer-motion';
import { Card, PageHeader, Pill } from '../ui/Section.jsx';
import { formatInr } from '../../utils/format.js';

const TYPE_COLOR = { now: 'emerald', soon: 'amber', later: 'violet' };

export default function Streams({ data }) {
  const { streams } = data;
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Income Engine"
        title="Income streams — in strict order"
        subtitle="One engine first. Master it. Then add the next. Spreading thin is exactly how the last attempt drained money — we are not doing that again."
        accent="amber"
      />
      <div className="space-y-4">
        {streams.map((s, i) => {
          const Icon = Icons[s.icon] || Icons.Coins;
          const color = TYPE_COLOR[s.type] || 'amber';
          return (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: i * 0.04 }}
            >
              <Card>
                <div className="flex flex-wrap items-start gap-3 sm:gap-4 mb-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-${color}-500/10 text-${color}-300 shrink-0`}>
                    <Icon className="w-6 h-6" strokeWidth={2} />
                  </div>
                  <div className="flex-1 min-w-[180px]">
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <Pill color={color}>{s.typeLabel}</Pill>
                      <span className="text-[11px] text-slate-500">Order: {s.order}</span>
                    </div>
                    <h3 className="font-display text-lg sm:text-xl font-extrabold leading-tight">{s.title}</h3>
                    <div className="text-[12px] font-semibold text-amber-300 mt-1">{s.role}</div>
                    <div className="text-[11px] text-slate-500 mt-1">Activates: {s.activatesIn}</div>
                  </div>
                  {s.monthlyTargetInr && (
                    <div className="text-left sm:text-right shrink-0">
                      <div className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">Target / mo</div>
                      <div className="font-display text-base font-extrabold gold-text whitespace-nowrap">
                        {formatInr(s.monthlyTargetInr.low)} – {formatInr(s.monthlyTargetInr.high)}
                      </div>
                    </div>
                  )}
                </div>

                <p className="text-[14px] text-slate-300 leading-relaxed">{s.description}</p>

                {s.idealClients && (
                  <BulletList title="Ideal clients" items={s.idealClients} />
                )}
                {s.deliverables && (
                  <BulletList title="What is included" items={s.deliverables} />
                )}
                {s.pricingTiers && (
                  <div className="mt-4">
                    <SubHead>Pricing tiers</SubHead>
                    <div className="grid sm:grid-cols-2 gap-2 mt-2">
                      {s.pricingTiers.map((t) => (
                        <div key={t.name} className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3">
                          <div className="text-sm font-bold">{t.name} <span className="text-amber-300">· ₹{t.priceInr.toLocaleString('en-IN')}/mo</span></div>
                          <div className="text-xs text-slate-400 mt-1 leading-relaxed">{t.includes}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {s.productIdeas && <BulletList title="Product ideas (lead with these)" items={s.productIdeas} />}
                {s.examples && <BulletList title="Examples" items={s.examples} />}
                {s.formats && <BulletList title="Formats" items={s.formats} />}
                {s.channels && <BulletList title="Channels" items={s.channels} />}
                {s.targetCount && (
                  <div className="mt-4">
                    <SubHead>Care plan growth target</SubHead>
                    <div className="grid grid-cols-4 gap-2 mt-2">
                      {Object.entries(s.targetCount).map(([k, v]) => (
                        <div key={k} className="rounded-lg bg-white/[0.03] border border-white/[0.06] p-3 text-center">
                          <div className="text-[10px] uppercase text-slate-500 font-semibold tracking-wider">{k.replace('month', 'M')}</div>
                          <div className="font-display text-base font-extrabold mt-1">{v}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {s.risks && <BulletList title="Risks (and how we beat each one)" items={s.risks} tone="rose" />}
                {s.why && (
                  <div className="mt-4 rounded-xl bg-amber-500/[0.06] border border-amber-500/15 p-4">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-amber-300 mb-1.5">Why it matters</div>
                    <div className="text-sm text-slate-300 leading-relaxed">{s.why}</div>
                  </div>
                )}
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function SubHead({ children }) {
  return <div className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mt-4">{children}</div>;
}

function BulletList({ title, items, tone = 'slate' }) {
  return (
    <div className="mt-4">
      <SubHead>{title}</SubHead>
      <ul className="mt-2 space-y-1.5">
        {items.map((it, i) => (
          <li key={i} className="flex gap-2 text-sm text-slate-300 leading-relaxed">
            <span className={`mt-2 w-1.5 h-1.5 rounded-full shrink-0 ${tone === 'rose' ? 'bg-rose-400' : 'bg-amber-400'}`} />
            <span>{it}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
