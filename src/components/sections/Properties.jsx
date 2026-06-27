import { useState, useMemo } from 'react';
import * as Icons from 'lucide-react';
import { motion } from 'framer-motion';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { PageHeader, Card, Pill, StatCard } from '../ui/Section.jsx';
import { formatInr } from '../../utils/format.js';

const COLOR = {
  emerald: { soft: 'bg-emerald-500/10 border-emerald-500/15 text-emerald-300', bar: 'from-emerald-500 to-emerald-700' },
  sky: { soft: 'bg-sky-500/10 border-sky-500/15 text-sky-300', bar: 'from-sky-500 to-sky-700' },
  violet: { soft: 'bg-violet-500/10 border-violet-500/15 text-violet-300', bar: 'from-violet-500 to-violet-700' },
  amber: { soft: 'bg-amber-500/10 border-amber-500/15 text-amber-300', bar: 'from-amber-500 to-amber-700' },
};

export default function Properties({ data }) {
  const { properties } = data;
  const [tab, setTab] = useState('affiliate');

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Adjacent Income Engines"
        title={properties.intro.title}
        subtitle={properties.intro.subtitle}
        accent="emerald"
      />

      <div className="grid-auto-stats gap-3">
        {properties.intro.metrics.map((m, i) => (
          <StatCard key={i} label={m.label} value={m.value} color={i % 2 ? 'emerald' : 'amber'} />
        ))}
      </div>

      {/* TABS */}
      <div className="flex gap-1.5 p-1 bg-ink-800/60 rounded-xl border border-white/[0.06] inline-flex flex-wrap">
        <TabBtn active={tab === 'affiliate'} onClick={() => setTab('affiliate')} icon={Icons.Link2}>Affiliate Programs</TabBtn>
        <TabBtn active={tab === 'calculator'} onClick={() => setTab('calculator')} icon={Icons.Calculator}>Calculator</TabBtn>
        <TabBtn active={tab === 'properties'} onClick={() => setTab('properties')} icon={Icons.Layers}>Owned Properties</TabBtn>
        <TabBtn active={tab === 'social'} onClick={() => setTab('social')} icon={Icons.MessageCircle}>Social Media (parked)</TabBtn>
      </div>

      {tab === 'affiliate' && <AffiliateView properties={properties} />}
      {tab === 'calculator' && <CalculatorView properties={properties} />}
      {tab === 'properties' && <OwnedPropertiesView properties={properties} />}
      {tab === 'social' && <SocialView properties={properties} />}
    </div>
  );
}

function TabBtn({ active, onClick, icon: Icon, children }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
        active ? 'bg-amber-500/15 text-amber-200' : 'text-slate-400 hover:text-slate-200'
      }`}
    >
      <Icon className="w-4 h-4" />
      {children}
    </button>
  );
}

// ============================================================
// AFFILIATE TAB
// ============================================================
function AffiliateView({ properties }) {
  return (
    <div className="space-y-6">
      <div className="grid-auto-cards gap-4">
        {properties.affiliatePrograms.map((p) => (
          <Card key={p.id} className="!p-0 overflow-hidden">
            <div className="p-5 bg-gradient-to-br from-white/[0.03] to-transparent border-b border-white/[0.06]">
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <span className="text-2xl">{p.logo}</span>
                <h3 className="font-display text-lg font-extrabold">{p.name}</h3>
              </div>
              <Pill color="emerald">{p.status}</Pill>
              <div className="grid grid-cols-2 gap-2 mt-3 text-[11px] text-slate-400">
                <Detail label="Cookie window" val={p.cookieWindow} />
                <Detail label="Payout" val={p.payoutSchedule} />
                <Detail label="Currency" val={p.currency} />
                <Detail label="Model" val={p.payoutModel} />
              </div>
            </div>
            <div className="p-5">
              <div className="text-[10px] font-bold uppercase tracking-widest text-emerald-300 mb-2">Commission tiers</div>
              <div className="space-y-1.5">
                {p.tiers.map((t, i) => (
                  <div key={i} className="flex items-start justify-between gap-2 p-2.5 rounded-lg bg-white/[0.03] border border-white/[0.05]">
                    <div className="text-xs text-slate-300 flex-1 min-w-0">
                      <div className="font-semibold">{t.sku}</div>
                      {t.notes && <div className="text-[11px] text-slate-500 mt-0.5">{t.notes}</div>}
                    </div>
                    <div className="font-display text-xs font-extrabold gold-text whitespace-nowrap">{t.payout}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-5 pt-0">
              <div className="text-[10px] font-bold uppercase tracking-widest text-amber-300 mb-2">Strategy notes</div>
              <ul className="space-y-1.5">
                {p.strategicNotes.map((n, i) => (
                  <li key={i} className="flex gap-2 text-xs text-slate-400 leading-relaxed">
                    <span className="text-amber-400 mt-1">▸</span><span>{n}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Card>
        ))}
      </div>

      <Card>
        <div className="flex items-center gap-2 mb-3">
          <Icons.Workflow className="w-5 h-5 text-violet-300" />
          <h3 className="font-display text-lg font-extrabold">Integrating affiliates into your sales process</h3>
        </div>
        <ul className="space-y-1.5">
          {properties.affiliateStrategy.integrationIntoSales.map((s, i) => (
            <li key={i} className="flex gap-2 text-sm text-slate-300 leading-relaxed">
              <span className="text-violet-400 mt-1">●</span><span>{s}</span>
            </li>
          ))}
        </ul>
      </Card>

      <Card>
        <div className="flex items-center gap-2 mb-3">
          <Icons.Megaphone className="w-5 h-5 text-amber-300" />
          <h3 className="font-display text-lg font-extrabold">Content play (the long-term lever)</h3>
        </div>
        <ul className="space-y-1.5">
          {properties.affiliateStrategy.contentPlay.map((s, i) => (
            <li key={i} className="flex gap-2 text-sm text-slate-300 leading-relaxed">
              <span className="text-amber-400 mt-1">●</span><span>{s}</span>
            </li>
          ))}
        </ul>
      </Card>

      <Card>
        <div className="flex items-center gap-2 mb-3">
          <Icons.Shield className="w-5 h-5 text-rose-300" />
          <h3 className="font-display text-lg font-extrabold">Affiliate ethics & rules</h3>
        </div>
        <ul className="space-y-1.5">
          {properties.affiliateStrategy.rules.map((s, i) => (
            <li key={i} className="flex gap-2 text-sm text-slate-300 leading-relaxed">
              <span className="text-rose-400 mt-1">●</span><span>{s}</span>
            </li>
          ))}
        </ul>
      </Card>

      {/* RECOMMENDED PROGRAMS TO JOIN */}
      {properties.recommendedPrograms && (
        <RecommendedPrograms programs={properties.recommendedPrograms} networks={properties.affiliateNetworks} />
      )}
    </div>
  );
}

function RecommendedPrograms({ programs, networks }) {
  const [filter, setFilter] = useState('All');
  const categories = useMemo(() => ['All', ...Array.from(new Set(programs.map((p) => p.category)))], [programs]);
  const filtered = filter === 'All' ? programs : programs.filter((p) => p.category === filter);

  return (
    <div className="space-y-4 pt-2">
      <div className="flex items-center gap-2">
        <Icons.Plus className="w-5 h-5 text-emerald-300" />
        <h3 className="font-display text-lg font-extrabold">More programs worth joining</h3>
      </div>
      <p className="text-sm text-slate-400 leading-relaxed -mt-1">
        Researched from 2026 market data. Each one fits work you already do — recommend the hosting / tool you set the client up on, and get paid for it. Prioritize the <span className="text-emerald-300 font-semibold">recurring</span> ones — they compound.
      </p>

      {/* category filter */}
      <div className="flex gap-1.5 overflow-x-auto -mx-1 px-1">
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setFilter(c)}
            className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors border ${
              filter === c ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-200' : 'border-white/[0.08] text-slate-400 hover:text-slate-200'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="grid-auto-cards-sm gap-3">
        {filtered.map((p) => (
          <div key={p.id} className="rounded-2xl bg-ink-800/60 border border-white/[0.06] p-4 card-hover flex flex-col">
            <div className="flex items-start gap-2 mb-2">
              <span className="text-2xl leading-none">{p.logo}</span>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-sm leading-tight">{p.name}</h4>
                <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mt-0.5">{p.category}</div>
              </div>
              <span className={`tag border shrink-0 ${p.type === 'recurring' ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/25' : 'bg-amber-500/10 text-amber-300 border-amber-500/25'}`}>
                {p.type === 'recurring' ? '↻ Recurring' : '$ One-off'}
              </span>
            </div>
            <div className="text-[13px] font-semibold gold-text mb-1">{p.commission}</div>
            <div className="text-[11px] text-slate-500 mb-2">Cookie: {p.cookie} · Effort: {p.effort}</div>
            <p className="text-xs text-slate-400 leading-relaxed mb-2"><span className="text-slate-300 font-semibold">Best for:</span> {p.bestFor}</p>
            <p className="text-xs text-slate-400 leading-relaxed flex-1">{p.why}</p>
            <div className="text-[11px] text-sky-300 mt-3 pt-3 border-t border-white/[0.06] font-mono truncate">{p.url}</div>
          </div>
        ))}
      </div>

      {networks && (
        <Card>
          <div className="flex items-center gap-2 mb-3">
            <Icons.Network className="w-5 h-5 text-violet-300" />
            <h4 className="font-display text-base font-extrabold">Where to apply</h4>
          </div>
          <div className="space-y-2">
            {networks.map((n, i) => (
              <div key={i} className="flex gap-3 text-sm">
                <span className="font-semibold text-slate-200 shrink-0 w-40">{n.name}</span>
                <span className="text-slate-400 text-xs leading-relaxed flex-1">{n.note}</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

// ============================================================
// CALCULATOR TAB — advanced model
// One-off bounties + recurring commissions + client growth ramp + 24-mo projection
// ============================================================
function CalculatorView({ properties }) {
  // Inputs
  const [clientsPerMonth, setClientsPerMonth] = useState(4);
  const [growthPct, setGrowthPct] = useState(6); // monthly growth in clients onboarded
  const [hostingAttach, setHostingAttach] = useState(60); // % who take a hosting referral
  const [avgHostingInr, setAvgHostingInr] = useState(8000); // avg one-off hosting bounty
  const [domainAttach, setDomainAttach] = useState(85); // % who buy a domain
  const [toolsAttach, setToolsAttach] = useState(40); // % who take a recurring tool (email/design/SEO)
  const [avgRecurringInr, setAvgRecurringInr] = useState(900); // avg recurring per tool client / mo
  const [recurringChurn, setRecurringChurn] = useState(4); // % of recurring base lost per month
  const [renewalRate, setRenewalRate] = useState(70); // % of hosting that renews each year (one-off again)

  const DOMAIN_AVG_INR = 1200;

  // Build a 24-month projection
  const projection = useMemo(() => {
    const rows = [];
    let recurringBase = 0; // accumulated monthly recurring revenue
    let clients = clientsPerMonth;
    let cumulative = 0;

    for (let m = 1; m <= 24; m++) {
      // One-off commissions this month (hosting bounties + domains)
      const hostingDeals = clients * (hostingAttach / 100);
      const domainDeals = clients * (domainAttach / 100);
      const oneOff =
        hostingDeals * avgHostingInr +
        domainDeals * DOMAIN_AVG_INR;

      // Renewals: hosting referred ~12 months ago renews (one-off again)
      let renewals = 0;
      if (m > 12) {
        const yearAgoClients = rows[m - 13]?.clients ?? 0;
        renewals = yearAgoClients * (hostingAttach / 100) * avgHostingInr * (renewalRate / 100);
      }

      // Recurring: new tool clients add to the base; base churns a bit each month
      const newRecurringClients = clients * (toolsAttach / 100);
      recurringBase = recurringBase * (1 - recurringChurn / 100) + newRecurringClients * avgRecurringInr;

      const monthTotal = oneOff + renewals + recurringBase;
      cumulative += monthTotal;

      rows.push({
        month: `M${m}`,
        clients: Math.round(clients),
        oneOff: Math.round(oneOff + renewals),
        recurring: Math.round(recurringBase),
        total: Math.round(monthTotal),
        cumulative: Math.round(cumulative),
      });

      // Grow clients for next month
      clients = clients * (1 + growthPct / 100);
    }
    return rows;
  }, [clientsPerMonth, growthPct, hostingAttach, avgHostingInr, domainAttach, toolsAttach, avgRecurringInr, recurringChurn, renewalRate]);

  const month1 = projection[0];
  const month12 = projection[11];
  const month24 = projection[23];
  const total24 = month24.cumulative;

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex items-center gap-2 mb-2">
          <Icons.Calculator className="w-5 h-5 text-amber-300" />
          <h3 className="font-display text-lg font-extrabold">Advanced affiliate income model</h3>
        </div>
        <p className="text-xs text-slate-400 mb-5 leading-relaxed">
          Models both <span className="text-amber-300 font-semibold">one-off bounties</span> (hosting, domains) and
          <span className="text-emerald-300 font-semibold"> recurring commissions</span> (email, design, SEO tools) that compound monthly —
          plus client growth and renewals. Drag to model your real numbers.
        </p>

        <div className="grid sm:grid-cols-2 gap-x-6">
          <Slider label="Clients onboarded / month (start)" value={clientsPerMonth} setValue={setClientsPerMonth} min={1} max={30} unit="" />
          <Slider label="Monthly client growth" value={growthPct} setValue={setGrowthPct} min={0} max={20} unit="%" />
          <Slider label="% who take a hosting referral" value={hostingAttach} setValue={setHostingAttach} min={0} max={100} unit="%" />
          <Slider label="Avg hosting bounty" value={avgHostingInr} setValue={setAvgHostingInr} min={1000} max={20000} step={500} unit="" money />
          <Slider label="% who buy a domain" value={domainAttach} setValue={setDomainAttach} min={0} max={100} unit="%" />
          <Slider label="% who take a recurring tool" value={toolsAttach} setValue={setToolsAttach} min={0} max={100} unit="%" />
          <Slider label="Avg recurring / tool client / mo" value={avgRecurringInr} setValue={setAvgRecurringInr} min={200} max={5000} step={100} unit="" money />
          <Slider label="Monthly recurring churn" value={recurringChurn} setValue={setRecurringChurn} min={0} max={15} unit="%" />
          <Slider label="Hosting yearly renewal rate" value={renewalRate} setValue={setRenewalRate} min={0} max={100} unit="%" />
        </div>
      </Card>

      {/* Headline projections */}
      <div className="grid-auto-stats gap-3">
        <CalcStat label="Month 1" value={formatInr(month1.total)} color="amber" sub="affiliate income" />
        <CalcStat label="Month 12" value={formatInr(month12.total)} color="emerald" sub={`${month12.clients} clients/mo`} />
        <CalcStat label="Month 24" value={formatInr(month24.total)} color="emerald" sub={`recurring: ${formatInr(month24.recurring)}/mo`} />
        <CalcStat label="24-month total" value={formatInr(total24)} color="violet" sub="cumulative" />
      </div>

      {/* Projection chart */}
      <Card>
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div>
            <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-0.5">24-Month Projection</div>
            <div className="font-display text-lg font-bold">One-off vs recurring, stacked</div>
          </div>
          <div className="flex items-center gap-3 text-[11px]">
            <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-amber-400" /> One-off</span>
            <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-emerald-400" /> Recurring</span>
          </div>
        </div>
        <div className="h-64 -mx-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={projection}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="month" stroke="#94a3b8" tick={{ fontSize: 9 }} interval={1} tickLine={false} axisLine={false} />
              <YAxis stroke="#94a3b8" tick={{ fontSize: 9 }} tickFormatter={(v) => formatInr(v, { short: true })} tickLine={false} axisLine={false} width={48} />
              <Tooltip
                contentStyle={{ background: '#1a1530', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, fontSize: 12, color: '#fff' }}
                labelStyle={{ color: '#fff' }}
                itemStyle={{ color: '#fff' }}
                formatter={(v, n) => [formatInr(v), n === 'oneOff' ? 'One-off' : 'Recurring']}
              />
              <Bar dataKey="oneOff" stackId="a" fill="#fbbf24" radius={[0, 0, 0, 0]} />
              <Bar dataKey="recurring" stackId="a" fill="#34d399" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p className="text-[11px] text-slate-500 mt-3 leading-relaxed">
          Notice how the <span className="text-emerald-300 font-semibold">green recurring layer</span> grows every month — that's the magic of recurring affiliate programs. One-off bounties pay once; recurring pays for years.
        </p>
      </Card>

      {/* Cumulative line */}
      <Card>
        <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-3">Cumulative affiliate income over 24 months</div>
        <div className="h-48 -mx-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={projection}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="month" stroke="#94a3b8" tick={{ fontSize: 9 }} interval={1} tickLine={false} axisLine={false} />
              <YAxis stroke="#94a3b8" tick={{ fontSize: 9 }} tickFormatter={(v) => formatInr(v, { short: true })} tickLine={false} axisLine={false} width={48} />
              <Tooltip
                contentStyle={{ background: '#1a1530', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, fontSize: 12, color: '#fff' }}
                formatter={(v) => [formatInr(v), 'Cumulative']}
              />
              <Line type="monotone" dataKey="cumulative" stroke="#a78bfa" strokeWidth={2.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className="rounded-xl bg-amber-500/[0.05] border border-amber-500/15 p-4 text-sm text-slate-300 leading-relaxed">
        <span className="font-semibold text-amber-300">How to read this: </span>
        This is income layered <em>on top</em> of your project + care-plan revenue, for work you're already doing (recommending hosting, domains, and tools you set up anyway). The recurring layer is the compounding engine — every tool client you refer keeps paying you monthly. Stack 40 recurring referrals and that alone is a meaningful salary.
      </div>
    </div>
  );
}

function Slider({ label, value, setValue, min, max, step = 1, unit, money }) {
  return (
    <div className="mb-5">
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm font-semibold text-slate-200">{label}</label>
        <div className="font-display font-extrabold text-amber-300 text-base whitespace-nowrap">
          {money ? formatInr(value) : `${value}${unit}`}
        </div>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => setValue(Number(e.target.value))}
        className="w-full accent-amber-500"
      />
    </div>
  );
}

function CalcStat({ label, value, color, sub }) {
  const colorMap = { amber: 'text-amber-300', emerald: 'text-emerald-300', violet: 'text-violet-300' };
  return (
    <Card>
      <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">{label}</div>
      <div className={`font-display text-2xl font-extrabold ${colorMap[color]}`}>{value}</div>
      {sub && <div className="text-[11px] text-slate-500 mt-1.5">{sub}</div>}
    </Card>
  );
}

function PartnerLine({ name, amount, pct, color }) {
  const colorMap = { emerald: 'bg-emerald-500', amber: 'bg-amber-500', violet: 'bg-violet-500' };
  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1.5">
        <span className="text-slate-200 font-semibold">{name}</span>
        <span className="font-display font-extrabold gold-text">{formatInr(amount)}/mo</span>
      </div>
      <div className="h-2 bg-white/[0.04] rounded-full overflow-hidden">
        <div className={`h-full ${colorMap[color]} transition-all`} style={{ width: `${Math.min(100, pct)}%` }} />
      </div>
    </div>
  );
}

// ============================================================
// PROPERTIES TAB
// ============================================================
function OwnedPropertiesView({ properties }) {
  return (
    <div className="space-y-6">
      <p className="text-sm text-slate-400 leading-relaxed max-w-2xl">{properties.ownedProperties.overview}</p>

      <div className="space-y-4">
        {properties.ownedProperties.categories.map((cat) => {
          const Icon = Icons[cat.icon] || Icons.Box;
          const c = COLOR[cat.color] || COLOR.amber;
          return (
            <Card key={cat.id}>
              <div className="flex items-start gap-4 flex-wrap mb-3">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${c.bar} text-ink-950 flex items-center justify-center shrink-0`}>
                  <Icon className="w-5 h-5" strokeWidth={2.5} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <Pill color={cat.color}>Priority {cat.priority}</Pill>
                  </div>
                  <h3 className="font-display text-lg sm:text-xl font-extrabold leading-tight">{cat.name}</h3>
                  <div className="text-xs text-slate-400 mt-1">Revenue model: {cat.revenueModel}</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Year-2 target</div>
                  <div className="font-display text-base font-extrabold gold-text whitespace-nowrap">{formatInr(cat.targetMonthlyInr.from)}–{formatInr(cat.targetMonthlyInr.year2)}/mo</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">First ₹: {cat.timeToFirstRupee}</div>
                </div>
              </div>

              <div className={`rounded-xl ${c.soft} border p-4 mb-4`}>
                <div className="text-[10px] font-bold uppercase tracking-widest mb-1.5">Why this priority</div>
                <p className="text-sm text-slate-200 leading-relaxed">{cat.whyPriority}</p>
              </div>

              {cat.bestApps && <BulletBlock title="Best app types for you" items={cat.bestApps} />}
              {cat.bestNiches && <BulletBlock title="Best niches" items={cat.bestNiches} />}
              {cat.bestIdeas && <BulletBlock title="Best ideas" items={cat.bestIdeas} />}
              {cat.avoidThese && <BulletBlock title="Avoid these" items={cat.avoidThese} accent="rose" />}
              {cat.playbook && <BulletBlock title="The playbook" items={cat.playbook} accent="emerald" />}
              {cat.kpis && <BulletBlock title="KPIs to hit" items={cat.kpis} accent="emerald" />}

              {cat.tools && (
                <div className="mt-4 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">Stack</div>
                  <div className="text-xs text-slate-300">{cat.tools.join(' · ')}</div>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      <Card>
        <div className="flex items-center gap-2 mb-3">
          <Icons.Calendar className="w-5 h-5 text-violet-300" />
          <h3 className="font-display text-lg font-extrabold">When to activate each property</h3>
        </div>
        <div className="space-y-2">
          {properties.ownedProperties.activationTimeline.map((n, i) => (
            <div key={i} className="flex gap-3 items-start py-2.5 border-b border-white/[0.04] last:border-0">
              <div className="text-[10px] font-bold tracking-widest text-violet-300 uppercase w-28 shrink-0 pt-0.5">{n.month}</div>
              <div className="text-sm text-slate-300 flex-1 leading-relaxed">{n.what}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ============================================================
// SOCIAL TAB (PARKED)
// ============================================================
function SocialView({ properties }) {
  const sm = properties.socialMediaManagement;
  return (
    <div className="space-y-6">
      <Card className="!border-amber-500/20 bg-gradient-to-br from-amber-500/[0.04] to-transparent">
        <div className="flex items-center gap-2 mb-3">
          <Icons.PauseCircle className="w-5 h-5 text-amber-300" />
          <h3 className="font-display text-lg font-extrabold">Social Media Management — parked, not forgotten</h3>
          <Pill color="amber">Activate later</Pill>
        </div>
        <p className="text-sm text-slate-300 leading-relaxed">{sm.reasoning}</p>
      </Card>

      <Card>
        <div className="flex items-center gap-2 mb-3">
          <Icons.GitBranch className="w-5 h-5 text-emerald-300" />
          <h3 className="font-display text-lg font-extrabold">When to activate (3 hard triggers)</h3>
        </div>
        <ul className="space-y-2">
          {sm.whenToActivate.map((t, i) => (
            <li key={i} className="flex gap-2 text-sm text-slate-300 leading-relaxed">
              <span className="text-emerald-400 mt-1">✓</span><span>{t}</span>
            </li>
          ))}
        </ul>
      </Card>

      <Card>
        <h3 className="font-display text-lg font-extrabold mb-3">Future packages (when activated)</h3>
        <div className="grid sm:grid-cols-3 gap-3">
          {sm.futurePackages.map((p, i) => (
            <div key={i} className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4">
              <div className="font-bold text-sm mb-1">{p.tier}</div>
              <div className="font-display text-xl font-extrabold gold-text">{formatInr(p.priceInr)}/mo</div>
              <div className="text-xs text-slate-400 mt-2 leading-relaxed">{p.scope}</div>
            </div>
          ))}
        </div>
      </Card>

      <div className="rounded-xl bg-violet-500/[0.05] border border-violet-500/15 p-4 text-sm text-slate-300 leading-relaxed">
        <ul className="space-y-1.5">
          {sm.notes.map((n, i) => (
            <li key={i} className="flex gap-2"><span className="text-violet-400 mt-1">●</span><span>{n}</span></li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function Detail({ label, val }) {
  return (
    <div>
      <div className="text-[9px] uppercase tracking-widest text-slate-500 font-bold">{label}</div>
      <div className="text-[11px] text-slate-300 mt-0.5">{val}</div>
    </div>
  );
}

function BulletBlock({ title, items, accent = 'amber' }) {
  const accentMap = { amber: 'text-amber-300', emerald: 'text-emerald-300', sky: 'text-sky-300', violet: 'text-violet-300', rose: 'text-rose-300' };
  return (
    <div className="mt-4">
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
