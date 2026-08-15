import {
  Smartphone, TrendingUp, ShieldAlert, Rocket, ListChecks, BarChart3,
  Calendar, BookOpen, ExternalLink, Ban, IndianRupee,
} from 'lucide-react';
import { PageHeader, SectionHeader, Card, Pill, StatCard, Divider } from '../ui/Section.jsx';

// Running-cost colouring: zero cost is the whole point of this portfolio, so a
// real monthly bill is called out in red rather than quietly listed.
function costTone(runningCost) {
  return /^zero$/i.test(runningCost || '') ? 'emerald' : 'rose';
}

// Competition and ceiling both read better as a colour than as a word.
function scaleTone(value, invert = false) {
  const v = String(value || '').toLowerCase();
  const high = invert ? 'rose' : 'emerald';
  const low = invert ? 'emerald' : 'slate';
  if (v.startsWith('very high') || v.startsWith('high')) return high;
  if (v.startsWith('medium')) return 'amber';
  return low;
}

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
  const zeroCost = ideas.filter((i) => /^zero$/i.test(i.runningCost || '')).length;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Build & Earn · Android portfolio"
        title={av.thesis?.headline || 'App Ventures'}
        subtitle={av.thesis?.body}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Ideas scored" value={ideas.length} color="slate" />
        <StatCard label="Zero running cost" value={zeroCost} color="emerald" />
        <StatCard label="Target / app" value="₹9L/mo" sub="at 100k MAU, mixed geo" color="amber" />
        <StatCard label="Tier-1 vs India eCPM" value="10–20x" sub="same impression" color="violet" />
      </div>

      {/* ---------------- The one thing that decides everything ---------------- */}
      <Card className="!border-rose-500/30 !bg-rose-500/[0.05]">
        <SectionHeader
          icon={IndianRupee}
          color="rose"
          title="Read this before choosing anything"
          subtitle="Geography decides ad revenue far more than download count does."
        />
        <p className="text-sm text-slate-300 leading-relaxed">
          Tier-1 rewarded video runs roughly <strong>$15–30</strong> per thousand impressions. Indian traffic runs
          roughly <strong>$1.40</strong>. That is the same ad, the same app, the same effort — and 10 to 20 times the
          money. Ten thousand users in the US are worth more than a hundred and fifty thousand users in India.
        </p>
        <p className="text-sm text-slate-300 leading-relaxed mt-3">
          So every app here is <strong>English-first and built for a global audience</strong>, even though we build it
          from Nashik. Hindi and Marathi come later, once a Tier-1 base exists — never before. Judge every app on
          revenue per thousand users, never on installs.
        </p>
      </Card>

      <Divider />

      {/* ---------------- Market facts ---------------- */}
      {Array.isArray(av.marketFacts) && av.marketFacts.length > 0 && (
        <section>
          <SectionHeader
            icon={TrendingUp}
            color="sky"
            title="What the 2026 market data actually says"
            subtitle="Each fact paired with what we do about it."
          />
          <div className="space-y-3">
            {av.marketFacts.map((f, i) => (
              <Card key={i}>
                <p className="text-sm text-slate-300 leading-relaxed">{f.fact}</p>
                <p className="text-sm text-emerald-200/90 leading-relaxed mt-2.5">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-300/70 mr-2">
                    So we
                  </span>
                  {f.implication}
                </p>
              </Card>
            ))}
          </div>
        </section>
      )}

      <Divider />

      {/* ---------------- Hard rules ---------------- */}
      {Array.isArray(av.rules) && av.rules.length > 0 && (
        <section>
          <SectionHeader
            icon={Ban}
            color="amber"
            title="Hard rules"
            subtitle="These exist to stop us shipping something with a monthly bill attached."
          />
          <Card>
            <ul className="space-y-2.5">
              {av.rules.map((rule, i) => (
                <li key={i} className="flex gap-2.5 text-sm text-slate-300 leading-relaxed">
                  <span className="text-amber-300 shrink-0">▸</span>
                  <span>{rule}</span>
                </li>
              ))}
            </ul>
          </Card>
        </section>
      )}

      <Divider />

      {/* ---------------- The shortlist ---------------- */}
      <section>
        <SectionHeader
          icon={Smartphone}
          color="emerald"
          title="The shortlist, ranked"
          subtitle="Ranked by demand × zero-cost feasibility × honest revenue ceiling."
        />
        <div className="space-y-4">
          {ideas.map((idea) => (
            <Card key={idea.id} className={idea.rank === 1 ? '!border-emerald-500/45 !bg-emerald-500/[0.05]' : ''}>
              <div className="flex items-start gap-4">
                <div className="font-display text-2xl font-extrabold text-slate-600 shrink-0 w-8">{idea.rank}</div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <h3 className="font-bold text-base">{idea.name}</h3>
                    <Pill color={costTone(idea.runningCost)}>
                      {/^zero$/i.test(idea.runningCost) ? 'Zero cost' : 'Has running cost'}
                    </Pill>
                    <Pill color={scaleTone(idea.revenueCeiling)}>{idea.revenueCeiling} ceiling</Pill>
                    <Pill color={scaleTone(idea.competition, true)}>{idea.competition} competition</Pill>
                  </div>

                  <p className="text-sm text-slate-300 leading-relaxed">{idea.pitch}</p>

                  <div className="mt-3.5 space-y-3">
                    <Field label="Why it wins" value={idea.whyItWins} />
                    <Field label="Monetisation" value={idea.monetisation} />
                    <Field label="Tech notes" value={idea.techNotes} />
                    <Field label="Risks" value={idea.risks} tone="rose" />
                  </div>

                  <div className="mt-3.5 flex flex-wrap gap-x-6 gap-y-1 text-xs text-slate-500">
                    <span>Build: <span className="text-slate-300">{idea.buildWeeks} weeks</span></span>
                    <span>Running cost: <span className="text-slate-300">{idea.runningCost}</span></span>
                  </div>

                  <div className="mt-3 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3.5 py-2.5">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-violet-300/80 mr-2">
                      Verdict
                    </span>
                    <span className="text-sm text-slate-200">{idea.verdict}</span>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      <Divider />

      {/* ---------------- Earnings model ---------------- */}
      {av.earningsModel && (
        <section>
          <SectionHeader
            icon={BarChart3}
            color="violet"
            title="What it could actually earn"
            subtitle="Deliberately conservative. The optimistic version of this maths is how people talk themselves into quitting a job."
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

          <div className="grid md:grid-cols-3 gap-3">
            {(av.earningsModel.scenarios || []).map((s, i) => {
              const isTrap = /trap/i.test(s.label);
              return (
                <Card key={i} className={isTrap ? '!border-rose-500/40 !bg-rose-500/[0.06]' : ''}>
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <h4 className="font-bold text-sm">{s.label}</h4>
                    {isTrap && <Pill color="rose">Avoid</Pill>}
                  </div>
                  <div className={`font-display text-xl font-extrabold mb-3 ${isTrap ? 'text-rose-300' : 'text-emerald-300'}`}>
                    {s.total}
                  </div>
                  <div className="space-y-1 text-xs text-slate-400">
                    <Row k="MAU" v={s.mau} />
                    <Row k="DAU" v={s.dau} />
                    <Row k="Ads" v={s.adRevenue} />
                    <Row k="Subscriptions" v={s.subRevenue} />
                  </div>
                  <p className="text-xs text-slate-500 mt-3 leading-relaxed">{s.note}</p>
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

      {/* ---------------- Roadmap ---------------- */}
      {Array.isArray(av.roadmap) && av.roadmap.length > 0 && (
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

      {/* ---------------- Launch checklist ---------------- */}
      {Array.isArray(av.launchChecklist) && av.launchChecklist.length > 0 && (
        <section>
          <SectionHeader
            icon={ListChecks}
            color="amber"
            title="Launch checklist"
            subtitle="Every item here costs weeks when it is missed. Most are policy, not code."
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

      {/* ---------------- AppFigures plan ---------------- */}
      {av.appfiguresPlan && (
        <section>
          <SectionHeader
            icon={Rocket}
            color="emerald"
            title="Use the AppFigures trial like a checklist"
            subtitle="It covers both Google Play and the App Store. The trial is time-boxed — go in with a list, not curiosity."
          />
          <Card>
            <p className="text-sm text-slate-300 leading-relaxed mb-4">{av.appfiguresPlan.why}</p>
            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Pull exactly this</div>
            <ul className="space-y-2">
              {(av.appfiguresPlan.pulls || []).map((p, i) => (
                <li key={i} className="flex gap-2.5 text-sm text-slate-400 leading-relaxed">
                  <span className="text-emerald-300/70 shrink-0">▸</span><span>{p}</span>
                </li>
              ))}
            </ul>
            {av.appfiguresPlan.decisionRule && (
              <div className="mt-4 rounded-xl border border-emerald-500/25 bg-emerald-500/[0.07] px-4 py-3">
                <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-300 block mb-1">
                  Decision rule
                </span>
                <span className="text-sm text-slate-200 leading-relaxed">{av.appfiguresPlan.decisionRule}</span>
              </div>
            )}
          </Card>
        </section>
      )}

      <Divider />

      {/* ---------------- Caveats + sources ---------------- */}
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

/** A labelled block of body copy inside an idea card. */
function Field({ label, value, tone = 'slate' }) {
  if (!value) return null;
  const toneMap = { slate: 'text-slate-400', rose: 'text-rose-200/80' };
  return (
    <div>
      <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">{label}</div>
      <p className={`text-sm leading-relaxed ${toneMap[tone]}`}>{value}</p>
    </div>
  );
}

/** One key/value line in a revenue scenario card. */
function Row({ k, v }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-slate-500">{k}</span>
      <span className="text-slate-300 tabular-nums">{v}</span>
    </div>
  );
}
