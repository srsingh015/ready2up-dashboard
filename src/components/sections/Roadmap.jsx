import { useState } from 'react';
import { ChevronDown, ChevronRight, ArrowRight } from 'lucide-react';
import { PageHeader, Card, Pill } from '../ui/Section.jsx';
import { formatInr } from '../../utils/format.js';

const COLOR = {
  rose: { bar: 'from-rose-500 to-rose-700', dot: 'bg-rose-500', wrap: 'border-rose-500/15', text: 'text-rose-300' },
  violet: { bar: 'from-violet-500 to-violet-700', dot: 'bg-violet-500', wrap: 'border-violet-500/15', text: 'text-violet-300' },
  sky: { bar: 'from-sky-500 to-sky-700', dot: 'bg-sky-500', wrap: 'border-sky-500/15', text: 'text-sky-300' },
  amber: { bar: 'from-amber-500 to-amber-700', dot: 'bg-amber-500', wrap: 'border-amber-500/15', text: 'text-amber-300' },
  emerald: { bar: 'from-emerald-500 to-emerald-700', dot: 'bg-emerald-500', wrap: 'border-emerald-500/15', text: 'text-emerald-300' },
};

export default function Roadmap({ data, onNavigate }) {
  const { roadmap } = data;
  const [openId, setOpenId] = useState('p0');

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="The 24-Month Roadmap"
        title="Five phases. Five gates. No skipping."
        subtitle="Each phase has clear graduation criteria. We do not advance until the gate is met. This is the discipline that keeps the base strong while the engine grows."
        accent="violet"
      />

      <div className="relative pl-6 sm:pl-8">
        <div className="absolute top-2 bottom-2 left-2 sm:left-3 w-px bg-gradient-to-b from-rose-500 via-amber-500 to-emerald-500" />
        <div className="space-y-4">
          {roadmap.map((p) => {
            const c = COLOR[p.color] || COLOR.amber;
            const isOpen = openId === p.id;
            return (
              <div key={p.id} className="relative">
                <span className={`absolute -left-[26px] sm:-left-[34px] top-5 w-3.5 h-3.5 rounded-full ${c.dot} shadow-[0_0_16px_rgba(255,255,255,0.2)]`} />
                <Card className="!p-0 overflow-hidden">
                  <button onClick={() => setOpenId(isOpen ? null : p.id)} className="w-full flex items-center gap-4 p-5 text-left hover:bg-white/[0.02] transition-colors">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${c.bar} text-ink-950 font-extrabold flex items-center justify-center shrink-0`}>
                      {p.code}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-base sm:text-lg leading-tight">{p.title}</h3>
                        <Pill color={p.color}>{p.period}</Pill>
                      </div>
                      <div className="text-xs text-slate-400 mt-1 leading-relaxed">{p.focus}</div>
                    </div>
                    <div className="hidden sm:block text-right shrink-0">
                      <div className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">Revenue range</div>
                      <div className="text-sm font-bold gold-text">{formatInr(p.revenueTarget.from)} – {formatInr(p.revenueTarget.to)}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">Team: {p.teamSize}</div>
                    </div>
                    {isOpen ? <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" /> : <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />}
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 pt-1 border-t border-white/[0.06]">
                      <div className="grid sm:grid-cols-2 gap-6 mt-4">
                        <div>
                          <h4 className="text-[10px] font-bold uppercase tracking-widest text-amber-300 mb-2">Key outcomes</h4>
                          <ul className="space-y-2">
                            {p.keyOutcomes.map((o, i) => (
                              <li key={i} className="flex gap-2 text-sm text-slate-300 leading-relaxed">
                                <span className="text-amber-300 mt-0.5">▸</span><span>{o}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <h4 className="text-[10px] font-bold uppercase tracking-widest text-emerald-300 mb-2">Gate to advance</h4>
                          <ul className="space-y-2">
                            {p.gateToAdvance.map((g, i) => (
                              <li key={i} className="flex gap-2 text-sm text-slate-300 leading-relaxed">
                                <span className="text-emerald-300 mt-0.5">✓</span><span>{g}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                      <button
                        onClick={() => onNavigate?.('months')}
                        className="mt-5 inline-flex items-center gap-1 text-xs text-amber-300 hover:text-amber-200"
                      >
                        Open monthly plans for {p.period}
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </Card>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
