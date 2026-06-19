import { useMemo } from 'react';
import { FileText, Server, Bot, Target, ListChecks, Wrench, Rocket } from 'lucide-react';
import { PageHeader, Card, Pill } from '../ui/Section.jsx';
import { useCloudState } from '../../lib/cloudSync.js';

// The blog roadmap — focused clusters, long-tail winnable keywords.
const ARTICLES = [
  // Hosting cluster (priority — affiliate money + winnable)
  { id: 'h1', cluster: 'Hosting', pillar: true, title: 'Best Web Hosting in India for Small Business (2026)', kw: 'best web hosting in india' },
  { id: 'h2', cluster: 'Hosting', title: 'Hostinger vs Cloudways for WordPress Beginners', kw: 'hostinger vs cloudways' },
  { id: 'h3', cluster: 'Hosting', title: 'Cheapest Reliable Web Hosting in India (2026)', kw: 'cheapest web hosting india' },
  { id: 'h4', cluster: 'Hosting', title: 'Shared vs Cloud vs VPS Hosting — Which Do You Need?', kw: 'shared vs vps vs cloud hosting' },
  { id: 'h5', cluster: 'Hosting', title: 'Best Hosting for a WordPress Blog in India', kw: 'best hosting for wordpress blog india' },
  { id: 'h6', cluster: 'Hosting', title: 'How to Move From Shared Hosting to Cloudways', kw: 'migrate to cloudways' },
  { id: 'h7', cluster: 'Hosting', title: 'Best VPS Hosting for Developers in India', kw: 'best vps hosting india' },
  { id: 'h8', cluster: 'Hosting', title: 'Best Hosting for a Small Online Store in India', kw: 'best hosting for ecommerce india' },
  // AI tools cluster (secondary — traffic + AI-search friendly)
  { id: 'a1', cluster: 'AI Tools', pillar: true, title: 'Best AI Website Builders in 2026 (Tested)', kw: 'best ai website builder' },
  { id: 'a2', cluster: 'AI Tools', title: 'Lovable AI Alternatives for Non-Coders', kw: 'lovable ai alternatives' },
  { id: 'a3', cluster: 'AI Tools', title: 'Bolt vs Lovable vs v0 — Best AI App Builder?', kw: 'bolt vs lovable vs v0' },
  { id: 'a4', cluster: 'AI Tools', title: 'Best Free AI Tools for Small Business Owners', kw: 'best free ai tools for small business' },
];

const STATUSES = ['Idea', 'Writing', 'Published', 'Ranking'];
const STATUS_COLOR = { Idea: 'slate', Writing: 'amber', Published: 'sky', Ranking: 'emerald' };
const CLUSTER_ICON = { Hosting: Server, 'AI Tools': Bot };

const CHECKLIST = [
  'Focus keyphrase in the title, H1, URL slug, and first 100 words.',
  'Give a clear, direct answer right at the top (wins Google snippets + AI citations).',
  'Add a comparison table where it helps — people and AI both love them.',
  'Write from real experience (you’re a developer — say what you actually think).',
  'Add an FAQ section at the end, and turn on FAQ schema in Yoast.',
  'Link to your pillar article, and link out to your pricing/services page.',
  'Set the Yoast meta title + meta description (keep the keyphrase in both).',
  'After publishing: Google Search Console → URL Inspection → Request Indexing.',
];

const FIX_OLD = [
  'Keep & upgrade your best hosting/AI posts — add depth, real opinions, tables, FAQs.',
  'Merge overlapping posts into one strong article, then redirect the old URLs.',
  'Delete the thinnest, lowest-value posts — they drag the whole site down.',
  'Slim categories from 50+ down to about 6 clean ones.',
  'Internally link every post in a cluster back to its pillar.',
];

export default function ContentPlan() {
  const [status, setStatus] = useCloudState('content_status', {});

  function cycle(id) {
    setStatus((s) => {
      const cur = s[id] || 'Idea';
      const next = STATUSES[(STATUSES.indexOf(cur) + 1) % STATUSES.length];
      return { ...s, [id]: next };
    });
  }

  const stats = useMemo(() => {
    let published = 0, ranking = 0;
    ARTICLES.forEach((a) => {
      const st = status[a.id] || 'Idea';
      if (st === 'Published') published++;
      if (st === 'Ranking') { published++; ranking++; }
    });
    return { total: ARTICLES.length, published, ranking };
  }, [status]);

  const clusters = useMemo(() => {
    const m = {};
    ARTICLES.forEach((a) => { (m[a.cluster] ??= []).push(a); });
    return m;
  }, []);

  return (
    <div className="space-y-8 pb-10">
      <PageHeader
        eyebrow="Content Plan"
        title="Rank the blog. Get traffic. Earn."
        subtitle="A focused plan to make the Ready2UP blog actually rank — on Google, Bing, and AI search. Fewer, deeper articles in one cluster beat 100 scattered posts. Build topical authority, one piece at a time."
        accent="emerald"
      />

      {/* PROGRESS */}
      <div className="grid grid-cols-3 gap-3">
        <Stat label="Planned" value={stats.total} color="amber" />
        <Stat label="Published" value={stats.published} color="sky" />
        <Stat label="Ranking" value={stats.ranking} color="emerald" />
      </div>

      {/* STRATEGY */}
      <Card>
        <div className="flex items-center gap-2 mb-3">
          <Target className="w-5 h-5 text-amber-300" />
          <h3 className="font-display text-lg font-extrabold">The strategy in one minute</h3>
        </div>
        <ul className="space-y-1.5 text-sm text-slate-300 leading-relaxed">
          <li className="flex gap-2"><span className="text-amber-400 mt-1 text-xs">●</span><span><b>Focus on ONE cluster first: Hosting.</b> You’re an affiliate (real commissions) and these keywords are winnable.</span></li>
          <li className="flex gap-2"><span className="text-amber-400 mt-1 text-xs">●</span><span><b>Target long-tail, low-competition, high-intent keywords.</b> Not “Hostinger review” — instead “best hosting for a WordPress blog in India”.</span></li>
          <li className="flex gap-2"><span className="text-amber-400 mt-1 text-xs">●</span><span><b>Build clusters:</b> one pillar post + supporting posts, all linked together = topical authority.</span></li>
          <li className="flex gap-2"><span className="text-amber-400 mt-1 text-xs">●</span><span><b>Quality over quantity:</b> 2–3 deep, genuinely useful posts a week beats one thin post daily.</span></li>
          <li className="flex gap-2"><span className="text-amber-400 mt-1 text-xs">●</span><span><b>Be patient:</b> SEO takes 2–4 months to show. Consistency wins — don’t stop.</span></li>
        </ul>
      </Card>

      {/* ROADMAP */}
      <section className="space-y-4">
        {Object.entries(clusters).map(([cluster, items]) => {
          const Icon = CLUSTER_ICON[cluster] || FileText;
          return (
            <Card key={cluster}>
              <div className="flex items-center gap-2 mb-4">
                <Icon className="w-5 h-5 text-emerald-300" />
                <h3 className="font-display text-lg font-extrabold">{cluster} cluster</h3>
                <Pill color={cluster === 'Hosting' ? 'amber' : 'violet'}>{cluster === 'Hosting' ? 'Priority' : 'Next'}</Pill>
              </div>
              <ul className="space-y-2">
                {items.map((a) => {
                  const st = status[a.id] || 'Idea';
                  return (
                    <li key={a.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                      <button onClick={() => cycle(a.id)} title="Tap to change status" className="shrink-0">
                        <Pill color={STATUS_COLOR[st]}>{st}</Pill>
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-slate-100 flex items-center gap-2">
                          {a.pillar && <span title="Pillar article">🏛️</span>}
                          <span className="truncate">{a.title}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 truncate">🔑 {a.kw}</div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </Card>
          );
        })}
      </section>

      {/* CHECKLIST */}
      <Card>
        <div className="flex items-center gap-2 mb-3">
          <ListChecks className="w-5 h-5 text-sky-300" />
          <h3 className="font-display text-lg font-extrabold">Per-article checklist (SEO + AI search)</h3>
        </div>
        <ul className="space-y-1.5">
          {CHECKLIST.map((c, i) => (
            <li key={i} className="flex gap-2 text-sm text-slate-300 leading-relaxed"><span className="text-sky-400 mt-1 text-xs">✓</span><span>{c}</span></li>
          ))}
        </ul>
      </Card>

      {/* FIX EXISTING */}
      <Card>
        <div className="flex items-center gap-2 mb-3">
          <Wrench className="w-5 h-5 text-violet-300" />
          <h3 className="font-display text-lg font-extrabold">Fix the existing 100 posts</h3>
        </div>
        <ul className="space-y-1.5">
          {FIX_OLD.map((c, i) => (
            <li key={i} className="flex gap-2 text-sm text-slate-300 leading-relaxed"><span className="text-violet-400 mt-1 text-xs">●</span><span>{c}</span></li>
          ))}
        </ul>
      </Card>

      {/* GOAL */}
      <div className="rounded-2xl p-6 border border-emerald-500/15 bg-emerald-500/[0.04]">
        <div className="flex items-center gap-2 mb-2">
          <Rocket className="w-5 h-5 text-emerald-300" />
          <h3 className="font-display text-lg font-extrabold">The goal</h3>
        </div>
        <p className="text-sm text-slate-300 leading-relaxed">
          Finish the <b>Hosting cluster</b> (8 deep articles) in ~6 weeks at 2–3 a week. Internally link them all to the pillar.
          Expect first rankings in 2–3 months — then the AdSense + affiliate income starts compounding. We write them one at a time; I’ll draft each in simple, human English.
        </p>
      </div>
    </div>
  );
}

function Stat({ label, value, color = 'amber' }) {
  const map = { amber: 'text-amber-300', emerald: 'text-emerald-300', sky: 'text-sky-300' };
  return (
    <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3 text-center">
      <div className={`font-display text-2xl font-extrabold ${map[color]}`}>{value}</div>
      <div className="text-[10px] text-slate-500 mt-0.5 uppercase tracking-wider">{label}</div>
    </div>
  );
}
