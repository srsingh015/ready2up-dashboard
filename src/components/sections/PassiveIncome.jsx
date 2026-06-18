import { useMemo, useState } from 'react';
import {
  Smartphone, Wrench, FileText, Puzzle, Gamepad2, TrendingUp, Plus, Trash2,
  Trophy, Search, ExternalLink, Coins, Rocket,
} from 'lucide-react';
import { PageHeader, Card, Pill } from '../ui/Section.jsx';
import { useCloudState } from '../../lib/cloudSync.js';

const monthKey = () => new Date().toISOString().slice(0, 7); // YYYY-MM

// ── The priority order (what we build first → last) ──
const PILLARS = [
  {
    id: 'apps', icon: Smartphone, color: 'amber', priority: 1, badge: 'Priority #1',
    title: 'Android & iOS apps (freemium)',
    why: 'We already own a Google Play Console — that’s a paid head-start most people don’t have. Apps are our #1 passive-income bet.',
    points: [
      'Build useful "boring" utility apps with steady demand: document scanner, PDF tools, calculators (EMI / age / GST), QR generator, notes, habit tracker, wallpapers, exam-prep, file tools.',
      'Freemium model: free app with AdMob ads + a cheap "Remove ads / Pro" in-app purchase.',
      'ASO (App Store Optimization) = the SEO of apps: keyword-rich title + description, strong icon, clean screenshots.',
      'Use ONE codebase (Flutter or React Native) to ship many apps fast, then port the winners to iOS.',
      'Don’t overload ads — banner + occasional interstitial + rewarded. Too many ads kills ratings and earnings.',
      'Ask happy users for ratings; reviews drive ranking and installs.',
    ],
  },
  {
    id: 'tools', icon: Wrench, color: 'sky', priority: 2, badge: 'Priority #2',
    title: 'Tools / utilities website',
    why: 'One website with many free tools = lots of pageviews = AdSense income. Each tool is its own search magnet.',
    points: [
      'Many small tools on one fast site: image↔PDF, word counter, unit/currency converters, generators, calculators.',
      'Each tool targets one search phrase (e.g. "image to pdf", "word counter") — that’s your free traffic.',
      'Fast, mobile-first, clean. These are quick to build with AI.',
      'Monetize: AdSense + a few affiliate links + maybe a small premium feature.',
      'Cross-link tools to each other to keep people on the site longer.',
    ],
  },
  {
    id: 'blog', icon: FileText, color: 'emerald', priority: 3, badge: 'Priority #3',
    title: 'Blog that ranks (Google + AI search)',
    why: 'You have 100+ posts but none rank — so they earn nothing. The problem is almost never "not enough posts"; it’s intent, depth, and authority.',
    points: [
      'Why old posts don’t rank: too-competitive keywords, thin/generic content, no clear search intent, weak internal linking, few backlinks — or simply never properly indexed.',
      'Target LONG-TAIL, low-competition keywords with clear intent (use Google autocomplete, "People also ask", free Ubersuggest, Search Console).',
      'Write genuinely helpful, original, in-depth posts — show real experience (Google’s E-E-A-T).',
      'Build topic clusters: one pillar post + supporting posts, all internally linked = topical authority.',
      'On-page: keyword in title / H1 / URL / first 100 words; descriptive headings; image alt text; meta description.',
      'Technical: submit sitemap in Search Console, ensure indexing, add Article + FAQ structured data, keep it fast & mobile-friendly.',
      'For AI search (ChatGPT / Perplexity / Google AI): give clear, direct answers, concise definitions, FAQ sections, and tables — AI quotes the clearest, most structured source.',
      'Fix the old 100: update or merge the best, delete the thin ones, get a few quality backlinks. I’ll help write the ranking articles.',
    ],
  },
  {
    id: 'ext', icon: Puzzle, color: 'violet', priority: 4, badge: 'Expand',
    title: 'Browser extensions',
    why: 'You have 2 Chrome extensions with 300+ users. AdSense isn’t allowed in extensions — so we monetize differently and widen reach.',
    points: [
      'Monetize with: a free + paid "Pro" license (ExtensionPay / Gumroad), relevant affiliate links, and donations.',
      'Use the extension to funnel users to your tools website / blog — that drives AdSense pageviews (indirect income).',
      'Expand reach for free: publish the same extensions to Microsoft Edge Add-ons and Firefox Add-ons.',
      'Add a small "more tools by us" link inside the extension to cross-promote apps and the site.',
    ],
  },
  {
    id: 'games', icon: Gamepad2, color: 'rose', priority: 5, badge: 'Later',
    title: 'Games',
    why: 'High effort, time, and money. Park this for the near future — revisit once apps and the site are earning.',
    points: [
      'Hyper-casual games + AdMob can work but the market is crowded and production-heavy.',
      'Come back to this after the first 3 pillars produce steady income.',
    ],
  },
];

const SOURCES = ['AdSense', 'AdMob', 'Unity Ads', 'App purchases', 'Extension Pro', 'Affiliate', 'Other'];
const BLOG_STATUS = ['Idea', 'Writing', 'Published', 'Ranking'];
const STATUS_COLOR = { Idea: 'slate', Writing: 'amber', Published: 'sky', Ranking: 'emerald' };

const COLOR = {
  amber: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
  sky: 'bg-sky-500/10 text-sky-300 border-sky-500/20',
  emerald: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
  violet: 'bg-violet-500/10 text-violet-300 border-violet-500/20',
  rose: 'bg-rose-500/10 text-rose-300 border-rose-500/20',
};

const ASSETS = [
  { type: 'Chrome extension', name: 'Mouse Click Enabler', meta: '300+ users (combined)', url: 'https://chromewebstore.google.com/detail/mouse-click-enabler/hbbhfdjgphhgaolabinibnfflfoobiaj' },
  { type: 'Chrome extension', name: 'Tab URL Manager — Copy & Organize', meta: 'Publish to Edge + Firefox next', url: 'https://chromewebstore.google.com/detail/tab-url-manager-copy-orga/iopbocklmocfbbcodekblkmkjeanhojn' },
  { type: 'Blog', name: 'Company blog — 100+ posts', meta: 'Needs SEO rework to start ranking', url: null },
  { type: 'Ad accounts', name: 'AdSense · AdMob · Unity Ads', meta: 'Live, low balances (paused tools) — to be revived', url: null },
];

export default function PassiveIncome() {
  const thisMonth = monthKey();
  const [income, setIncome] = useCloudState('pi_income', []);
  const [blog, setBlog] = useCloudState('pi_blog', []);

  // income entry form
  const [amt, setAmt] = useState('');
  const [src, setSrc] = useState('AdSense');
  const [mon, setMon] = useState(thisMonth);
  // blog form
  const [bTitle, setBTitle] = useState('');
  const [bKeyword, setBKeyword] = useState('');

  function addIncome() {
    const v = Number(amt);
    if (!v || v <= 0) return;
    setIncome((arr) => [{ id: Date.now(), month: mon, source: src, amount: v }, ...arr]);
    setAmt('');
  }
  function removeIncome(id) { setIncome((arr) => arr.filter((x) => x.id !== id)); }

  const totals = useMemo(() => {
    const all = income.reduce((s, x) => s + x.amount, 0);
    const month = income.filter((x) => x.month === thisMonth).reduce((s, x) => s + x.amount, 0);
    const bySource = {};
    income.forEach((x) => { bySource[x.source] = (bySource[x.source] || 0) + x.amount; });
    return { all, month, bySource };
  }, [income, thisMonth]);

  function addBlog() {
    const t = bTitle.trim();
    if (!t) return;
    setBlog((arr) => [{ id: Date.now(), title: t, keyword: bKeyword.trim(), status: 'Idea' }, ...arr]);
    setBTitle(''); setBKeyword('');
  }
  function cycleStatus(id) {
    setBlog((arr) => arr.map((b) => {
      if (b.id !== id) return b;
      const i = BLOG_STATUS.indexOf(b.status);
      return { ...b, status: BLOG_STATUS[(i + 1) % BLOG_STATUS.length] };
    }));
  }
  function removeBlog(id) { setBlog((arr) => arr.filter((x) => x.id !== id)); }

  return (
    <div className="space-y-8 pb-10">
      <PageHeader
        eyebrow="Passive Income"
        title="Assets that earn while we sleep."
        subtitle="A second engine beside the agency: useful apps, a tools website, a blog that actually ranks, and our extensions. Build once, earn for years. Boring and consistent beats flashy."
        accent="emerald"
      />

      {/* PRIORITY ORDER */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <Rocket className="w-5 h-5 text-amber-300" />
          <h3 className="font-display text-lg font-extrabold">The build order — one at a time</h3>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-2">
          {PILLARS.map((p) => {
            const Icon = p.icon;
            return (
              <div key={p.id} className={`rounded-xl border p-3 ${COLOR[p.color]}`}>
                <div className="flex items-center justify-between mb-2">
                  <Icon className="w-5 h-5" />
                  <span className="text-[9px] font-bold uppercase tracking-wider opacity-80">{p.badge}</span>
                </div>
                <div className="text-xs font-bold leading-tight text-slate-100">{p.title}</div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* EARNINGS TRACKER */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <Coins className="w-5 h-5 text-emerald-300" />
          <h3 className="font-display text-lg font-extrabold">Earnings tracker</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-5">
          <Stat label="This month" value={`$${totals.month.toFixed(2)}`} color="emerald" />
          <Stat label="All-time logged" value={`$${totals.all.toFixed(2)}`} color="amber" />
          <Stat label="Sources" value={Object.keys(totals.bySource).length} color="sky" />
        </div>

        <div className="grid sm:grid-cols-4 gap-2 mb-4">
          <input type="month" value={mon} onChange={(e) => setMon(e.target.value)} className="bg-ink-900 border border-white/[0.08] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500/40" />
          <select value={src} onChange={(e) => setSrc(e.target.value)} className="bg-ink-900 border border-white/[0.08] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500/40">
            {SOURCES.map((s) => <option key={s}>{s}</option>)}
          </select>
          <input type="number" inputMode="decimal" value={amt} onChange={(e) => setAmt(e.target.value)} placeholder="Amount ($)" className="bg-ink-900 border border-white/[0.08] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500/40 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
          <button onClick={addIncome} className="inline-flex items-center justify-center gap-1.5 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-200 text-sm font-bold px-4 py-2 rounded-lg transition-colors">
            <Plus className="w-4 h-4" /> Log
          </button>
        </div>

        {income.length === 0 ? (
          <div className="text-center py-6 border border-dashed border-white/10 rounded-xl">
            <p className="text-sm text-slate-500">No earnings logged yet. Add your current AdSense / AdMob / Unity balances to start tracking.</p>
          </div>
        ) : (
          <ul className="space-y-1.5">
            {income.slice(0, 30).map((x) => (
              <li key={x.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.05] group text-sm">
                <span className="text-xs text-slate-500 w-16 shrink-0">{x.month}</span>
                <span className="flex-1 text-slate-200">{x.source}</span>
                <span className="font-bold text-emerald-300">${x.amount.toFixed(2)}</span>
                <button onClick={() => removeIncome(x.id)} className="text-slate-600 hover:text-rose-400 p-1 rounded sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"><Trash2 className="w-3.5 h-3.5" /></button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* PILLAR PLANS */}
      <section className="space-y-4">
        {PILLARS.map((p) => {
          const Icon = p.icon;
          return (
            <Card key={p.id}>
              <div className="flex items-start gap-3 mb-2 flex-wrap">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border ${COLOR[p.color]}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-base sm:text-lg">{p.title}</h3>
                    <Pill color={p.color === 'amber' ? 'amber' : p.color === 'emerald' ? 'emerald' : p.color === 'sky' ? 'sky' : p.color === 'violet' ? 'violet' : 'rose'}>{p.badge}</Pill>
                  </div>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">{p.why}</p>
                </div>
              </div>
              <ul className="mt-3 space-y-1.5">
                {p.points.map((pt, i) => (
                  <li key={i} className="flex gap-2 text-sm text-slate-300 leading-relaxed">
                    <span className="text-amber-400 mt-1 text-xs">●</span><span>{pt}</span>
                  </li>
                ))}
              </ul>
            </Card>
          );
        })}
      </section>

      {/* BLOG PLANNER */}
      <Card>
        <div className="flex items-center gap-2 mb-3">
          <Search className="w-5 h-5 text-emerald-300" />
          <h3 className="font-display text-lg font-extrabold">Blog planner — articles that rank</h3>
        </div>
        <p className="text-xs text-slate-500 mb-4">Add a target article with its main keyword. Tap the status to move it Idea → Writing → Published → Ranking. I’ll help you write each one to rank on Google and AI search.</p>
        <div className="grid sm:grid-cols-[1fr_1fr_auto] gap-2 mb-4">
          <input value={bTitle} onChange={(e) => setBTitle(e.target.value)} placeholder="Article title / topic" className="bg-ink-900 border border-white/[0.08] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500/40 placeholder-slate-600" />
          <input value={bKeyword} onChange={(e) => setBKeyword(e.target.value)} placeholder="Target keyword (long-tail)" className="bg-ink-900 border border-white/[0.08] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500/40 placeholder-slate-600" />
          <button onClick={addBlog} className="inline-flex items-center justify-center gap-1.5 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-200 text-sm font-bold px-4 py-2 rounded-lg transition-colors"><Plus className="w-4 h-4" /> Add</button>
        </div>
        {blog.length === 0 ? (
          <div className="text-center py-6 border border-dashed border-white/10 rounded-xl">
            <p className="text-sm text-slate-500">No articles planned yet. Start with 5 long-tail topics your audience actually searches.</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {blog.map((b) => (
              <li key={b.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] group">
                <button onClick={() => cycleStatus(b.id)} title="Tap to change status">
                  <Pill color={STATUS_COLOR[b.status]}>{b.status}</Pill>
                </button>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-slate-100 truncate">{b.title}</div>
                  {b.keyword && <div className="text-[11px] text-slate-500 truncate">🔑 {b.keyword}</div>}
                </div>
                <button onClick={() => removeBlog(b.id)} className="text-slate-600 hover:text-rose-400 p-1.5 rounded-lg hover:bg-white/5 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"><Trash2 className="w-3.5 h-3.5" /></button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* CURRENT ASSETS */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <Trophy className="w-5 h-5 text-amber-300" />
          <h3 className="font-display text-lg font-extrabold">What we already own</h3>
        </div>
        <ul className="space-y-2">
          {ASSETS.map((a, i) => (
            <li key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.05]">
              <Pill color="slate">{a.type}</Pill>
              <div className="flex-1 min-w-0">
                <div className="text-sm text-slate-100 truncate">{a.name}</div>
                <div className="text-[11px] text-slate-500 truncate">{a.meta}</div>
              </div>
              {a.url && (
                <a href={a.url} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-amber-300 p-1.5 rounded-lg hover:bg-white/5 shrink-0" aria-label="Open">
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
            </li>
          ))}
        </ul>
        <div className="mt-4 rounded-xl bg-emerald-500/[0.05] border border-emerald-500/15 p-3 text-xs text-slate-300 leading-relaxed">
          <span className="text-emerald-300 font-bold">Next move: </span>
          revive the paused ad accounts by shipping 2–3 useful apps and turning the blog’s best posts into ranking articles. Small, consistent shipping — one asset at a time.
        </div>
      </Card>
    </div>
  );
}

function Stat({ label, value, color = 'amber' }) {
  const map = { amber: 'text-amber-300', emerald: 'text-emerald-300', sky: 'text-sky-300' };
  return (
    <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3 text-center">
      <div className={`font-display text-xl font-extrabold ${map[color]}`}>{value}</div>
      <div className="text-[10px] text-slate-500 mt-0.5 uppercase tracking-wider">{label}</div>
    </div>
  );
}
