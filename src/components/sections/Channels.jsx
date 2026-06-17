import { useState } from 'react';
import * as Icons from 'lucide-react';
import { ChevronDown } from 'lucide-react';
import { PageHeader, Card, Pill } from '../ui/Section.jsx';

export default function Channels({ data }) {
  const { channels } = data;
  const [openId, setOpenId] = useState(channels[0]?.id);
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Where Clients Come From"
        title="6 channels — ranked by ROI"
        subtitle="Backed by 2026 market data. For agencies under ₹30L MRR: roughly 50% Upwork, 25% referrals, 15% content, 10% cold email/LinkedIn. Stack effort accordingly."
        accent="amber"
      />
      <div className="space-y-3">
        {channels.map((c) => {
          const Icon = Icons[c.icon] || Icons.Megaphone;
          const isOpen = openId === c.id;
          return (
            <Card key={c.id} className="!p-0 overflow-hidden">
              <button onClick={() => setOpenId(isOpen ? null : c.id)} className="w-full flex items-center gap-4 p-5 text-left hover:bg-white/[0.02] transition-colors">
                <div className={`w-12 h-12 rounded-xl bg-${c.color}-500/10 text-${c.color}-300 flex items-center justify-center shrink-0`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-base">#{c.rank} · {c.name}</h3>
                    <Pill color={c.color}>{c.weeklyEffortHours}h / week</Pill>
                  </div>
                  <div className="text-xs text-slate-400 mt-1 leading-relaxed">{c.expectedClientsPerMonth}</div>
                </div>
                <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
              </button>
              {isOpen && (
                <div className="px-5 pb-5 pt-1 border-t border-white/[0.06] space-y-4">
                  <p className="text-sm text-slate-300 leading-relaxed mt-4">{c.why}</p>

                  {c.weekly && <BulletBlock title="Weekly playbook" items={c.weekly} accent="amber" />}
                  {c.profileChecklist && <BulletBlock title="Profile checklist" items={c.profileChecklist} accent="emerald" />}
                  {c.icpRoles && <BulletBlock title="Ideal customer profile" items={c.icpRoles} accent="sky" />}
                  {c.contentPillars && <BulletBlock title="Content pillars" items={c.contentPillars} accent="violet" />}
                  {c.targetCriteria && <BulletBlock title="What to target" items={c.targetCriteria} accent="emerald" />}
                  {c.formats && <BulletBlock title="Formats" items={c.formats} accent="violet" />}
                  {c.pastContactScript && (
                    <div className="rounded-xl bg-amber-500/[0.05] border border-amber-500/15 p-4">
                      <div className="text-[10px] font-bold uppercase tracking-widest text-amber-300 mb-2">Past-client revival script</div>
                      <pre className="text-sm text-slate-300 whitespace-pre-wrap font-sans leading-relaxed">{c.pastContactScript}</pre>
                    </div>
                  )}
                  {c.targets && (
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Targets over time</div>
                      <div className="grid sm:grid-cols-4 gap-2">
                        {Object.entries(c.targets).map(([key, t]) => (
                          <div key={key} className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3">
                            <div className="text-[10px] uppercase font-bold text-slate-500 tracking-widest mb-2">{key.replace('month', 'Month ')}</div>
                            <div className="space-y-1 text-xs text-slate-300">
                              <div>Proposals: <span className="font-semibold text-slate-100">{t.proposalsPerWeek}/wk</span></div>
                              <div>Reply: <span className="font-semibold text-slate-100">{t.replyRate}</span></div>
                              <div>Close: <span className="font-semibold text-slate-100">{t.closeRate}</span></div>
                              <div>Clients: <span className="font-semibold text-slate-100">{t.expectedClients}</span></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {c.pitfalls && <BulletBlock title="Pitfalls to avoid" items={c.pitfalls} accent="rose" />}
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function BulletBlock({ title, items, accent }) {
  const accentMap = {
    amber: 'text-amber-300',
    emerald: 'text-emerald-300',
    sky: 'text-sky-300',
    violet: 'text-violet-300',
    rose: 'text-rose-300',
  };
  return (
    <div>
      <div className={`text-[10px] font-bold uppercase tracking-widest ${accentMap[accent]} mb-2`}>{title}</div>
      <ul className="space-y-1.5">
        {items.map((it, i) => (
          <li key={i} className="flex gap-2 text-sm text-slate-300 leading-relaxed">
            <span className={`mt-1.5 ${accentMap[accent]}`}>▸</span><span>{it}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
