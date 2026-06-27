import { useMemo } from 'react';
import * as Icons from 'lucide-react';
import { Plus, Trash2, Building2, Briefcase, ShieldAlert, FileText, ListChecks } from 'lucide-react';
import { PageHeader, Card, Pill, StatCard } from '../ui/Section.jsx';
import { useLocalStorage } from '../../hooks/useLocalStorage.js';
import { useCloudState } from '../../lib/cloudSync.js';
import { formatInr } from '../../utils/format.js';

const TYPE_OPTIONS = ['Equity', 'Profit Share', 'Revenue Share', 'Silent', 'JV'];
const STATUS_OPTIONS = ['Active', 'In review', 'Paused', 'Exited'];

export default function Partnerships({ data }) {
  const { partnerships } = data;
  const [companies, setCompanies] = useCloudState('partnerships', partnerships.sampleRows || []);

  const stats = useMemo(() => {
    const real = companies.filter((c) => !c.isSample);
    return {
      count: real.length,
      active: real.filter((c) => c.status === 'Active').length,
      invested: real.reduce((s, c) => s + (Number(c.invested) || 0), 0),
      monthlyProfit: real.reduce((s, c) => s + (Number(c.monthlyProfit) || 0), 0),
      yearlyProfit: real.reduce((s, c) => s + (Number(c.monthlyProfit) || 0), 0) * 12,
    };
  }, [companies]);

  function addCompany() {
    setCompanies((cs) => [
      ...cs.filter((c) => !c.isSample),
      {
        id: Date.now(),
        name: 'New partnership',
        type: 'Equity',
        sector: '',
        equity: 0,
        invested: 0,
        monthlyProfit: 0,
        status: 'In review',
        startedOn: '',
      },
    ]);
  }
  function updateCompany(id, patch) {
    setCompanies((cs) => cs.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  }
  function removeCompany(id) {
    setCompanies((cs) => cs.filter((c) => c.id !== id));
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Portfolio"
        title={partnerships.intro.title}
        subtitle={partnerships.intro.subtitle}
        accent="amber"
      />

      <div className="grid-auto-stats gap-3">
        <StatCard label="Active partnerships" value={stats.active} color="emerald" sub={`${stats.count} total tracked`} />
        <StatCard label="Total invested" value={formatInr(stats.invested)} color="amber" sub="Across all partnerships" />
        <StatCard label="Monthly profit share" value={formatInr(stats.monthlyProfit)} color="emerald" sub="From all active deals" />
        <StatCard label="Yearly run-rate" value={formatInr(stats.yearlyProfit)} color="violet" sub="Profit × 12 months" />
      </div>

      {/* The live tracker */}
      <Card>
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-amber-300" />
            <h3 className="font-display text-lg font-extrabold">My Partnerships</h3>
          </div>
          <button onClick={addCompany} className="inline-flex items-center gap-1.5 bg-amber-500/15 hover:bg-amber-500/25 text-amber-200 text-xs font-bold px-3 py-2 rounded-lg transition-colors">
            <Plus className="w-3.5 h-3.5" /> Add partnership
          </button>
        </div>

        {companies.length === 0 ? (
          <EmptyState onAdd={addCompany} />
        ) : (
          <>
            {/* Mobile: stacked cards */}
            <div className="sm:hidden space-y-3">
              {companies.map((c) => (
                <div key={c.id} className={`rounded-xl bg-white/[0.03] border border-white/[0.08] p-3 ${c.isSample ? 'opacity-60' : ''}`}>
                  <div className="flex items-start gap-2 mb-3">
                    <CellInput value={c.name} onChange={(v) => updateCompany(c.id, { name: v })} />
                    <button onClick={() => removeCompany(c.id)} className="text-slate-500 p-1.5 rounded-lg shrink-0">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <Field label="Type"><CellSelect value={c.type} onChange={(v) => updateCompany(c.id, { type: v })} options={TYPE_OPTIONS} /></Field>
                    <Field label="Status"><CellSelect value={c.status} onChange={(v) => updateCompany(c.id, { status: v })} options={STATUS_OPTIONS} /></Field>
                    <Field label="Sector"><CellInput value={c.sector} onChange={(v) => updateCompany(c.id, { sector: v })} /></Field>
                    <Field label="Equity %"><CellInput value={c.equity} onChange={(v) => updateCompany(c.id, { equity: Number(v) || 0 })} type="number" /></Field>
                    <Field label="Invested (₹)"><CellInput value={c.invested} onChange={(v) => updateCompany(c.id, { invested: Number(v) || 0 })} type="number" /></Field>
                    <Field label="Profit (₹/mo)"><CellInput value={c.monthlyProfit} onChange={(v) => updateCompany(c.id, { monthlyProfit: Number(v) || 0 })} type="number" /></Field>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop: table */}
            <div className="hidden sm:block overflow-x-auto -mx-1">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold text-left">
                    <th className="px-2 py-2">Company / Partner</th>
                    <th className="px-2 py-2">Type</th>
                    <th className="px-2 py-2">Sector</th>
                    <th className="px-2 py-2 text-right">Equity %</th>
                    <th className="px-2 py-2 text-right">Invested (₹)</th>
                    <th className="px-2 py-2 text-right">Monthly profit (₹)</th>
                    <th className="px-2 py-2">Status</th>
                    <th className="px-2 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {companies.map((c) => (
                    <tr key={c.id} className={`border-t border-white/[0.04] ${c.isSample ? 'opacity-60' : ''}`}>
                      <td className="px-2 py-2"><CellInput value={c.name} onChange={(v) => updateCompany(c.id, { name: v })} /></td>
                      <td className="px-2 py-2"><CellSelect value={c.type} onChange={(v) => updateCompany(c.id, { type: v })} options={TYPE_OPTIONS} /></td>
                      <td className="px-2 py-2"><CellInput value={c.sector} onChange={(v) => updateCompany(c.id, { sector: v })} /></td>
                      <td className="px-2 py-2 text-right"><CellInput value={c.equity} onChange={(v) => updateCompany(c.id, { equity: Number(v) || 0 })} type="number" align="right" /></td>
                      <td className="px-2 py-2 text-right"><CellInput value={c.invested} onChange={(v) => updateCompany(c.id, { invested: Number(v) || 0 })} type="number" align="right" /></td>
                      <td className="px-2 py-2 text-right"><CellInput value={c.monthlyProfit} onChange={(v) => updateCompany(c.id, { monthlyProfit: Number(v) || 0 })} type="number" align="right" /></td>
                      <td className="px-2 py-2"><CellSelect value={c.status} onChange={(v) => updateCompany(c.id, { status: v })} options={STATUS_OPTIONS} /></td>
                      <td className="px-2 py-2 text-right">
                        <button onClick={() => removeCompany(c.id)} className="text-slate-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-white/5">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </Card>

      {/* Types of partnerships */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Briefcase className="w-5 h-5 text-violet-300" />
          <h3 className="font-display text-xl font-extrabold">Five types of partnership</h3>
        </div>
        <p className="text-sm text-slate-500 mb-5">Pick the structure that matches the situation. Mix is fine.</p>
        <div className="grid-auto-cards gap-3">
          {partnerships.partnershipTypes.map((t) => {
            const Icon = Icons[t.icon] || Icons.Box;
            return (
              <Card key={t.id}>
                <div className="flex items-start gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-xl bg-${t.color}-500/10 text-${t.color}-300 flex items-center justify-center shrink-0`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm">{t.title}</h4>
                  </div>
                </div>
                <p className="text-sm text-slate-400 leading-relaxed mb-3">{t.body}</p>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <div className="text-slate-500 uppercase tracking-wider font-bold">Equity</div>
                    <div className="text-slate-200 mt-0.5">{t.typicalEquity}</div>
                  </div>
                  <div>
                    <div className="text-slate-500 uppercase tracking-wider font-bold">Return</div>
                    <div className="text-slate-200 mt-0.5">{t.typicalReturn}</div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Evaluation checklist */}
      <Card>
        <div className="flex items-center gap-2 mb-3">
          <ListChecks className="w-5 h-5 text-emerald-300" />
          <h3 className="font-display text-lg font-extrabold">Evaluation checklist — before any handshake</h3>
        </div>
        <p className="text-sm text-slate-500 mb-4">Tick all 10 in your head before signing anything. Even one "no" = pause and reconsider.</p>
        <ul className="space-y-2">
          {partnerships.evaluationChecklist.map((item, i) => (
            <li key={i} className="flex gap-3 text-sm text-slate-300 leading-relaxed">
              <span className="text-emerald-400 mt-0.5 font-bold">{i + 1}.</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </Card>

      {/* Red flags */}
      <Card className="!border-rose-500/15 bg-gradient-to-br from-rose-500/[0.04] to-transparent">
        <div className="flex items-center gap-2 mb-3">
          <ShieldAlert className="w-5 h-5 text-rose-300" />
          <h3 className="font-display text-lg font-extrabold">Red flags — walk away</h3>
        </div>
        <ul className="space-y-2">
          {partnerships.redFlags.map((flag, i) => (
            <li key={i} className="flex gap-2 text-sm text-slate-300 leading-relaxed">
              <span className="text-rose-400 mt-1">⛔</span>
              <span>{flag}</span>
            </li>
          ))}
        </ul>
      </Card>

      {/* Documents needed */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <FileText className="w-5 h-5 text-violet-300" />
          <h3 className="font-display text-xl font-extrabold">Documents to have ready</h3>
        </div>
        <p className="text-sm text-slate-500 mb-5">No partnership goes ahead without these. Build templates once, use forever.</p>
        <div className="grid-auto-cards gap-3">
          {partnerships.documentsNeeded.map((d, i) => (
            <Card key={i}>
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-4 h-4 text-violet-300 shrink-0" />
                <h4 className="font-bold text-sm">{d.name}</h4>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed mb-3">{d.purpose}</p>
              <Pill color="violet">{d.stage}</Pill>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}

function EmptyState({ onAdd }) {
  return (
    <div className="text-center py-12 border border-dashed border-white/10 rounded-xl">
      <Building2 className="w-10 h-10 text-slate-500 mx-auto mb-3" />
      <p className="text-sm text-slate-400 mb-4">No partnerships tracked yet. Add your first one when you make a move.</p>
      <button onClick={onAdd} className="inline-flex items-center gap-1.5 bg-amber-500/15 hover:bg-amber-500/25 text-amber-200 text-xs font-bold px-4 py-2 rounded-lg transition-colors">
        <Plus className="w-3.5 h-3.5" /> Add first partnership
      </button>
    </div>
  );
}

function CellInput({ value, onChange, type = 'text', align = 'left' }) {
  return (
    <input
      type={type}
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
      className="w-full bg-transparent border border-transparent hover:border-white/[0.08] focus:border-amber-500/40 rounded-md px-2 py-1 text-sm focus:outline-none"
      style={{ textAlign: align }}
    />
  );
}

function CellSelect({ value, onChange, options }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="bg-ink-900 border border-white/[0.08] rounded-md px-2 py-1 text-xs focus:outline-none focus:border-amber-500/40 w-full"
    >
      {options.map((o) => <option key={o}>{o}</option>)}
    </select>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="text-[9px] uppercase tracking-widest text-slate-500 font-bold block mb-1">{label}</span>
      {children}
    </label>
  );
}
