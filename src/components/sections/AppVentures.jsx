import {
  Smartphone, TrendingUp, ShieldAlert, Rocket, ListChecks, BarChart3,
  Calendar, BookOpen, ExternalLink, Ban, IndianRupee, Target, RefreshCw,
  Sparkles, ClipboardCheck, Trophy,
} from 'lucide-react';
import { PageHeader, SectionHeader, Card, Pill, StatCard, Divider } from '../ui/Section.jsx';

const isZeroCost = (c) => /^zero$/i.test(c || '');

// Competition and ceiling read better as colour than as a word. `invert` flips
// the scale for criteria where "high" is bad (competition).
function scaleTone(value, invert = false) {
  const v = String(value || '').toLowerCase();
  const high = invert ? 'rose' : 'emerald';
  if (v.startsWith('very high') || v.startsWith('high')) return high;
  if (v.startsWith('medium') || v.startsWith('low–medium') || v.startsWith('medium–high')) return 'amber';
  return invert ? 'emerald' : 'slate';
}

// Scenario cards are colour-coded so the weak and trap cases cannot be skimmed
// past as if they were equivalent options.
const TONE = {
  best: { card: '!border-emerald-500/45 !bg-emerald-500/[0.07]', text: 'text-emerald-300' },
  good: { card: '', text: 'text-emerald-300' },
  weak: { card: '!border-amber-500/35 !bg-amber-500/[0.05]', text: 'text-amber-300' },
  trap: { card: '!border-rose-500/40 !bg-rose-500/[0.06]', text: 'text-rose-300' },
};

export default function AppVentures({ data }) {
  const av = data?.appVentures;

  if (!av) {
    return (
      <div className="space-y-8">
        <PageHeader eyebrow="Build & Earn" title="App Ventures" />
        <Card>
          <p className="text-sm text-slate-400">
            This section is currently unavailable. Seed the{' '}
            <code className="text-slate-300">appVentures</code> content key, then reload.
          </p>
        </Card>
      </div>
    );
  }

  const ideas = Array.isArray(av.ideas) ? av.ideas : [];
  const zeroCost = ideas.filter((i) => isZeroCost(i.runningCost)).length;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Build & Earn · Android portfolio · Revision 2"
        title={av.thesis?.headline || 'App Ventures'}
        subtitle={av.thesis?.body}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Ideas scored" value={ideas.length} color="slate" />
        <StatCard label="Zero running cost" value={zeroCost} color="emerald" />
        <StatCard label="Android conversion" value="0.9%" sub="median · iOS is 2.6%" color="rose" />
        <StatCard label="Hard paywall lift" value="~5x" sub="vs freemium, same retention" color="amber" />
      </div>

      {/* ---------------- THE DECISION ---------------- */}
      {av.decision && (
        <Card className="!border-emerald-500/45 !bg-emerald-500/[0.06]">
          <SectionHeader
            icon={Target}
            color="emerald"
            title="Build this one"
            subtitle="You could not choose because my last list was nine crowded utilities. Here is a single pick and the reasoning."
          />
          <p className="font-display text-lg font-extrabold text-emerald-200 leading-snug">
            {av.decision.pick}
          </p>
          <p className="text-sm text-slate-300 leading-relaxed mt-3">{av.decision.why}</p>

          <div className="grid sm:grid-cols-2 gap-3 mt-4">
            <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-3.5">
              <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1.5">Runner-up</div>
              <p className="text-sm text-slate-300 leading-relaxed">{av.decision.runnerUp}</p>
            </div>
            <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-3.5">
              <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1.5">Ship first</div>
              <p className="text-sm text-slate-300 leading-relaxed">{av.decision.quickWin}</p>
            </div>
          </div>

          {av.decision.sequence && (
            <div className="mt-3 rounded-xl border border-emerald-500/25 bg-emerald-500/[0.08] px-4 py-3">
              <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-300 block mb-1">
                The sequence
              </span>
              <span className="text-sm text-slate-200 leading-relaxed">{av.decision.sequence}</span>
            </div>
          )}

          {av.decision.honestCaveat && (
            <div className="mt-3 flex gap-3 rounded-xl border border-amber-500/30 bg-amber-500/[0.06] px-4 py-3">
              <ShieldAlert className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
              <p className="text-sm text-slate-300 leading-relaxed">{av.decision.honestCaveat}</p>
            </div>
          )}
        </Card>
      )}

      {/* ---------------- CORRECTIONS ---------------- */}
      {Array.isArray(av.corrections) && av.corrections.length > 0 && (
        <Card className="!border-rose-500/30 !bg-rose-500/[0.05]">
          <SectionHeader
            icon={RefreshCw}
            color="rose"
            title="What I got wrong last time"
            subtitle="Stated plainly, because you were about to build on it."
          />
          <div className="space-y-3">
            {av.corrections.map((c, i) => (
              <div key={i} className="rounded-xl border border-white/[0.08] bg-black/20 p-3.5">
                <p className="text-sm text-slate-400 leading-relaxed">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-rose-300/80 mr-2">Was</span>
                  {c.was}
                </p>
                <p className="text-sm text-slate-200 leading-relaxed mt-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-300/80 mr-2">Now</span>
                  {c.now}
                </p>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Divider />

      {/* ---------------- BENCHMARKS ---------------- */}
      {Array.isArray(av.benchmarks) && av.benchmarks.length > 0 && (
        <section>
          <SectionHeader
            icon={BarChart3}
            color="sky"
            title="The numbers this all rests on"
            subtitle="RevenueCat's 2026 subscription benchmarks — 115,000 apps and $16bn of revenue — plus AdMob eCPM data. Each paired with what we do about it."
          />
          <div className="space-y-3">
            {av.benchmarks.map((b, i) => (
              <Card key={i}>
                <div className="flex items-baseline gap-3 flex-wrap mb-1.5">
                  <span className="font-display text-xl font-extrabold text-sky-300">{b.value}</span>
                  <span className="text-sm font-semibold text-slate-200">{b.metric}</span>
                </div>
                <p className="text-sm text-slate-400 leading-relaxed">{b.detail}</p>
                <p className="text-sm text-emerald-200/90 leading-relaxed mt-2.5">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-300/70 mr-2">So we</span>
                  {b.soWhat}
                </p>
              </Card>
            ))}
          </div>
        </section>
      )}

      <Divider />

      {/* ---------------- WHY US ---------------- */}
      {Array.isArray(av.whyUs) && av.whyUs.length > 0 && (
        <section>
          <SectionHeader
            icon={Sparkles}
            color="violet"
            title="Why the right app for us is not the right app for a solo dev"
            subtitle="This is the part that should decide the choice."
          />
          <div className="grid md:grid-cols-2 gap-3">
            {av.whyUs.map((w, i) => (
              <Card key={i}>
                <h4 className="font-bold text-sm text-violet-200 mb-2">{w.asset}</h4>
                <p className="text-sm text-slate-400 leading-relaxed">{w.edge}</p>
              </Card>
            ))}
          </div>
        </section>
      )}

      <Divider />

      {/* ---------------- SCORING MATRIX ---------------- */}
      {av.scoring?.rows?.length > 0 && (
        <section>
          <SectionHeader
            icon={Trophy}
            color="amber"
            title="Every candidate scored"
            subtitle="Each criterion 1–5, unweighted total. Re-weight it yourself if you disagree with my priorities — that is the point of showing the workings."
          />
          <Card className="!p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm" style={{ minWidth: 720 }}>
                <thead>
                  <tr className="bg-white/[0.04]">
                    <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                      Idea
                    </th>
                    {av.scoring.criteria.map((c) => (
                      <th
                        key={c.key}
                        className="px-2 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500 text-center"
                      >
                        {c.label}
                      </th>
                    ))}
                    <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-amber-300 text-center">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {av.scoring.rows.map((row, i) => (
                    <tr
                      key={row.name}
                      className={`border-t border-white/[0.06] ${i === 0 ? 'bg-emerald-500/[0.06]' : ''}`}
                    >
                      <td className={`px-4 py-3 ${i === 0 ? 'font-bold text-emerald-200' : 'text-slate-300'}`}>
                        {row.name}
                      </td>
                      {av.scoring.criteria.map((c) => (
                        <td key={c.key} className="px-2 py-3 text-center tabular-nums text-slate-400">
                          {row[c.key]}
                        </td>
                      ))}
                      <td
                        className={`px-4 py-3 text-center font-bold tabular-nums ${
                          i === 0 ? 'text-emerald-300' : 'text-slate-200'
                        }`}
                      >
                        {row.total}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </section>
      )}

      <Divider />

      {/* ---------------- IDEAS ---------------- */}
      <section>
        <SectionHeader
          icon={Smartphone}
          color="emerald"
          title="The candidates in full"
          subtitle="Ranked by the scores above. Four are new since revision 1; two were demoted."
        />
        <div className="space-y-4">
          {ideas.map((idea) => (
            <IdeaCard key={idea.id} idea={idea} />
          ))}
        </div>
      </section>

      <Divider />

      {/* ---------------- MONETISATION PLAYBOOK ---------------- */}
      {Array.isArray(av.monetisationPlaybook) && (
        <section>
          <SectionHeader
            icon={IndianRupee}
            color="emerald"
            title="Monetisation playbook"
            subtitle="Drawn from the benchmark data rather than general advice. Each line is worth real money."
          />
          <Card>
            <ul className="space-y-2.5">
              {av.monetisationPlaybook.map((p, i) => (
                <li key={i} className="flex gap-2.5 text-sm text-slate-300 leading-relaxed">
                  <span className="text-emerald-300 shrink-0">▸</span><span>{p}</span>
                </li>
              ))}
            </ul>
          </Card>
        </section>
      )}

      <Divider />

      {/* ---------------- EARNINGS ---------------- */}
      {av.earningsModel && (
        <section>
          <SectionHeader
            icon={BarChart3}
            color="violet"
            title="What each route could earn"
            subtitle="Rebuilt on the 0.9% Android median rather than my earlier optimistic 1.5%."
          />

          {Array.isArray(av.earningsModel.assumptions) && (
            <Card className="mb-3">
              <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Assumptions</div>
              <ul className="space-y-1.5">
                {av.earningsModel.assumptions.map((a, i) => (
                  <li key={i} className="flex gap-2 text-sm text-slate-400 leading-relaxed">
                    <span className="text-slate-600 shrink-0">·</span><span>{a}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          <div className="grid sm:grid-cols-2 gap-3">
            {(av.earningsModel.scenarios || []).map((s, i) => {
              const tone = TONE[s.tone] || TONE.good;
              return (
                <Card key={i} className={tone.card}>
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <h4 className="font-bold text-sm">{s.label}</h4>
                    {s.tone === 'trap' && <Pill color="rose">Avoid</Pill>}
                    {s.tone === 'best' && <Pill color="emerald">Best route</Pill>}
                  </div>
                  <div className={`font-display text-xl font-extrabold mb-2 ${tone.text}`}>{s.revenue}</div>
                  <p className="text-xs text-slate-500 tabular-nums">{s.detail}</p>
                  {s.subs && <p className="text-xs text-slate-400 mt-1">{s.subs}</p>}
                  <p className="text-xs text-slate-500 mt-2.5 leading-relaxed">{s.note}</p>
                </Card>
              );
            })}
          </div>

          {av.earningsModel.warning && (
            <Card className="!border-amber-500/30 !bg-amber-500/[0.05] mt-3">
              <div className="flex gap-3">
                <ShieldAlert className="w-5 h-5 text-amber-300 shrink-0 mt-0.5" />
                <p className="text-sm text-slate-300 leading-relaxed">{av.earningsModel.warning}</p>
              </div>
            </Card>
          )}
        </section>
      )}

      <Divider />

      {/* ---------------- VALIDATION ---------------- */}
      {av.validation && (
        <section>
          <SectionHeader
            icon={ClipboardCheck}
            color="sky"
            title="Two weeks of validation before any code"
            subtitle="The step that separates a business from a hobby."
          />
          <Card className="!border-sky-500/30 !bg-sky-500/[0.05] mb-3">
            <p className="text-sm text-slate-200 leading-relaxed font-semibold">{av.validation.rule}</p>
          </Card>
          <Card className="mb-3">
            <ul className="space-y-2.5">
              {(av.validation.steps || []).map((s, i) => (
                <li key={i} className="flex gap-3 text-sm text-slate-300 leading-relaxed">
                  <span className="text-slate-600 tabular-nums shrink-0">{String(i + 1).padStart(2, '0')}</span>
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </Card>

          {av.validation.appfigures && (
            <Card>
              <div className="flex items-center gap-2 mb-2">
                <Rocket className="w-4 h-4 text-emerald-300" />
                <h4 className="font-bold text-sm">Using the AppFigures trial</h4>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed mb-3">{av.validation.appfigures.why}</p>
              <ul className="space-y-2">
                {(av.validation.appfigures.pulls || []).map((p, i) => (
                  <li key={i} className="flex gap-2.5 text-sm text-slate-400 leading-relaxed">
                    <span className="text-emerald-300/70 shrink-0">▸</span><span>{p}</span>
                  </li>
                ))}
              </ul>
              {av.validation.appfigures.decisionRule && (
                <div className="mt-3.5 rounded-xl border border-emerald-500/25 bg-emerald-500/[0.07] px-4 py-3">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-300 block mb-1">
                    Decision rule
                  </span>
                  <span className="text-sm text-slate-200 leading-relaxed">
                    {av.validation.appfigures.decisionRule}
                  </span>
                </div>
              )}
            </Card>
          )}
        </section>
      )}

      <Divider />

      {/* ---------------- RULES ---------------- */}
      {Array.isArray(av.rules) && (
        <section>
          <SectionHeader icon={Ban} color="amber" title="Hard rules" subtitle="These stop us shipping something with a monthly bill." />
          <Card>
            <ul className="space-y-2.5">
              {av.rules.map((r, i) => (
                <li key={i} className="flex gap-2.5 text-sm text-slate-300 leading-relaxed">
                  <span className="text-amber-300 shrink-0">▸</span><span>{r}</span>
                </li>
              ))}
            </ul>
          </Card>
        </section>
      )}

      <Divider />

      {/* ---------------- ROADMAP ---------------- */}
      {Array.isArray(av.roadmap) && (
        <section>
          <SectionHeader icon={Calendar} color="sky" title="First-year sequencing" subtitle="For one developer, working alone." />
          <div className="grid md:grid-cols-2 gap-3">
            {av.roadmap.map((p, i) => (
              <Card key={i}>
                <Pill color="sky">{p.phase}</Pill>
                <h4 className="font-bold text-base mt-2.5 mb-2">{p.title}</h4>
                <ul className="space-y-1.5">
                  {(p.items || []).map((it, j) => (
                    <li key={j} className="flex gap-2 text-sm text-slate-400 leading-relaxed">
                      <span className="text-sky-300/70 shrink-0">▸</span><span>{it}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            ))}
          </div>
        </section>
      )}

      <Divider />

      {/* ---------------- LAUNCH CHECKLIST ---------------- */}
      {Array.isArray(av.launchChecklist) && (
        <section>
          <SectionHeader
            icon={ListChecks}
            color="amber"
            title="Launch checklist"
            subtitle="Every item costs weeks when missed. Most are policy, not code."
          />
          <Card>
            <ul className="space-y-2.5">
              {av.launchChecklist.map((item, i) => (
                <li key={i} className="flex gap-3 text-sm text-slate-300 leading-relaxed">
                  <span className="text-slate-600 tabular-nums shrink-0">{String(i + 1).padStart(2, '0')}</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </Card>
        </section>
      )}

      <Divider />

      {/* ---------------- CAVEATS + SOURCES ---------------- */}
      <section>
        <SectionHeader icon={BookOpen} color="rose" title="What I could not verify" />
        {Array.isArray(av.caveats) && (
          <Card className="!border-rose-500/25 !bg-rose-500/[0.04] mb-3">
            <ul className="space-y-2">
              {av.caveats.map((c, i) => (
                <li key={i} className="flex gap-2.5 text-sm text-slate-300 leading-relaxed">
                  <span className="text-rose-300/70 shrink-0">▸</span><span>{c}</span>
                </li>
              ))}
            </ul>
          </Card>
        )}

        {Array.isArray(av.research) && (
          <Card>
            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2.5">Sources</div>
            <ul className="space-y-1.5">
              {av.research.map((r, i) => (
                <li key={i}>
                  <a
                    href={r.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-start gap-1.5 text-sm text-violet-300 hover:text-violet-200"
                  >
                    <span>{r.label}</span>
                    <ExternalLink className="w-3 h-3 shrink-0 mt-1" />
                  </a>
                </li>
              ))}
            </ul>
            <p className="text-xs text-slate-500 mt-3 leading-relaxed">
              Figures paraphrased and summarised for licensing compliance. Verify anything you are about to spend
              money on.
            </p>
          </Card>
        )}
      </section>
    </div>
  );
}

/** One idea, with its scores, economics and distribution angle. */
function IdeaCard({ idea }) {
  const isPick = idea.tag === 'THE PICK';
  const tagColor =
    idea.tag === 'THE PICK' ? 'emerald' : idea.tag === 'RUNNER-UP' ? 'violet' : idea.tag === 'FIRST SHIP' ? 'sky' : 'amber';

  return (
    <Card className={isPick ? '!border-emerald-500/45 !bg-emerald-500/[0.05]' : ''}>
      <div className="flex items-start gap-4">
        <div className="font-display text-2xl font-extrabold text-slate-600 shrink-0 w-8">{idea.rank}</div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <h3 className="font-bold text-base">{idea.name}</h3>
            {idea.tag && <Pill color={tagColor}>{idea.tag}</Pill>}
            <Pill color={isZeroCost(idea.runningCost) ? 'emerald' : 'rose'}>
              {isZeroCost(idea.runningCost) ? 'Zero cost' : 'Has running cost'}
            </Pill>
            <Pill color={scaleTone(idea.revenueCeiling)}>{idea.revenueCeiling} ceiling</Pill>
          </div>

          {idea.audience && (
            <p className="text-xs text-slate-500 mb-2">
              <span className="font-bold uppercase tracking-widest text-[10px] mr-1.5">Who</span>
              {idea.audience}
            </p>
          )}

          <p className="text-sm text-slate-300 leading-relaxed">{idea.pitch}</p>

          <div className="mt-3.5 space-y-3">
            <Field label="Why it wins" value={idea.whyItWins} />
            <Field label="Monetisation" value={idea.monetisation} />
            <Field label="Distribution" value={idea.distribution} tone="violet" />
            <Field label="Tech notes" value={idea.techNotes} />
            <Field label="Risks" value={idea.risks} tone="rose" />
          </div>

          <div className="mt-3.5 flex flex-wrap gap-x-6 gap-y-1 text-xs text-slate-500">
            <span>Build: <span className="text-slate-300">{idea.buildWeeks} weeks</span></span>
            <span>Running cost: <span className="text-slate-300">{idea.runningCost}</span></span>
            <span>Competition: <span className="text-slate-300">{idea.competition}</span></span>
          </div>

          <div className="mt-3 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3.5 py-2.5">
            <span className="text-[10px] font-bold uppercase tracking-widest text-violet-300/80 mr-2">Verdict</span>
            <span className="text-sm text-slate-200">{idea.verdict}</span>
          </div>
        </div>
      </div>
    </Card>
  );
}

function Field({ label, value, tone = 'slate' }) {
  if (!value) return null;
  const toneMap = { slate: 'text-slate-400', rose: 'text-rose-200/80', violet: 'text-violet-200/80' };
  return (
    <div>
      <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">{label}</div>
      <p className={`text-sm leading-relaxed ${toneMap[tone]}`}>{value}</p>
    </div>
  );
}
