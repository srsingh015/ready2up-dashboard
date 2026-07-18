import { useMemo, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from 'recharts';
import { Plus, Trash2, TrendingUp, Info, CheckCircle2, Circle, ListChecks, NotebookPen } from 'lucide-react';
import { PageHeader, Card, Pill } from '../ui/Section.jsx';
import { useLocalStorage } from '../../hooks/useLocalStorage.js';
import { useCloudState } from '../../lib/cloudSync.js';
import { formatInr } from '../../utils/format.js';

/**
 * Role-aware Trackers.
 *
 * Owner  → the existing financial Plan-vs-Actual + Pipeline trackers (money).
 * Others → a money-free "Work Tracker" (task checklist + daily notes). The
 *          employee branch NEVER reads `data.months` / `data.meta`, so an
 *          employee `data` object that lacks those keys can never crash it.
 */
export default function Trackers({ data, role }) {
  if (role !== 'owner') {
    return <EmployeeWorkTracker />;
  }
  return <OwnerTrackers data={data} />;
}

function OwnerTrackers({ data }) {
  const { months, meta } = data;
  const [actuals, setActuals] = useCloudState('actuals', {});
  const [pipeline, setPipeline] = useCloudState('pipeline', []);

  const planVsActual = useMemo(() => {
    return months.map((m) => ({
      month: `M${m.n}`,
      planned: Math.round((m.revenueTargetInr.from + m.revenueTargetInr.to) / 2),
      actual: actuals[m.n]?.revenue ?? null,
    }));
  }, [months, actuals]);

  const totalPlanned = useMemo(() => planVsActual.reduce((s, x) => s + x.planned, 0), [planVsActual]);
  const totalActual = useMemo(() => Object.values(actuals).reduce((s, v) => s + (Number(v?.revenue) || 0), 0), [actuals]);
  const pipelineValue = useMemo(() => pipeline.reduce((s, p) => s + (Number(p.value) || 0), 0), [pipeline]);

  function setMonthRevenue(n, value) {
    setActuals((a) => ({ ...a, [n]: { ...(a[n] || {}), revenue: value === '' ? undefined : Number(value) } }));
  }
  function addLead() {
    setPipeline((p) => [...p, { id: Date.now(), name: 'New lead', source: 'Upwork', stage: 'Lead', value: 0, nextAction: '' }]);
  }
  function updateLead(id, patch) { setPipeline((p) => p.map((l) => (l.id === id ? { ...l, ...patch } : l))); }
  function removeLead(id) { setPipeline((p) => p.filter((l) => l.id !== id)); }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Live Trackers"
        title="Plan vs Actual — track the truth"
        subtitle="Plan numbers are fixed. Actuals you fill in monthly. The gap between them is the conversation we have with reality."
        accent="emerald"
      />

      {/* GOAL CONTEXT — clarify the three numbers */}
      <Card className="!p-0 overflow-hidden border-amber-500/15 bg-gradient-to-br from-amber-500/[0.04] to-transparent">
        <div className="p-5 border-b border-white/[0.06] flex items-center gap-2">
          <Info className="w-4 h-4 text-amber-300" />
          <h3 className="font-bold text-sm uppercase tracking-widest text-amber-200">Three numbers — three different things</h3>
        </div>
        <div className="grid sm:grid-cols-3">
          <GoalBox
            badge="Goal · Stage 1"
            badgeColor="violet"
            title="₹5 Crore"
            subtitle="The first goal — not the last"
            body="Concrete and achievable. Not a dream — the starting line of a multi-stage plan. We hit it, lock it, set Stage 2."
          />
          <GoalBox
            badge="The Realistic Plan"
            badgeColor="emerald"
            title={formatInr(meta.realTarget.cumulativeOver24mInr)}
            subtitle="24-month cumulative · this is what the chart sums to"
            body="The sum of all 24 monthly targets. Builds steadily from a small Month 1 to ₹12L+ in Month 24. Sustainable, fundable, low-risk."
            accent
          />
          <GoalBox
            badge="The Stretch"
            badgeColor="amber"
            title={formatInr(meta.stretchTarget.cumulativeOver24mInr)}
            subtitle="₹5Cr cumulative inside 24 months · aggressive"
            body="Possible only with USD/AED-from-day-1 pricing, premium-only positioning, faster team scaling, and ₹2-5L upfront capital."
          />
        </div>
      </Card>

      {/* Stretch scenario detail */}
      <Card>
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="w-5 h-5 text-amber-300" />
          <h3 className="font-display text-lg font-extrabold">If you choose the stretch — what changes</h3>
        </div>
        <p className="text-sm text-slate-300 leading-relaxed mb-4">{meta.stretchTarget.statement}</p>
        <ul className="space-y-1.5">
          {meta.stretchTarget.requirements.map((r, i) => (
            <li key={i} className="flex gap-2 text-sm text-slate-300 leading-relaxed">
              <span className="text-amber-400 mt-1">●</span><span>{r}</span>
            </li>
          ))}
        </ul>
        <div className="mt-4 p-3 rounded-xl bg-rose-500/[0.05] border border-rose-500/15 text-xs text-slate-300 leading-relaxed">
          <span className="text-rose-300 font-bold">Honest take: </span>
          The realistic plan compounds into ₹5Cr by year 4 with very low risk. The stretch hits ₹5Cr by month 24 with significantly higher risk of cash crunch and quality issues. Both are valid — pick the one that matches your appetite for risk.
        </div>
      </Card>

      {/* Top stats */}
      <div className="grid sm:grid-cols-3 gap-3">
        <StatBlock label="24-month cumulative target" value={formatInr(totalPlanned)} color="amber" sub="Sum of all monthly midpoints" />
        <StatBlock label="Logged actual revenue" value={formatInr(totalActual)} color="emerald" sub="What you have actually closed" />
        <StatBlock label="Active pipeline value" value={formatInr(pipelineValue)} color="violet" sub="Open proposals + warm leads" />
      </div>

      <Card>
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div>
            <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-0.5">Plan vs Actual</div>
            <div className="font-display text-lg font-bold">Monthly revenue trajectory</div>
          </div>
          <Pill color="emerald">Auto-saved on this device</Pill>
        </div>
        <div className="h-72 -mx-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={planVsActual}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="month" stroke="#475569" tick={{ fontSize: 10 }} interval={1} tickLine={false} axisLine={false} />
              <YAxis stroke="#475569" tick={{ fontSize: 10 }} tickFormatter={(v) => formatInr(v, { short: true })} tickLine={false} axisLine={false} width={50} />
              <Tooltip
                contentStyle={{ background: '#0e0e1a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, fontSize: 12 }}
                formatter={(v, name) => [formatInr(v), name === 'planned' ? 'Plan' : 'Actual']}
              />
              <Line type="monotone" dataKey="planned" stroke="#f59e0b" strokeWidth={2} dot={false} name="planned" />
              <Line type="monotone" dataKey="actual" stroke="#10b981" strokeWidth={2.5} dot={{ r: 3, fill: '#10b981' }} name="actual" connectNulls />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card>
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="w-5 h-5 text-emerald-300" />
          <h3 className="font-display text-lg font-extrabold">Log monthly revenue</h3>
        </div>
        <p className="text-xs text-slate-400 mb-4">End of each month: enter what you actually closed (₹ in your account, not invoiced).</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2">
          {months.map((m) => (
            <label key={m.n} className="block">
              <span className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">M{m.n}</span>
              <input
                type="number"
                inputMode="numeric"
                placeholder="0"
                value={actuals[m.n]?.revenue ?? ''}
                onChange={(e) => setMonthRevenue(m.n, e.target.value)}
                className="mt-1 w-full bg-ink-900 border border-white/[0.08] rounded-lg px-2.5 py-2 text-sm focus-ring placeholder-slate-600 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </label>
          ))}
        </div>
      </Card>

      <Card>
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <h3 className="font-display text-lg font-extrabold">Pipeline tracker</h3>
          <button onClick={addLead} className="inline-flex items-center gap-1.5 bg-violet-500/15 hover:bg-violet-500/25 text-violet-200 text-xs font-bold px-3 py-2 rounded-lg transition-colors">
            <Plus className="w-3.5 h-3.5" /> Add lead
          </button>
        </div>
        {pipeline.length === 0 ? (
          <div className="text-center py-10 border border-dashed border-white/10 rounded-xl">
            <p className="text-sm text-slate-500">No leads yet. Add the first one once outreach starts replying.</p>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-1">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold text-left">
                  <th className="px-2 py-2">Name</th>
                  <th className="px-2 py-2">Source</th>
                  <th className="px-2 py-2">Stage</th>
                  <th className="px-2 py-2 text-right">Value (₹)</th>
                  <th className="px-2 py-2">Next action</th>
                  <th className="px-2 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {pipeline.map((l) => (
                  <tr key={l.id} className="border-t border-white/[0.04]">
                    <td className="px-2 py-2"><CellInput value={l.name} onChange={(v) => updateLead(l.id, { name: v })} /></td>
                    <td className="px-2 py-2"><CellSelect value={l.source} onChange={(v) => updateLead(l.id, { source: v })} options={['Upwork', 'LinkedIn', 'Cold Email', 'Referral', 'Local', 'Inbound', 'Other']} /></td>
                    <td className="px-2 py-2"><CellSelect value={l.stage} onChange={(v) => updateLead(l.id, { stage: v })} options={['Lead', 'Qualified', 'Discovery', 'Proposal', 'Won', 'Lost']} /></td>
                    <td className="px-2 py-2 text-right"><CellInput value={l.value} onChange={(v) => updateLead(l.id, { value: Number(v) || 0 })} type="number" align="right" /></td>
                    <td className="px-2 py-2"><CellInput value={l.nextAction} onChange={(v) => updateLead(l.id, { nextAction: v })} /></td>
                    <td className="px-2 py-2 text-right">
                      <button onClick={() => removeLead(l.id)} className="text-slate-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-white/5">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

/**
 * Money-free Work Tracker for employees.
 *
 * Persisted per-login via the same cloud-sync hook the owner trackers use
 * (`useCloudState`), under NEW keys so it never collides with owner financial
 * state. Contains a task checklist and a free-text "what I did today" notes
 * field. Contains NO revenue, targets, MRR, pipeline, or any money.
 */
function EmployeeWorkTracker() {
  const [tasks, setTasks] = useCloudState('employee_tasks', []);
  const [notes, setNotes] = useCloudState('employee_notes', '');
  const [draft, setDraft] = useState('');

  const doneCount = useMemo(() => tasks.filter((t) => t.done).length, [tasks]);

  function addTask() {
    const text = draft.trim();
    if (!text) return;
    setTasks((list) => [...list, { id: Date.now(), text, done: false }]);
    setDraft('');
  }
  function toggleTask(id) {
    setTasks((list) => list.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  }
  function removeTask(id) {
    setTasks((list) => list.filter((t) => t.id !== id));
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Work Tracker"
        title="Your tasks & daily notes"
        subtitle="Add what you're working on, check things off as you finish, and jot down what you did today. Everything saves automatically to your login."
        accent="emerald"
      />

      {/* Task checklist */}
      <Card>
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <ListChecks className="w-5 h-5 text-emerald-300" />
            <h3 className="font-display text-lg font-extrabold">My tasks</h3>
          </div>
          <Pill color="emerald">
            {doneCount}/{tasks.length} done
          </Pill>
        </div>

        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') addTask();
            }}
            placeholder="Add a task and press Enter…"
            className="flex-1 bg-ink-900 border border-white/[0.08] rounded-lg px-3 py-2 text-sm focus-ring placeholder-slate-600"
          />
          <button
            onClick={addTask}
            className="inline-flex items-center gap-1.5 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-200 text-xs font-bold px-3 py-2 rounded-lg transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Add
          </button>
        </div>

        {tasks.length === 0 ? (
          <div className="text-center py-10 border border-dashed border-white/10 rounded-xl">
            <p className="text-sm text-slate-500">No tasks yet. Add your first one above.</p>
          </div>
        ) : (
          <ul className="space-y-1.5">
            {tasks.map((t) => (
              <li
                key={t.id}
                className="flex items-center gap-3 px-3 py-2 rounded-xl border border-white/[0.06] hover:bg-white/[0.03] transition-colors"
              >
                <button
                  onClick={() => toggleTask(t.id)}
                  aria-label={t.done ? 'Mark task as not done' : 'Mark task as done'}
                  className={`shrink-0 ${t.done ? 'text-emerald-400' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  {t.done ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                </button>
                <span className={`flex-1 text-sm ${t.done ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                  {t.text}
                </span>
                <button
                  onClick={() => removeTask(t.id)}
                  aria-label="Delete task"
                  className="text-slate-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-white/5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* Daily notes */}
      <Card>
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <NotebookPen className="w-5 h-5 text-violet-300" />
            <h3 className="font-display text-lg font-extrabold">What I did today</h3>
          </div>
          <Pill color="violet">Auto-saved to your login</Pill>
        </div>
        <p className="text-xs text-slate-400 mb-3">
          A quick free-text log of what you worked on. Great for standups and handovers.
        </p>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={8}
          placeholder="Today I…"
          className="w-full bg-ink-900 border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm leading-relaxed focus-ring placeholder-slate-600 resize-y"
        />
      </Card>
    </div>
  );
}

function GoalBox({ badge, badgeColor, title, subtitle, body, accent }) {
  const badgeColors = {
    violet: 'bg-violet-500/10 text-violet-300 border-violet-500/25',
    emerald: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/25',
    amber: 'bg-amber-500/10 text-amber-300 border-amber-500/25',
  };
  return (
    <div className={`p-5 ${accent ? 'sm:bg-emerald-500/[0.03]' : ''} border-r border-white/[0.06] last:border-r-0`}>
      <span className={`tag border ${badgeColors[badgeColor]} mb-2 inline-block`}>{badge}</span>
      <div className="font-display text-2xl font-extrabold gold-text mt-2">{title}</div>
      <div className="text-[11px] text-slate-500 mt-1 mb-3 font-semibold">{subtitle}</div>
      <p className="text-xs text-slate-400 leading-relaxed">{body}</p>
    </div>
  );
}

function StatBlock({ label, value, color = 'amber', sub }) {
  const colorMap = { amber: 'text-amber-300', emerald: 'text-emerald-300', violet: 'text-violet-300' };
  return (
    <Card>
      <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">{label}</div>
      <div className={`font-display text-2xl font-extrabold ${colorMap[color]}`}>{value}</div>
      {sub && <div className="text-[11px] text-slate-500 mt-1.5">{sub}</div>}
    </Card>
  );
}

function CellInput({ value, onChange, type = 'text', align = 'left' }) {
  return (
    <input
      type={type}
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
      className={`w-full bg-transparent border border-transparent hover:border-white/[0.08] focus:border-amber-500/40 rounded-md px-2 py-1 text-sm focus:outline-none`}
      style={{ textAlign: align }}
    />
  );
}

function CellSelect({ value, onChange, options }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="bg-ink-900 border border-white/[0.08] rounded-md px-2 py-1 text-xs focus:outline-none focus:border-amber-500/40"
    >
      {options.map((o) => <option key={o}>{o}</option>)}
    </select>
  );
}
