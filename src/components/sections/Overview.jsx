import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, Target, TrendingUp, Repeat, ShieldCheck } from 'lucide-react';
import { Card, PageHeader, Pill, StatCard, Divider } from '../ui/Section.jsx';
import { formatInr } from '../../utils/format.js';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, AreaChart, Area } from 'recharts';

export default function Overview({ data, onNavigate }) {
  const { meta, vision, roadmap, months } = data;

  const trajectoryData = months.map((m) => ({
    month: `M${m.n}`,
    target: Math.round((m.revenueTargetInr.from + m.revenueTargetInr.to) / 2),
  }));

  return (
    <div className="space-y-10">
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-3xl p-7 sm:p-10 petal-bg"
        style={{
          background: 'var(--hero-bg)',
          border: '1px solid var(--hero-border)',
        }}
      >
        <div className="absolute -top-32 -right-24 w-96 h-96 rounded-full opacity-30 blur-3xl pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(245,158,11,0.5), transparent 70%)' }} />
        <div className="relative">
          <div className="text-xs uppercase tracking-widest text-slate-400 mb-2">Hello, {meta.ownerName.split(' ')[0]} 👋</div>
          <h1 className="font-display text-3xl sm:text-5xl font-extrabold leading-[1.1] mb-4">
            Build a <span className="gold-text">real, sustainable</span><br />
            agency. Step by step.
          </h1>
          <p className="text-slate-400 text-base max-w-2xl leading-relaxed mb-7">
            5+ years of skill. 100% commitment. A careful budget. This is the operating system for going from a fresh restart to a steady ₹8–12L/month engine — the foundation that makes the ₹5 Crore vision real, fundable, and inevitable.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <HeroStat val={`${formatInr(meta.realTarget.monthlyInrLow, { short: true })}–${formatInr(meta.realTarget.monthlyInrHigh, { short: true })}`} label="Target / month" tone="emerald" />
            <HeroStat val="24" label="Months" />
            <HeroStat val="5" label="Phases" />
            <HeroStat val="100%" label="Full-time" tone="amber" />
          </div>
        </div>
      </motion.section>

      <section className="grid sm:grid-cols-2 gap-4">
        <DreamBox label="Goal · Stage 1" amount="₹5 Crore" period="The first goal — not the last" body={meta.northStar.statement} accent="violet" />
        <DreamBox label="The 24-Month Engine" amount="₹8–12L / month" period="What we ship in the first 24 months" body={meta.realTarget.statement} accent="emerald" />
      </section>

      {/* Revenue trajectory */}
      <Card>
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div>
            <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">Revenue Trajectory</div>
            <div className="font-display text-lg font-bold">24-month plan: midpoint targets per month</div>
          </div>
          <Pill color="amber">Plan, not actuals</Pill>
        </div>
        <div className="h-56 -mx-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trajectoryData}>
              <defs>
                <linearGradient id="revArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="month" stroke="#475569" tick={{ fontSize: 10 }} interval={1} tickLine={false} axisLine={false} />
              <YAxis stroke="#475569" tick={{ fontSize: 10 }} tickFormatter={(v) => formatInr(v, { short: true })} tickLine={false} axisLine={false} width={50} />
              <Tooltip
                contentStyle={{ background: '#0e0e1a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, fontSize: 12 }}
                labelStyle={{ color: '#f1f5f9' }}
                formatter={(value) => [formatInr(value, { short: true }), 'Target']}
              />
              <Area type="monotone" dataKey="target" stroke="#f59e0b" strokeWidth={2} fill="url(#revArea)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Phases at a glance */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl font-extrabold">Roadmap at a glance</h2>
          <button onClick={() => onNavigate?.('roadmap')} className="text-xs text-amber-300 hover:text-amber-200 inline-flex items-center gap-1">
            See full roadmap <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {roadmap.map((p) => (
            <PhaseCardMini key={p.id} p={p} />
          ))}
        </div>
      </section>

      <Divider />

      {/* Anti-goals */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <ShieldCheck className="w-5 h-5 text-rose-400" />
          <h2 className="font-display text-xl font-extrabold">What we are NOT doing</h2>
        </div>
        <p className="text-sm text-slate-500 mb-5">Hard-won. Each one of these is a previous mistake we are not making again.</p>
        <div className="grid sm:grid-cols-2 gap-3">
          {meta.antiGoals.map((g, i) => (
            <Card key={i} className="!p-4">
              <div className="flex gap-3">
                <div className="text-rose-400 font-bold text-lg leading-none mt-0.5">⛔</div>
                <div className="text-sm text-slate-300 leading-relaxed">{g}</div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Headline KPIs the dashboard tracks */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Target className="w-5 h-5 text-amber-300" />
          <h2 className="font-display text-xl font-extrabold">The numbers we track</h2>
        </div>
        <p className="text-sm text-slate-500 mb-5">If a metric is not on this list, it is a vanity metric. These are the only ones that matter.</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {meta.kpis.map((k) => (
            <Card key={k.id}>
              <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">{k.label}</div>
              <div className="font-display text-2xl font-extrabold gold-text">{k.unit === 'INR/mo' || k.unit === 'INR' ? formatInr(k.target) : k.target}{k.unit && !['INR/mo', 'INR'].includes(k.unit) ? ` ${k.unit}` : k.unit === 'INR/mo' ? '/mo' : ''}</div>
              <div className="text-xs text-slate-500 mt-1.5 leading-relaxed">{k.why}</div>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}

function HeroStat({ val, label, tone = 'slate' }) {
  const tones = { amber: 'text-amber-300', emerald: 'text-emerald-300', slate: 'text-slate-100' };
  return (
    <div className="bg-white/[0.04] border border-white/[0.06] rounded-xl px-3 py-3 text-center">
      <div className={`font-display font-extrabold text-lg sm:text-xl ${tones[tone]}`}>{val}</div>
      <div className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold mt-1">{label}</div>
    </div>
  );
}

function DreamBox({ label, amount, period, body, accent }) {
  const accentMap = {
    violet: { wrap: 'border-violet-500/20', tag: 'bg-violet-500/10 text-violet-300 border-violet-500/25', amount: 'text-violet-300', bg: 'linear-gradient(135deg, rgba(139,92,246,0.10), rgba(245,158,11,0.04))' },
    emerald: { wrap: 'border-emerald-500/20', tag: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/25', amount: 'text-emerald-300', bg: 'linear-gradient(135deg, rgba(16,185,129,0.10), rgba(56,189,248,0.04))' },
  }[accent];
  return (
    <div className={`relative rounded-2xl p-6 border ${accentMap.wrap}`} style={{ background: accentMap.bg }}>
      <span className={`tag border ${accentMap.tag}`}>{label}</span>
      <div className="text-xs text-slate-500 mt-2">{period}</div>
      <div className={`font-display text-3xl sm:text-4xl font-extrabold mt-2 ${accentMap.amount}`}>{amount}</div>
      <p className="text-sm text-slate-400 mt-3 leading-relaxed">{body}</p>
    </div>
  );
}

function PhaseCardMini({ p }) {
  const colorMap = { rose: 'border-rose-500/20', violet: 'border-violet-500/20', sky: 'border-sky-500/20', amber: 'border-amber-500/20', emerald: 'border-emerald-500/20' };
  const numMap = { rose: 'bg-rose-500', violet: 'bg-violet-500', sky: 'bg-sky-500', amber: 'bg-amber-500', emerald: 'bg-emerald-500' };
  return (
    <div className={`rounded-2xl border ${colorMap[p.color]} bg-ink-800/60 p-4`}>
      <div className={`inline-flex items-center justify-center w-9 h-9 rounded-lg ${numMap[p.color]} text-ink-950 text-xs font-extrabold mb-3`}>{p.code}</div>
      <div className="font-bold text-sm leading-snug">{p.title}</div>
      <div className="text-[11px] text-slate-500 mt-1 mb-3">{p.period}</div>
      <div className="text-[11px] font-semibold gold-text">{formatInr(p.revenueTarget.from)} – {formatInr(p.revenueTarget.to)}</div>
    </div>
  );
}
