import { useState } from 'react';
import * as Icons from 'lucide-react';
import { ChevronDown, FileText, Clock, Target, AlertTriangle, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PageHeader, Card, Pill, StatCard } from '../ui/Section.jsx';

const COLOR = {
  sky: { bar: 'from-sky-500 to-sky-700', dot: 'bg-sky-500', wrap: 'border-sky-500/15', text: 'text-sky-300', soft: 'bg-sky-500/10' },
  violet: { bar: 'from-violet-500 to-violet-700', dot: 'bg-violet-500', wrap: 'border-violet-500/15', text: 'text-violet-300', soft: 'bg-violet-500/10' },
  amber: { bar: 'from-amber-500 to-amber-700', dot: 'bg-amber-500', wrap: 'border-amber-500/15', text: 'text-amber-300', soft: 'bg-amber-500/10' },
  emerald: { bar: 'from-emerald-500 to-emerald-700', dot: 'bg-emerald-500', wrap: 'border-emerald-500/15', text: 'text-emerald-300', soft: 'bg-emerald-500/10' },
  rose: { bar: 'from-rose-500 to-rose-700', dot: 'bg-rose-500', wrap: 'border-rose-500/15', text: 'text-rose-300', soft: 'bg-rose-500/10' },
};

export default function Onboarding({ data }) {
  const { onboarding } = data;
  const [openId, setOpenId] = useState('s1');

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Operations"
        title={onboarding.intro.title}
        subtitle={onboarding.intro.subtitle}
        accent="emerald"
      />

      <div className="grid-auto-stats gap-3">
        {onboarding.intro.metrics.map((m, i) => (
          <StatCard key={i} label={m.label} value={m.value} color={i % 2 ? 'emerald' : 'amber'} />
        ))}
      </div>

      {/* The 9 stages */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Icons.Workflow className="w-5 h-5 text-emerald-300" />
          <h2 className="font-display text-xl font-extrabold">The 9 stages — every client, every time</h2>
        </div>

        <div className="relative pl-6 sm:pl-8">
          <div className="absolute top-2 bottom-2 left-2 sm:left-3 w-px bg-gradient-to-b from-sky-500 via-amber-500 to-violet-500" />
          <div className="space-y-3">
            {onboarding.stages.map((s) => {
              const c = COLOR[s.color] || COLOR.amber;
              const Icon = Icons[s.icon] || Icons.Circle;
              const isOpen = openId === s.id;
              return (
                <div key={s.id} className="relative">
                  <span className={`absolute -left-[26px] sm:-left-[34px] top-5 w-3.5 h-3.5 rounded-full ${c.dot} shadow-[0_0_16px_rgba(255,255,255,0.2)]`} />
                  <Card className="!p-0 overflow-hidden">
                    <button onClick={() => setOpenId(isOpen ? null : s.id)} className="w-full flex items-center gap-4 p-5 text-left hover:bg-white/[0.02] transition-colors">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${c.bar} text-ink-950 font-extrabold flex items-center justify-center shrink-0`}>
                        {s.number}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Icon className={`w-4 h-4 ${c.text}`} />
                          <h3 className="font-bold text-base sm:text-lg leading-tight">{s.title}</h3>
                          <Pill color={s.color}>{s.timeline}</Pill>
                        </div>
                        <div className="text-xs text-slate-400 mt-1 leading-relaxed">{s.goal}</div>
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
                          <div className="px-5 pb-5 pt-1 border-t border-white/[0.06] space-y-5">
                            <div className={`rounded-xl ${c.soft} border ${c.wrap} p-4 mt-4`}>
                              <div className={`text-[10px] font-bold uppercase tracking-widest ${c.text} mb-1.5 flex items-center gap-1.5`}>
                                <Sparkles className="w-3 h-3" /> The big idea
                              </div>
                              <p className="text-sm text-slate-200 leading-relaxed">{s.bigIdea}</p>
                            </div>

                            <BulletBlock title="What to do" items={s.doNow} accent="emerald" icon={Icons.CheckCircle2} />

                            {s.qualificationQuestions && (
                              <BulletBlock title="The 7 qualification questions" items={s.qualificationQuestions} accent="violet" icon={Icons.HelpCircle} />
                            )}
                            {s.callStructure && (
                              <BulletBlock title="Discovery call structure (25–30 min)" items={s.callStructure} accent="violet" icon={Icons.Clock} />
                            )}
                            {s.proposalSections && (
                              <BulletBlock title="The 7-section proposal" items={s.proposalSections} accent="amber" icon={FileText} />
                            )}
                            {s.welcomeEmailIncludes && (
                              <BulletBlock title="Welcome email — what it includes" items={s.welcomeEmailIncludes} accent="emerald" icon={Icons.Mail} />
                            )}
                            {s.weeklyClientUpdate && (
                              <BulletBlock title="Weekly status email — the format" items={s.weeklyClientUpdate} accent="sky" icon={Icons.Send} />
                            )}
                            {s.preLaunchChecklist && (
                              <BulletBlock title="Pre-launch QA checklist (24 items)" items={s.preLaunchChecklist} accent="rose" icon={Icons.ListChecks} />
                            )}
                            {s.handoverDocIncludes && (
                              <BulletBlock title="Handover doc — what it covers" items={s.handoverDocIncludes} accent="amber" icon={FileText} />
                            )}
                            {s.crossSellMenu && (
                              <BulletBlock title="Cross-sell menu" items={s.crossSellMenu} accent="emerald" icon={Icons.PlusCircle} />
                            )}
                            {s.redFlags && (
                              <BulletBlock title="Red flags — walk away politely" items={s.redFlags} accent="rose" icon={AlertTriangle} />
                            )}

                            {s.noPrincing && (
                              <Highlight color="amber" title="Pricing rule">{s.noPrincing}</Highlight>
                            )}
                            {s.careUpsellScript && (
                              <ScriptBlock title="Care upsell script" body={s.careUpsellScript} />
                            )}
                            {s.referralAskScript && (
                              <ScriptBlock title="Referral ask script" body={s.referralAskScript} />
                            )}
                            {s.reactivation && (
                              <Highlight color="violet" title="Reactivation">{s.reactivation}</Highlight>
                            )}

                            <div className="grid sm:grid-cols-2 gap-3">
                              {s.tools && (
                                <Card className="!p-4 !bg-white/[0.02]">
                                  <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Tools</div>
                                  <div className="text-sm text-slate-300">{s.tools.join(' · ')}</div>
                                </Card>
                              )}
                              {s.docsToSend && (
                                <Card className="!p-4 !bg-white/[0.02]">
                                  <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Docs to send</div>
                                  <div className="text-sm text-slate-300">{s.docsToSend.join(' · ')}</div>
                                </Card>
                              )}
                            </div>

                            {s.kpis && (
                              <div>
                                <div className="text-[10px] font-bold uppercase tracking-widest text-emerald-300 mb-2 flex items-center gap-1.5">
                                  <Target className="w-3 h-3" /> KPIs to hit
                                </div>
                                <div className="grid sm:grid-cols-3 gap-2">
                                  {s.kpis.map((k, i) => (
                                    <div key={i} className="text-xs p-2.5 rounded-lg bg-emerald-500/[0.06] border border-emerald-500/15 text-slate-300 leading-relaxed">{k}</div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Card>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Document pack */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <FileText className="w-5 h-5 text-amber-300" />
          <h2 className="font-display text-xl font-extrabold">The Document Pack — 11 templates ready to send</h2>
        </div>
        <p className="text-sm text-slate-500 mb-5">Build these once, use them forever. Templates make onboarding identical for every client — that is what makes scaling possible.</p>
        <div className="grid-auto-cards gap-3">
          {onboarding.documentPack.map((d) => (
            <Card key={d.id}>
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-4 h-4 text-amber-300 shrink-0" />
                <h4 className="font-bold text-sm">{d.name}</h4>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed mb-3">{d.purpose}</p>
              <div className="flex items-center gap-1.5 flex-wrap">
                <Pill color="violet">{d.when}</Pill>
                <span className="text-[10px] text-slate-500">· {d.tool}</span>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Cadence */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Clock className="w-5 h-5 text-violet-300" />
          <h2 className="font-display text-xl font-extrabold">{onboarding.cadence.title}</h2>
        </div>
        <p className="text-sm text-slate-500 mb-5">Target {onboarding.cadence.targetTotalDays} days from inbound lead to "care plan signed". Anything longer = something needs fixing.</p>
        <Card>
          <div className="space-y-1">
            {onboarding.cadence.nodes.map((n, i) => (
              <div key={i} className="flex gap-3 items-center py-2.5 border-b border-white/[0.04] last:border-0">
                <div className="text-[10px] font-bold tracking-widest text-violet-300 uppercase w-16 shrink-0 text-right">Day {n.day}</div>
                <div className="w-1.5 h-1.5 rounded-full bg-violet-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-slate-100">{n.label}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{n.action}</div>
                </div>
                <Pill color="slate">S{n.stage}</Pill>
              </div>
            ))}
          </div>
        </Card>
      </section>

      {/* Communication rules */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Icons.MessageCircle className="w-5 h-5 text-sky-300" />
          <h2 className="font-display text-xl font-extrabold">Communication rules</h2>
        </div>
        <p className="text-sm text-slate-500 mb-5">Predictability is professionalism. These rules protect you and the client.</p>
        <div className="space-y-2">
          {onboarding.communicationRules.map((r, i) => (
            <Card key={i} className="!p-4">
              <div className="grid sm:grid-cols-12 gap-3 items-center">
                <div className="sm:col-span-7 font-semibold text-sm text-slate-100">{r.rule}</div>
                <div className="sm:col-span-5 text-xs text-slate-400 sm:border-l sm:border-white/[0.06] sm:pl-3 leading-relaxed"><span className="text-amber-300 font-semibold">Why: </span>{r.why}</div>
              </div>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}

function BulletBlock({ title, items, accent = 'amber', icon: Icon }) {
  const accentMap = { amber: 'text-amber-300', emerald: 'text-emerald-300', sky: 'text-sky-300', violet: 'text-violet-300', rose: 'text-rose-300' };
  return (
    <div>
      <div className={`text-[10px] font-bold uppercase tracking-widest mb-2 flex items-center gap-1.5 ${accentMap[accent]}`}>
        {Icon && <Icon className="w-3 h-3" />}
        {title}
      </div>
      <ul className="space-y-1.5">
        {items.map((it, i) => (
          <li key={i} className="flex gap-2 text-sm text-slate-300 leading-relaxed">
            <span className={`mt-1.5 ${accentMap[accent]} text-xs`}>▸</span><span>{it}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Highlight({ color, title, children }) {
  const colorMap = { amber: 'border-amber-500/20 bg-amber-500/5 text-amber-300', violet: 'border-violet-500/20 bg-violet-500/5 text-violet-300' };
  return (
    <div className={`rounded-xl border p-4 ${colorMap[color]}`}>
      <div className="text-[10px] font-bold uppercase tracking-widest mb-1.5">{title}</div>
      <p className="text-sm text-slate-300 leading-relaxed">{children}</p>
    </div>
  );
}

function ScriptBlock({ title, body }) {
  return (
    <div>
      <div className="text-[10px] font-bold uppercase tracking-widest text-violet-300 mb-2">{title}</div>
      <pre className="bg-ink-900/80 border border-white/[0.06] rounded-xl p-4 text-[13px] leading-relaxed text-slate-300 whitespace-pre-wrap font-sans">{body}</pre>
    </div>
  );
}
