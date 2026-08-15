import { useState, useMemo, useCallback } from 'react';
import {
  MapPin, Phone, Mail, Globe, ExternalLink, PartyPopper, Copy, Check,
  ThumbsUp, ThumbsDown, Loader, AlertTriangle, ListChecks, Tag as TagIcon,
  Repeat2, Flame,
} from 'lucide-react';
import { PageHeader, SectionHeader, Card, Pill, StatCard, Divider } from '../ui/Section.jsx';
import { useLocalStorage } from '../../hooks/useLocalStorage.js';
import {
  resolveStatus,
  resolveDecision,
  groupLeadsByCity,
  applyFilters,
  applyDecisionFilter,
  computePipeline,
  computeDecisionSummary,
  OUTREACH_STATUSES,
  OUTREACH_DECISIONS,
  CITY_ORDER,
} from '../../utils/outreach.js';
import { decisionStyle } from '../../utils/decisionStyle.js';

// Persisted store keys. Distinct from the institute section's keys so the two
// pipelines never overwrite each other. The 'r2up_v1::' prefix is added by
// useLocalStorage; we re-read these exact keys to verify a write landed.
const STATUS_STORE_KEY = 'r2up_v1::lb_lead_status';
const DECISION_STORE_KEY = 'r2up_v1::lb_lead_decision';

const PLACEHOLDER = 'Not researched yet';

export default function LawnsOutreach({ data }) {
  const lb = data?.lawnsOutreach;

  const [cityFilter, setCityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [decisionFilter, setDecisionFilter] = useState('all');

  const [statusStore, setStatusStore] = useLocalStorage('lb_lead_status', {});
  const [decisionStore, setDecisionStore] = useLocalStorage('lb_lead_decision', {});

  const [statusErrors, setStatusErrors] = useState({});
  const [decisionErrors, setDecisionErrors] = useState({});

  // Commit a change with a verified read-back: write, read it back, and roll the
  // optimistic update back if the value did not land (private-mode / quota).
  const commit = useCallback(
    (storeKey, store, setStore, setErrors, leadId, value) => {
      const prev = store;
      const next = { ...prev, [leadId]: value };
      setStore(next);
      try {
        localStorage.setItem(storeKey, JSON.stringify(next));
        const raw = localStorage.getItem(storeKey);
        const roundTripped = raw ? JSON.parse(raw) : {};
        if (roundTripped[leadId] !== value) throw new Error('verify failed');
        setErrors((e) => {
          if (!e[leadId]) return e;
          const copy = { ...e };
          delete copy[leadId];
          return copy;
        });
      } catch {
        setStore(prev);
        setErrors((e) => ({ ...e, [leadId]: true }));
      }
    },
    []
  );

  const commitStatus = useCallback(
    (leadId, value) =>
      commit(STATUS_STORE_KEY, statusStore, setStatusStore, setStatusErrors, leadId, value),
    [commit, statusStore, setStatusStore]
  );

  const commitDecision = useCallback(
    (leadId, value) =>
      commit(DECISION_STORE_KEY, decisionStore, setDecisionStore, setDecisionErrors, leadId, value),
    [commit, decisionStore, setDecisionStore]
  );

  const leads = Array.isArray(lb?.leads) ? lb.leads : [];

  // Resolve each seed lead's effective status + decision (override → seed → default).
  const resolvedLeads = useMemo(
    () =>
      leads.map((lead) => ({
        ...lead,
        status: resolveStatus(lead, statusStore),
        decision: resolveDecision(lead, decisionStore),
      })),
    [leads, statusStore, decisionStore]
  );

  const pipeline = useMemo(
    () => computePipeline(resolvedLeads, cityFilter),
    [resolvedLeads, cityFilter]
  );
  const decisionSummary = useMemo(
    () => computeDecisionSummary(resolvedLeads, cityFilter),
    [resolvedLeads, cityFilter]
  );

  const visibleGroups = useMemo(
    () =>
      groupLeadsByCity(
        applyDecisionFilter(
          applyFilters(resolvedLeads, cityFilter, statusFilter),
          decisionFilter
        )
      ),
    [resolvedLeads, cityFilter, statusFilter, decisionFilter]
  );

  const filtersActive =
    cityFilter !== 'all' || statusFilter !== 'all' || decisionFilter !== 'all';

  const highPriorityCount = useMemo(
    () => resolvedLeads.filter((l) => l.priority === 'High').length,
    [resolvedLeads]
  );

  // Content guard — nothing renders without the section's backing content.
  if (!lb) {
    return (
      <div className="space-y-8">
        <PageHeader eyebrow="Get Clients" title="Lawns & Banquets Outreach" />
        <Card>
          <p className="text-sm text-slate-400">
            This section is currently unavailable. Seed the{' '}
            <code className="text-slate-300">lawnsOutreach</code> content key, then reload.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Get Clients · Highest-probability segment"
        title={lb.offer?.headline || 'Lawns & Banquets Outreach'}
        subtitle={lb.offer?.description}
      />

      {/* Why this segment closes */}
      {Array.isArray(lb.whyThisSegment) && lb.whyThisSegment.length > 0 && (
        <Card className="!border-emerald-500/25 !bg-emerald-500/[0.04]">
          <SectionHeader
            icon={Flame}
            color="emerald"
            title="Why venues close faster than colleges"
            subtitle="One decision maker plus obvious ROI. That is the whole thesis."
          />
          <ul className="space-y-2.5">
            {lb.whyThisSegment.map((reason, i) => (
              <li key={i} className="flex gap-2.5 text-sm text-slate-300 leading-relaxed">
                <span className="text-emerald-300 mt-0.5 shrink-0">▸</span>
                <span>{reason}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* The honest proof gap */}
      {lb.proofGap && (
        <Card className="!border-amber-500/30 !bg-amber-500/[0.05]">
          <div className="flex gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-300 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <h3 className="font-bold text-base mb-2">Read this before you pitch: we have no venue proof yet</h3>
              <p className="text-sm text-slate-300 leading-relaxed">{lb.proofGap.problem}</p>
              <p className="text-sm text-slate-300 leading-relaxed mt-2.5">
                <span className="font-semibold text-amber-200">The fix: </span>{lb.proofGap.fix}
              </p>
              <p className="text-sm text-slate-400 leading-relaxed mt-2.5 italic">{lb.proofGap.rule}</p>
            </div>
          </div>
        </Card>
      )}

      <Divider />

      {/* Pipeline + decision summary */}
      <section>
        <SectionHeader icon={PartyPopper} color="violet" title="Pipeline" subtitle={
          cityFilter === 'all' ? 'All cities' : `Scoped to ${cityFilter}`
        } />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard label="Total venues" value={pipeline.total} color="slate" />
          <StatCard label="High priority" value={highPriorityCount} color="violet" />
          <StatCard label="Accepted" value={decisionSummary.counts.Accepted ?? 0} color="emerald" />
          <StatCard label="In progress" value={decisionSummary.counts['In progress'] ?? 0} color="amber" />
        </div>
      </section>

      <Divider />

      {/* Filters + lead list */}
      <section>
        <SectionHeader icon={MapPin} color="sky" title="Venue leads" subtitle="Nashik first, then Pune and Mumbai. Hotel chains excluded — no local decision maker." />

        <Card className="!p-4 mb-4">
          <div className="flex flex-wrap gap-3 items-end">
            <label className="flex-1 min-w-[140px]">
              <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">City</span>
              <select
                aria-label="Filter by city"
                value={cityFilter}
                onChange={(e) => setCityFilter(e.target.value)}
                className="w-full bg-ink-900 border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm focus-ring"
              >
                <option value="all">All cities</option>
                {CITY_ORDER.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </label>
            <label className="flex-1 min-w-[140px]">
              <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Status</span>
              <select
                aria-label="Filter by status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full bg-ink-900 border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm focus-ring"
              >
                <option value="all">All statuses</option>
                {OUTREACH_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </label>
            <label className="flex-1 min-w-[140px]">
              <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Decision</span>
              <select
                aria-label="Filter by decision"
                value={decisionFilter}
                onChange={(e) => setDecisionFilter(e.target.value)}
                className="w-full bg-ink-900 border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm focus-ring"
              >
                <option value="all">All decisions</option>
                {OUTREACH_DECISIONS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </label>
            {filtersActive && (
              <button
                onClick={() => { setCityFilter('all'); setStatusFilter('all'); setDecisionFilter('all'); }}
                className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-300 bg-white/[0.05] hover:bg-white/[0.10] transition-colors"
              >
                Clear
              </button>
            )}
          </div>
        </Card>

        {visibleGroups.length === 0 ? (
          <Card>
            <p className="text-sm text-slate-400">
              {leads.length === 0
                ? 'No venue leads seeded yet.'
                : 'No venues match these filters.'}
            </p>
          </Card>
        ) : (
          <div className="space-y-8">
            {visibleGroups.map((group) => (
              <div key={group.city}>
                <div className="flex items-center gap-2 mb-3">
                  <h3 className="font-display text-lg font-extrabold">{group.city}</h3>
                  <Pill color="slate">{group.count}</Pill>
                </div>
                <div className="space-y-3">
                  {group.leads.map((lead) => (
                    <VenueCard
                      key={lead.id}
                      lead={lead}
                      statusError={!!statusErrors[lead.id]}
                      decisionError={!!decisionErrors[lead.id]}
                      onStatusChange={commitStatus}
                      onDecisionChange={commitDecision}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <Divider />

      {/* Audit checklist */}
      {Array.isArray(lb.auditChecklist) && lb.auditChecklist.length > 0 && (
        <section>
          <SectionHeader
            icon={ListChecks}
            color="amber"
            title="Run this audit before every pitch"
            subtitle="Each failed item is a specific, screenshot-able hook. Never pitch without at least one."
          />
          <Card>
            <ul className="space-y-2">
              {lb.auditChecklist.map((item, i) => (
                <li key={i} className="flex gap-2.5 text-sm text-slate-300 leading-relaxed">
                  <span className="text-slate-500 tabular-nums shrink-0">{String(i + 1).padStart(2, '0')}</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </Card>
        </section>
      )}

      <Divider />

      {/* Pricing + retainer */}
      {Array.isArray(lb.pricingTiers) && lb.pricingTiers.length > 0 && (
        <section>
          <SectionHeader icon={TagIcon} color="emerald" title="Pricing for this segment" />
          <div className="grid md:grid-cols-3 gap-3">
            {lb.pricingTiers.map((tier) => (
              <Card
                key={tier.id}
                className={tier.recommended ? '!border-emerald-500/45 !bg-emerald-500/[0.06]' : ''}
              >
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <h4 className="font-bold text-base">{tier.name}</h4>
                  {tier.recommended && <Pill color="emerald">Recommended</Pill>}
                </div>
                <div className="font-display text-xl font-extrabold text-emerald-300 mb-2">{tier.priceRange}</div>
                <p className="text-sm text-slate-400 leading-relaxed">{tier.scope}</p>
                {tier.bestFor && (
                  <p className="text-xs text-slate-500 mt-2.5 leading-relaxed">
                    <span className="font-semibold text-slate-400">Best for: </span>{tier.bestFor}
                  </p>
                )}
              </Card>
            ))}
          </div>

          {lb.retainer && (
            <Card className="!border-violet-500/30 !bg-violet-500/[0.05] mt-3">
              <div className="flex gap-3">
                <Repeat2 className="w-5 h-5 text-violet-300 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1.5">
                    <h4 className="font-bold text-base">Monthly retainer</h4>
                    <Pill color="violet">{lb.retainer.priceRange}</Pill>
                  </div>
                  <p className="text-sm text-slate-400 leading-relaxed">{lb.retainer.scope}</p>
                  <p className="text-sm text-slate-300 leading-relaxed mt-2">{lb.retainer.pitch}</p>
                </div>
              </div>
            </Card>
          )}
        </section>
      )}

      <Divider />

      {/* Templates */}
      {Array.isArray(lb.templates) && lb.templates.length > 0 && (
        <section>
          <SectionHeader
            icon={Copy}
            color="sky"
            title="Outreach templates"
            subtitle="Replace every {token} before sending. Each one leads with a defect and its cost, never with “we can make it better”."
          />
          <div className="space-y-3">
            {lb.templates.map((t) => <TemplateCard key={t.id} template={t} />)}
          </div>
        </section>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// VenueCard — one lead. The whole card is tinted by its Ready2UP decision.
// ---------------------------------------------------------------------------
export function VenueCard({ lead, statusError, decisionError, onStatusChange, onDecisionChange }) {
  const { card: decisionClass, bar: decisionBar } = decisionStyle(lead.decision);
  const verified = /^VERIFIED/i.test(lead.weakness || '');

  return (
    <Card className={decisionClass}>
      {decisionBar && (
        <span aria-hidden="true" className={`absolute left-0 top-0 bottom-0 w-1 ${decisionBar}`} />
      )}

      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1.5">
            <Pill color="sky">{lead.category}</Pill>
            <span className="inline-flex items-center gap-1 text-[11px] text-slate-500">
              <MapPin className="w-3 h-3" />{lead.city}
            </span>
            {lead.priority === 'High' && <Pill color="violet">High priority</Pill>}
            {verified && <Pill color="amber">Verified defect</Pill>}
            {lead.decision === 'Accepted' && (
              <Pill color="emerald">
                <span className="inline-flex items-center gap-1"><ThumbsUp className="w-3 h-3" /> Accepted</span>
              </Pill>
            )}
            {lead.decision === 'In progress' && (
              <Pill color="amber">
                <span className="inline-flex items-center gap-1"><Loader className="w-3 h-3" /> In progress</span>
              </Pill>
            )}
            {lead.decision === 'Rejected' && (
              <Pill color="rose">
                <span className="inline-flex items-center gap-1"><ThumbsDown className="w-3 h-3" /> Rejected</span>
              </Pill>
            )}
          </div>
          <h4 className="font-bold text-base">{lead.name}</h4>
        </div>

        <div className="shrink-0 flex flex-col items-end gap-2">
          <select
            aria-label={`Outreach status for ${lead.name}`}
            value={lead.status}
            onChange={(e) => onStatusChange(lead.id, e.target.value)}
            className="bg-ink-900 border border-white/[0.10] rounded-lg px-2.5 py-1.5 text-xs focus-ring"
          >
            {OUTREACH_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          {statusError && <span className="text-[10px] text-rose-300">Not saved</span>}
        </div>
      </div>

      {/* Decision buttons — click Accept and the whole card turns green. */}
      <div className="mt-3.5 flex items-center gap-2 flex-wrap">
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mr-1">Decision</span>
        <DecisionButton
          label="Accept"
          icon={ThumbsUp}
          active={lead.decision === 'Accepted'}
          activeClass="bg-emerald-500 text-ink-950 border-emerald-400"
          onClick={() => onDecisionChange(lead.id, lead.decision === 'Accepted' ? 'Undecided' : 'Accepted')}
        />
        <DecisionButton
          label="In progress"
          icon={Loader}
          active={lead.decision === 'In progress'}
          activeClass="bg-amber-500 text-ink-950 border-amber-400"
          onClick={() => onDecisionChange(lead.id, lead.decision === 'In progress' ? 'Undecided' : 'In progress')}
        />
        <DecisionButton
          label="Reject"
          icon={ThumbsDown}
          active={lead.decision === 'Rejected'}
          activeClass="bg-rose-500 text-white border-rose-400"
          onClick={() => onDecisionChange(lead.id, lead.decision === 'Rejected' ? 'Undecided' : 'Rejected')}
        />
        {decisionError && <span className="text-[10px] text-rose-300">Not saved</span>}
      </div>

      <div className="mt-4 space-y-3">
        <Field label="Weakness (the hook)" value={lead.weakness} />
        <Field label="Contact angle" value={lead.contactAngle} />
        <Field label="Suggested proof" value={lead.suggestedProof} />
      </div>

      {(lead.phone || lead.email || lead.website) && (
        <div className="mt-4 pt-3 border-t border-white/[0.06] flex flex-wrap gap-3 text-xs text-slate-400">
          {lead.phone && (
            <a href={`tel:${lead.phone}`} className="inline-flex items-center gap-1.5 hover:text-slate-200">
              <Phone className="w-3.5 h-3.5" />{lead.phone}
            </a>
          )}
          {lead.email && (
            <a href={`mailto:${lead.email}`} className="inline-flex items-center gap-1.5 hover:text-slate-200">
              <Mail className="w-3.5 h-3.5" />{lead.email}
            </a>
          )}
          {lead.website && (
            <a
              href={lead.website}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 hover:text-slate-200 break-all"
            >
              <Globe className="w-3.5 h-3.5" />Open current site
              <ExternalLink className="w-3 h-3 shrink-0" />
            </a>
          )}
        </div>
      )}
    </Card>
  );
}

/** One decision toggle. Filled and coloured when active, outline when not. */
function DecisionButton({ label, icon: Icon, active, activeClass, onClick }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
        active
          ? activeClass
          : 'border-white/[0.12] text-slate-400 hover:text-slate-100 hover:bg-white/[0.06]'
      }`}
    >
      <Icon className="w-3.5 h-3.5" />
      {label}
    </button>
  );
}

/** A labelled read-only field with a placeholder when the value is missing. */
function Field({ label, value }) {
  return (
    <div>
      <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">{label}</div>
      {value ? (
        <p className="text-sm text-slate-300 leading-relaxed">{value}</p>
      ) : (
        <span className="text-sm text-slate-500 italic">{PLACEHOLDER}</span>
      )}
    </div>
  );
}

/** One copy-to-clipboard outreach template. */
export function TemplateCard({ template }) {
  const [copied, setCopied] = useState(false);
  const [failed, setFailed] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(template.body);
      setFailed(false);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
      setFailed(true);
    }
  }

  return (
    <Card className="!p-0 overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-5 py-3.5 border-b border-white/[0.06] flex-wrap">
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          <Pill color="sky">{template.label}</Pill>
          {template.channel && <span className="text-[11px] text-slate-500">{template.channel}</span>}
        </div>
        <div className="flex items-center gap-2">
          {failed && <span className="text-[10px] text-rose-300">Copy failed — select manually</span>}
          <button
            onClick={copy}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-slate-100 px-2.5 py-1.5 rounded-lg hover:bg-white/[0.06] transition-colors"
          >
            {copied
              ? <><Check className="w-3.5 h-3.5 text-emerald-300" /> Copied</>
              : <><Copy className="w-3.5 h-3.5" /> Copy</>}
          </button>
        </div>
      </div>
      <pre className="px-5 py-4 text-sm text-slate-300 whitespace-pre-wrap font-sans leading-relaxed">
        {template.body}
      </pre>
    </Card>
  );
}
