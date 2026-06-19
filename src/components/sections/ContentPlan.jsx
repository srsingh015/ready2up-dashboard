import { useMemo, useState } from 'react';
import { FileText, Server, Bot, Target, ListChecks, Wrench, Rocket, Library, ChevronDown } from 'lucide-react';
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

// Everything already published on ready2up.com/blog, sorted into clean clusters.
const EXISTING = [
  {
    cat: 'Hosting & Domains', count: 15, action: 'Your money cluster. Keep & improve the best, link them all to the new pillar.',
    posts: [
      'Top Hosting Company in 2025: Features & Innovation',
      'Hostinger: Affordable Web Hosting for Small Businesses',
      'Top DreamHost Features: Secure & Reliable Hosting',
      'Boost Your Site with SiteGround’s Speed & Support',
      'Optimize Your Contabo VPS: Tips & Strategies',
      'Migrate to Cloudways: Easy Guide & Features',
      'DigitalOcean: Top Cloud Solution for Startups',
      'Vultr Hosting: Optimal Choice for Start-Ups',
      'Eco-Friendly GreenGeeks Web Hosting Benefits',
      'OVHcloud Hosting: Affordable, Secure & Scalable',
      'InMotion Hosting: Discover Top 5 Features',
      'Affordable Verpex Hosting: Secure, Scalable',
      'Hetzner Hosting: Powerful, Affordable Solutions',
      'Kamatera Hosting: High-Performance Cloud',
      'Namecheap: Top Domain Registrar & Hosting',
    ],
  },
  {
    cat: 'AI Tools', count: 9, action: 'Strong secondary cluster. Keep & refresh; great for AI-search traffic.',
    posts: [
      'Innovative Sites Like Lovable AI: Discover Top Picks',
      'Top Websites Like ChatGPT to Boost Productivity',
      'Claude vs ChatGPT vs Gemini: Best AI Model 2025',
      'AI Tools Transform Social Media Marketing in 2025',
      'Best AI Video Editing Tools 2025 for Creators',
      'Top AI Tools for Freelancers: Boost Productivity',
      'Top AI Tools for Resume Writing 2025',
      'Best AI Art Tool: MidJourney, DALL·E or Stable Diffusion?',
      'Best AI Tools for WordPress Developers 2025',
    ],
  },
  {
    cat: 'Email Marketing', count: 9, action: 'Lots of overlap — merge the weakest “vs” posts, keep the best 3–4.',
    posts: [
      'Master Brevo Email Marketing: Key Strategies',
      'Top 25 Email Marketing Platforms Worldwide',
      'HubSpot vs Mailchimp: Best 2025 Marketing Tool?',
      'Best Affordable Email Marketing Platforms for Startups',
      'Drip vs Mailchimp: Choose the Best Tool',
      'ActiveCampaign vs Brevo: Best for Small Biz',
      'Top 2025 Alternatives for Constant Contact',
      'Omnisend vs Klaviyo: Top for Ecommerce',
      'ConvertKit vs Mailchimp 2025: Best for Creators?',
    ],
  },
  {
    cat: 'SEO Tools', count: 4, action: 'Keep the comparisons; brutal competition, so target long-tail angles.',
    posts: [
      'Ahrefs Detailed Review 2025: Key SEO Insights',
      'Top Free SEO Tools for Small Businesses 2025',
      'SEMrush vs SpyFu: Best for Competitor Analysis?',
      'Ahrefs vs Moz: Top SEO Tools of 2025',
    ],
  },
  {
    cat: 'WordPress', count: 4, action: 'Keep & link into the hosting cluster — they pair naturally.',
    posts: [
      'Top WordPress Speed Services 2025',
      'Custom vs Ready-Made WordPress Themes 2025',
      'How to Build a Website with WordPress (Beginner Guide)',
      'Best Lightweight Plugins to Speed Up WordPress',
    ],
  },
  {
    cat: 'Web Design & Development', count: 4, action: 'Gold for agency leads — keep “near me” + builder comparisons.',
    posts: [
      'Top Website Designer Near Me: Boost Your Business',
      'Webflow vs Framer vs WordPress: Top Builder 2025',
      'Freelance Web Designers vs Agencies: How to Choose?',
      'WCAG Compliance Guide: Website Accessibility',
    ],
  },
  {
    cat: 'Other / older', count: 4, action: 'Off-cluster or older — update if useful, otherwise prune.',
    posts: [
      'Voice Search Optimization for Local Businesses',
      'QuillBot vs Grammarly (2024)',
      'ProWritingAid vs Grammarly (2024)',
      'Best Luma AI Alternatives for 3D Content (2024)',
    ],
  },
];

// Active affiliate partners (approved). Hosting article recommendations are
// built around these. Add Hostinger/Cloudways later once approved/worthwhile.
const AFFILIATES = [
  { name: 'Bluehost', via: 'Impact', use: 'Main WordPress-hosting pick — officially recommended by WordPress.org' },
  { name: 'Namecheap', via: 'Impact', use: 'Cheapest domains + budget hosting (EasyWP for WordPress)' },
  { name: 'Hosting.com', via: 'Impact', use: 'Reliable all-rounder hosting recommendation' },
];

export default function ContentPlan() {
  const [status, setStatus] = useCloudState('content_status', {});
  const [openCat, setOpenCat] = useState(null);

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

      {/* EXISTING CONTENT — categorized */}
      <section>
        <div className="flex items-center gap-2 mb-1">
          <Library className="w-5 h-5 text-sky-300" />
          <h3 className="font-display text-lg font-extrabold">Your published content, categorized</h3>
        </div>
        <p className="text-xs text-slate-500 mb-4">Everything already on the blog, grouped into clean clusters. Tap a category to see the posts and what to do with them.</p>
        <div className="space-y-2">
          {EXISTING.map((c) => {
            const isOpen = openCat === c.cat;
            return (
              <div key={c.cat} className="rounded-2xl border border-white/[0.06] bg-ink-800/60 overflow-hidden">
                <button
                  onClick={() => setOpenCat(isOpen ? null : c.cat)}
                  className="w-full flex items-center gap-3 p-4 text-left hover:bg-white/[0.02] transition-colors"
                  aria-expanded={isOpen}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm">{c.cat}</h4>
                      <Pill color="slate">{c.count}</Pill>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 truncate">{c.action}</p>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </button>
                {isOpen && (
                  <div className="px-4 pb-4 pt-0">
                    <div className="rounded-lg bg-amber-500/[0.06] border border-amber-500/15 p-2.5 mb-3 text-xs text-slate-300">
                      <span className="text-amber-300 font-bold">Plan: </span>{c.action}
                    </div>
                    <ul className="space-y-1">
                      {c.posts.map((p, i) => (
                        <li key={i} className="flex gap-2 text-sm text-slate-300 leading-relaxed">
                          <span className="text-slate-600 mt-1 text-xs">●</span><span>{p}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

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

      {/* AFFILIATE PARTNERS */}
      <Card>
        <div className="flex items-center gap-2 mb-3">
          <Library className="w-5 h-5 text-amber-300" />
          <h3 className="font-display text-lg font-extrabold">Affiliate partners — where the money links go</h3>
        </div>
        <p className="text-xs text-slate-500 mb-4">Every hosting article should include the right affiliate link naturally (honest recommendation, not spam). Confirm these and add your real links.</p>
        <ul className="space-y-2">
          {AFFILIATES.map((a, i) => (
            <li key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.05]">
              <Pill color="amber">{a.via}</Pill>
              <div className="flex-1 min-w-0">
                <div className="text-sm text-slate-100 font-semibold">{a.name}</div>
                <div className="text-[11px] text-slate-500">{a.use}</div>
              </div>
            </li>
          ))}
        </ul>
        <div className="mt-3 rounded-xl bg-emerald-500/[0.05] border border-emerald-500/15 p-3 text-xs text-slate-300 leading-relaxed">
          <span className="text-emerald-300 font-bold">Rule: </span>
          recommend honestly, disclose the affiliate relationship once on the page, and only link partners that genuinely fit the article. Trust ranks; spam doesn't.
        </div>
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
