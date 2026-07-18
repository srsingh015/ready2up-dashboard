import { useMemo, useState, useCallback } from 'react';
import {
  GraduationCap, Filter, X, Copy, Check, AlertTriangle, ExternalLink,
  MapPin, Building2, Tag as TagIcon, Star, Mail, MessageCircle, Phone, Globe,
} from 'lucide-react';
import { PageHeader, SectionHeader, Card, Pill, StatCard, Divider } from '../ui/Section.jsx';
import { useLocalStorage } from '../../hooks/useLocalStorage.js';
import {
  resolveStatus,
  groupLeadsByCity,
  applyFilters,
  computePipeline,
  matchProof,
  OUTREACH_STATUSES,
  CITY_ORDER,
} from '../../utils/outreach.js';

// The namespaced key the useLocalStorage hook writes to (NS = 'r2up_v1::').
// We re-read this exact key to verify a write actually landed (Req 5.6).
const LEAD_STORE_KEY = 'r2up_v1::io_lead_status';

// A small colour cycle so each status pill/stat is visually distinct.
const STATUS_COLOR = {
  'Not contacted': 'slate',
  'Contacted': 'sky',
  'Replied': 'violet',
  'Meeting': 'amber',
  'Proposal sent': 'amber',
  'Closed won': 'emerald',
  'Closed lost': 'rose',
};

const PLACEHOLDER = '— not available';

export default function InstituteOutreach({ data }) {
  const io = data?.instituteOutreach;

  // Filter state (owned here, passed down). Always mounted regardless of matches.
  const [cityFilter, setCityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Persisted per-lead status overrides: { [leadId]: status }.
  const [statusStore, setStatusStore] = useLocalStorage('io_lead_status', {});

  // Per-lead persist errors that drive the "not saved" indicator (Req 5.6).
  const [persistErrors, setPersistErrors] = useState({});

  const setPersistError = useCallback((leadId) => {
    setPersistErrors((e) => ({ ...e, [leadId]: true }));
  }, []);
  const clearPersistError = useCallback((leadId) => {
    setPersistErrors((e) => {
      if (!e[leadId]) return e;
      const next = { ...e };
      delete next[leadId];
      return next;
    });
  }, []);

  // Commit a status change with verified read-back (design.md Req 5.6).
  // Optimistically update, write straight through, then re-read the namespaced
  // key. On mismatch/throw, roll back to the last good value and flag the lead.
  const commitStatus = useCallback(
    (leadId, newStatus) => {
      const prevStore = statusStore; // last successfully rendered/persisted value
      const nextStore = { ...prevStore, [leadId]: newStatus };
      setStatusStore(nextStore); // optimistic UI + hook persist
      try {
        localStorage.setItem(LEAD_STORE_KEY, JSON.stringify(nextStore));
        const raw = localStorage.getItem(LEAD_STORE_KEY);
        const roundTripped = raw ? JSON.parse(raw) : {};
        if (roundTripped[leadId] !== newStatus) throw new Error('verify failed');
        clearPersistError(leadId);
      } catch {
        // Roll back to the last successfully persisted value and flag it.
        setStatusStore(prevStore);
        setPersistError(leadId);
      }
    },
    [statusStore, setStatusStore, clearPersistError, setPersistError]
  );

  // Derived data — computed unconditionally so hooks run in a stable order
  // even when the content guard below bails out (Rules of Hooks).
  const leads = Array.isArray(io?.leads) ? io.leads : [];
  const portfolioProof = Array.isArray(io?.portfolioProof) ? io.portfolioProof : [];

  // Resolve each seed lead's effective status (override → seed → default).
  const resolvedLeads = useMemo(
    () => leads.map((lead) => ({ ...lead, status: resolveStatus(lead, statusStore) })),
    [leads, statusStore]
  );

  // Pipeline summary, scoped to the active city filter (Req 9.x).
  const pipeline = useMemo(
    () => computePipeline(resolvedLeads, cityFilter),
    [resolvedLeads, cityFilter]
  );

  // City-grouped, filtered, sorted lead list (Req 4.x).
  const visibleGroups = useMemo(
    () => groupLeadsByCity(applyFilters(resolvedLeads, cityFilter, statusFilter)),
    [resolvedLeads, cityFilter, statusFilter]
  );

  const filtersActive = cityFilter !== 'all' || statusFilter !== 'all';

  // --- Content guard: nothing renders without the outreach content (Req 1.6, 2.6).
  if (!io) {
    return (
      <div className="space-y-8">
        <PageHeader
          eyebrow="Institute Outreach"
          title="Institute Outreach"
        />
        <Card>
          <div className="flex items-center gap-3 text-slate-300">
            <AlertTriangle className="w-5 h-5 text-amber-300 shrink-0" />
            <p className="text-sm">Outreach content is currently unavailable.</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Execution · Win Institute Websites"
        title="Institute Outreach"
        subtitle={io.offer?.headline}
      />

      {io.offer?.description && (
        <Card>
          <p className="text-sm text-slate-300 leading-relaxed">{io.offer.description}</p>
        </Card>
      )}

      <PipelineSummary pipeline={pipeline} />

      <Divider />

      <section>
        <SectionHeader
          icon={GraduationCap}
          title="Target leads"
          subtitle="Small & mid colleges and schools to pitch — Nashik first, then Pune and Mumbai."
          color="sky"
        />
        <Filters
          cityFilter={cityFilter}
          statusFilter={statusFilter}
          onCityChange={setCityFilter}
          onStatusChange={setStatusFilter}
          onClear={() => {
            setCityFilter('all');
            setStatusFilter('all');
          }}
          filtersActive={filtersActive}
        />
        <div className="mt-5">
          <LeadList
            groups={visibleGroups}
            totalSeedLeads={leads.length}
            portfolioProof={portfolioProof}
            statusStore={statusStore}
            persistErrors={persistErrors}
            onStatusChange={commitStatus}
          />
        </div>
      </section>

      <Divider />

      <PricingTiers pricingTiers={io.pricingTiers} addOns={io.addOns} />

      <Divider />

      <PortfolioProof portfolioProof={portfolioProof} />

      <Divider />

      <OutreachTemplates outreachTemplates={io.outreachTemplates} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// PipelineSummary — per-status counts (incl. 0), total, conversion % (Req 9.x)
// ---------------------------------------------------------------------------
export function PipelineSummary({ pipeline }) {
  const { counts, total, conversionPct } = pipeline;
  return (
    <section>
      <SectionHeader
        icon={TagIcon}
        title="Pipeline"
        subtitle="Live counts by stage — updates the moment you change a lead's status."
        color="emerald"
      />
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <StatCard label="Total leads" value={total} color="slate" />
        <StatCard label="Closed-won conversion" value={`${conversionPct}%`} color="emerald" />
        <div className="col-span-2 md:col-span-1" />
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {OUTREACH_STATUSES.map((status) => (
          <span
            key={status}
            className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-xs"
          >
            <Pill color={STATUS_COLOR[status] || 'slate'}>{counts[status] ?? 0}</Pill>
            <span className="text-slate-300">{status}</span>
          </span>
        ))}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Filters — city + status selectors with a clear control (Req 4.6–4.9)
// ---------------------------------------------------------------------------
export function Filters({ cityFilter, statusFilter, onCityChange, onStatusChange, onClear, filtersActive }) {
  return (
    <Card className="!p-4">
      <div className="flex flex-col md:flex-row md:items-end gap-3">
        <div className="flex items-center gap-2 text-slate-400 shrink-0">
          <Filter className="w-4 h-4 text-sky-300" />
          <span className="text-[10px] font-bold uppercase tracking-widest">Filters</span>
        </div>
        <label className="flex-1 min-w-0">
          <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">City</span>
          <select
            aria-label="Filter by city"
            value={cityFilter}
            onChange={(e) => onCityChange(e.target.value)}
            className="w-full bg-ink-900 border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm focus-ring"
          >
            <option value="all">All cities</option>
            {CITY_ORDER.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </label>
        <label className="flex-1 min-w-0">
          <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Status</span>
          <select
            aria-label="Filter by status"
            value={statusFilter}
            onChange={(e) => onStatusChange(e.target.value)}
            className="w-full bg-ink-900 border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm focus-ring"
          >
            <option value="all">All statuses</option>
            {OUTREACH_STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </label>
        <button
          onClick={onClear}
          disabled={!filtersActive}
          className={`shrink-0 inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-colors border ${
            filtersActive
              ? 'bg-white/[0.04] border-white/[0.08] text-slate-200 hover:bg-white/[0.08]'
              : 'border-white/[0.05] text-slate-600 cursor-not-allowed'
          }`}
        >
          <X className="w-3.5 h-3.5" />
          Clear
        </button>
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// LeadList — one block per non-empty city group; empty states (Req 1.6, 4.x)
// ---------------------------------------------------------------------------
export function LeadList({ groups, totalSeedLeads, portfolioProof, statusStore, persistErrors, onStatusChange }) {
  // No seed leads at all → seed empty state (Req 1.6).
  if (totalSeedLeads === 0) {
    return (
      <Card>
        <p className="text-sm text-slate-400 text-center py-6">
          No leads have been added yet.
        </p>
      </Card>
    );
  }

  // Seed leads exist but none match the active filters → zero-match state (Req 4.9).
  if (groups.length === 0) {
    return (
      <Card>
        <p className="text-sm text-slate-400 text-center py-6">
          No leads match the current filters. Adjust or clear the filters above.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {groups.map((group) => (
        <div key={group.city}>
          <div className="flex items-center gap-2 mb-3">
            <MapPin className="w-4 h-4 text-amber-300" />
            <h3 className="font-display text-lg font-extrabold">{group.city}</h3>
            <Pill color="slate">{group.count}</Pill>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {group.leads.map((lead) => (
              <LeadCard
                key={lead.id}
                lead={lead}
                resolvedStatus={lead.status}
                proof={matchProof(lead, portfolioProof)}
                persistError={!!persistErrors[lead.id]}
                onStatusChange={onStatusChange}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// LeadCard — all required fields with placeholders; optional contacts (Req 4.4, 4.5, 3.7)
// ---------------------------------------------------------------------------
export function LeadCard({ lead, resolvedStatus, proof, persistError, onStatusChange }) {
  // Resolve the proof link(s) to show. matchProof returns either a single
  // group { category, urls } or a fallback { fallback: true, groups }.
  const proofUrl = lead.proofUrl
    || (proof && !proof.fallback && proof.urls && proof.urls[0])
    || null;

  return (
    <Card>
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <Pill color="sky">{lead.category}</Pill>
            <span className="inline-flex items-center gap-1 text-[11px] text-slate-500">
              <MapPin className="w-3 h-3" />{lead.location || lead.city}
            </span>
          </div>
          <h4 className="font-bold text-base flex items-center gap-2">
            <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="min-w-0">{lead.name}</span>
          </h4>
        </div>
        <div className="shrink-0">
          <StatusDropdown
            value={resolvedStatus}
            error={persistError}
            onChange={(newStatus) => onStatusChange(lead.id, newStatus)}
          />
        </div>
      </div>

      <div className="mt-4 space-y-3">
        <Field label="Weakness (the hook)" value={lead.weakness} />
        <Field label="Contact angle" value={lead.contactAngle} />
        <div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">
            Suggested proof
          </div>
          {lead.suggestedProof ? (
            proofUrl ? (
              <a
                href={proofUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-emerald-300 hover:text-emerald-200 break-all"
              >
                {lead.suggestedProof}
                <ExternalLink className="w-3.5 h-3.5 shrink-0" />
              </a>
            ) : (
              <span className="text-sm text-slate-300">{lead.suggestedProof}</span>
            )
          ) : (
            <span className="text-sm text-slate-500 italic">{PLACEHOLDER}</span>
          )}
        </div>
      </div>

      {/* Optional contact and research-source fields render only when present. */}
      {(lead.phone || lead.email || lead.website || lead.sourceUrl) && (
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
              <Globe className="w-3.5 h-3.5" />{lead.website}
            </a>
          )}
          {lead.sourceUrl && (
            <a
              href={lead.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 hover:text-slate-200"
            >
              <ExternalLink className="w-3.5 h-3.5" />Directory source
            </a>
          )}
        </div>
      )}
    </Card>
  );
}

function Field({ label, value }) {
  return (
    <div>
      <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">{label}</div>
      {value ? (
        <p className="text-sm text-slate-300 leading-relaxed">{value}</p>
      ) : (
        <p className="text-sm text-slate-500 italic">{PLACEHOLDER}</p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// StatusDropdown — <select> restricted to the seven statuses (Req 5.4, 5.6)
// ---------------------------------------------------------------------------
export function StatusDropdown({ value, onChange, error }) {
  return (
    <div className="flex flex-col items-end gap-1">
      <select
        aria-label="Lead status"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-ink-900 border border-white/[0.08] rounded-lg px-2.5 py-1.5 text-xs font-semibold focus-ring"
      >
        {OUTREACH_STATUSES.map((s) => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>
      {error && (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-300">
          <AlertTriangle className="w-3 h-3" />
          Not saved
        </span>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// PricingTiers — three tiers + add-ons, "pricing unavailable" fallback (Req 6.x)
// ---------------------------------------------------------------------------
export function PricingTiers({ pricingTiers, addOns }) {
  const tiers = Array.isArray(pricingTiers) ? pricingTiers : [];

  return (
    <section>
      <SectionHeader
        icon={TagIcon}
        title="Pricing"
        subtitle="Three build tiers. Standard is the go-to admissions-ready offer."
        color="amber"
      />
      {tiers.length === 0 ? (
        <Card>
          <p className="text-sm text-slate-400 text-center py-6">Pricing unavailable.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {tiers.map((tier) => (
            <Card
              key={tier.id}
              className={tier.recommended ? '!border-amber-500/30 bg-gradient-to-br from-amber-500/[0.05] to-transparent' : ''}
            >
              {tier.recommended && (
                <Pill color="amber">
                  <span className="inline-flex items-center gap-1">
                    <Star className="w-3 h-3 fill-current" /> Recommended
                  </span>
                </Pill>
              )}
              <h4 className="font-display text-xl font-extrabold mt-2">{tier.name}</h4>
              <div className="font-display text-lg font-extrabold gold-text mt-2">{tier.priceRange}</div>
              <p className="text-sm text-slate-400 mt-2 leading-relaxed">{tier.scope}</p>
            </Card>
          ))}
        </div>
      )}

      {Array.isArray(addOns) && addOns.length > 0 && (
        <div className="mt-5">
          <div className="text-[10px] font-bold uppercase tracking-widest text-violet-300 mb-2">
            Add-ons · quoted separately
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            {addOns.map((addOn) => (
              <div
                key={addOn.id}
                className="flex items-center justify-between gap-3 p-3 bg-ink-800/60 border border-white/[0.06] rounded-xl"
              >
                <span className="text-sm text-slate-200">{addOn.name}</span>
                <span className="text-xs text-slate-400 whitespace-nowrap">
                  {addOn.priceRange || 'quoted separately'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

// ---------------------------------------------------------------------------
// PortfolioProof — one labeled group per category; safe external links (Req 7.x)
// ---------------------------------------------------------------------------
export function PortfolioProof({ portfolioProof }) {
  const groups = Array.isArray(portfolioProof) ? portfolioProof : [];

  return (
    <section>
      <SectionHeader
        icon={Building2}
        title="Portfolio proof"
        subtitle="Matched Navjeevan work to show, by institute category."
        color="violet"
      />
      {groups.length === 0 ? (
        <Card>
          <p className="text-sm text-slate-400 text-center py-6">No portfolio proof available.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {groups.map((group) => (
            <Card key={group.category}>
              <div className="flex items-center gap-2 mb-2">
                <Pill color="violet">{group.category}</Pill>
              </div>
              <ul className="space-y-1.5">
                {(group.urls || []).map((url) => (
                  <li key={url}>
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm text-emerald-300 hover:text-emerald-200 break-all"
                    >
                      {url}
                      <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                    </a>
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}

// ---------------------------------------------------------------------------
// OutreachTemplates — channel-labeled, copyable, tokens verbatim (Req 8.x)
// ---------------------------------------------------------------------------
export function OutreachTemplates({ outreachTemplates }) {
  const templates = Array.isArray(outreachTemplates) ? outreachTemplates : [];

  return (
    <section>
      <SectionHeader
        icon={MessageCircle}
        title="Outreach templates"
        subtitle="Copy, fill the [brackets], and send. Tokens are preserved exactly."
        color="sky"
      />
      {templates.length === 0 ? (
        <Card>
          <p className="text-sm text-slate-400 text-center py-6">No templates available.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {templates.map((template) => (
            <TemplateCard key={template.id} template={template} />
          ))}
        </div>
      )}
    </section>
  );
}

function TemplateCard({ template }) {
  // 'copied' | 'error' | null — drives the copy button feedback.
  const [copyState, setCopyState] = useState(null);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(template.body);
      setCopyState('copied');
      // Clear the confirmation well within 5s (Req 8.4).
      setTimeout(() => setCopyState((s) => (s === 'copied' ? null : s)), 2000);
    } catch {
      // Leave the displayed text unchanged; only surface an error (Req 8.5).
      setCopyState('error');
      setTimeout(() => setCopyState((s) => (s === 'error' ? null : s)), 3000);
    }
  }

  const isEmail = template.channel === 'email';
  return (
    <Card>
      <div className="flex items-start justify-between gap-3 flex-wrap mb-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <Pill color={isEmail ? 'sky' : 'emerald'}>
              <span className="inline-flex items-center gap-1">
                {isEmail ? <Mail className="w-3 h-3" /> : <MessageCircle className="w-3 h-3" />}
                {template.channel}
              </span>
            </Pill>
          </div>
          <h4 className="font-bold text-base">{template.label}</h4>
        </div>
        <button
          onClick={handleCopy}
          className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-colors ${
            copyState === 'copied'
              ? 'bg-emerald-500/20 text-emerald-300'
              : copyState === 'error'
              ? 'bg-rose-500/20 text-rose-300'
              : 'bg-sky-500/15 text-sky-300 hover:bg-sky-500/25'
          }`}
        >
          {copyState === 'copied' ? (
            <><Check className="w-3.5 h-3.5" /> Copied</>
          ) : copyState === 'error' ? (
            <><AlertTriangle className="w-3.5 h-3.5" /> Copy failed</>
          ) : (
            <><Copy className="w-3.5 h-3.5" /> Copy</>
          )}
        </button>
      </div>
      <pre className="bg-ink-900/80 border border-white/[0.06] rounded-xl p-4 text-[13px] leading-relaxed text-slate-300 whitespace-pre-wrap font-sans">{template.body}</pre>
    </Card>
  );
}
