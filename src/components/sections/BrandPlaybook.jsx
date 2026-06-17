import { useState } from 'react';
import * as Icons from 'lucide-react';
import { ChevronDown, Rocket, BadgeCheck, ListChecks, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PageHeader, Card, Pill, StatCard } from '../ui/Section.jsx';

const COLOR = {
  amber: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
  violet: 'bg-violet-500/10 text-violet-300 border-violet-500/20',
  emerald: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
  sky: 'bg-sky-500/10 text-sky-300 border-sky-500/20',
};

export default function BrandPlaybook({ data }) {
  const { brandPlaybook: bp } = data;
  const [openId, setOpenId] = useState(bp.principles[0]?.id);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Grow The Brand"
        title={bp.intro.title}
        subtitle={bp.intro.subtitle}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {bp.intro.metrics.map((m, i) => (
          <StatCard key={i} label={m.label} value={m.value} color={i % 2 ? 'emerald' : 'amber'} />
        ))}
      </div>

      {/* 8 PRINCIPLES */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Icons.Lightbulb className="w-5 h-5 text-amber-300" />
          <h2 className="font-display text-xl font-extrabold">What big agencies do — and how we copy it</h2>
        </div>
        <div className="space-y-3">
          {bp.principles.map((p) => {
            const Icon = Icons[p.icon] || Icons.Star;
            const isOpen = openId === p.id;
            return (
              <Card key={p.id} className="!p-0 overflow-hidden">
                <button onClick={() => setOpenId(isOpen ? null : p.id)} className="w-full flex items-center gap-4 p-5 text-left hover:bg-white/[0.02] transition-colors">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border ${COLOR[p.color] || COLOR.amber}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-base sm:text-lg leading-tight">{p.lesson}</h3>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="px-5 pb-5 pt-1 border-t border-white/[0.06] space-y-4">
                        <div className="mt-4">
                          <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">What they do</div>
                          <p className="text-sm text-slate-300 leading-relaxed">{p.bigAgencyDoes}</p>
                        </div>
                        <div className={`rounded-xl p-4 border ${COLOR[p.color] || COLOR.amber}`}>
                          <div className="text-[10px] font-bold uppercase tracking-widest mb-1.5">→ Ready2UP move</div>
                          <p className="text-sm text-slate-200 leading-relaxed">{p.ready2upMove}</p>
                        </div>
                        <div className="text-xs text-slate-400 italic bg-white/[0.03] border border-white/[0.06] rounded-lg p-3">
                          <span className="font-bold not-italic text-amber-300">Formula: </span>{p.formula}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            );
          })}
        </div>
      </section>

      {/* 90-DAY SPRINT */}
      <section>
        <div className="flex items-center gap-2 mb-1">
          <Rocket className="w-5 h-5 text-violet-300" />
          <h2 className="font-display text-xl font-extrabold">{bp.brandSprint.title}</h2>
        </div>
        <p className="text-sm text-slate-500 mb-5">{bp.brandSprint.subtitle}</p>
        <div className="grid sm:grid-cols-2 gap-3">
          {bp.brandSprint.weeks.map((w, i) => (
            <Card key={i}>
              <div className="text-[11px] font-bold uppercase tracking-widest text-violet-300 mb-3">{w.phase}</div>
              <ul className="space-y-2">
                {w.items.map((it, j) => (
                  <li key={j} className="flex gap-2 text-sm text-slate-300 leading-relaxed">
                    <span className="text-violet-400 mt-1 shrink-0">▸</span><span>{it}</span>
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      </section>

      {/* DIRECTORIES */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <BadgeCheck className="w-5 h-5 text-emerald-300" />
          <h2 className="font-display text-xl font-extrabold">Directories & partner programs to join</h2>
        </div>
        <p className="text-sm text-slate-500 mb-5">Each one = credibility + a potential lead source. Most are free. This is how you get "found" and look established.</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {bp.directories.map((d, i) => (
            <Card key={i}>
              <div className="flex items-start justify-between gap-2 mb-2">
                <h4 className="font-bold text-sm">{d.name}</h4>
                <Pill color={d.priority === 'Now' ? 'emerald' : 'amber'}>{d.priority}</Pill>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed mb-2">{d.why}</p>
              <div className="text-[11px] text-slate-500">{d.cost}</div>
            </Card>
          ))}
        </div>
      </section>

      {/* PRESENTATION CHECKLIST */}
      <section className="grid lg:grid-cols-2 gap-4">
        <Card>
          <div className="flex items-center gap-2 mb-3">
            <ListChecks className="w-5 h-5 text-sky-300" />
            <h3 className="font-display text-lg font-extrabold">Copy their website presentation</h3>
          </div>
          <ul className="space-y-2">
            {bp.presentationChecklist.map((it, i) => (
              <li key={i} className="flex gap-2 text-sm text-slate-300 leading-relaxed">
                <span className="text-sky-400 mt-0.5 shrink-0">✓</span><span>{it}</span>
              </li>
            ))}
          </ul>
        </Card>
        <Card className="!border-rose-500/15 bg-gradient-to-br from-rose-500/[0.04] to-transparent">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-5 h-5 text-rose-300" />
            <h3 className="font-display text-lg font-extrabold">Reality check</h3>
          </div>
          <ul className="space-y-2">
            {bp.realityCheck.map((it, i) => (
              <li key={i} className="flex gap-2 text-sm text-slate-300 leading-relaxed">
                <span className="text-rose-400 mt-1 shrink-0">●</span><span>{it}</span>
              </li>
            ))}
          </ul>
        </Card>
      </section>
    </div>
  );
}
