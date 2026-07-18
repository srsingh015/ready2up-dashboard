// Pure logic layer for the Institute Outreach feature.
//
// This module holds ALL input-dependent decision logic for the section:
// status resolution, lead validation, city grouping, filtering, pipeline
// math, and portfolio-proof matching. It holds no React state and has no
// side effects, which is what makes the correctness properties in
// design.md directly property-testable.

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

// The seven outreach statuses, in pipeline display order.
export const OUTREACH_STATUSES = [
  'Not contacted',
  'Contacted',
  'Replied',
  'Meeting',
  'Proposal sent',
  'Closed won',
  'Closed lost',
];

// The status that counts toward the closed-won conversion figure.
export const CLOSED_WON = 'Closed won';

// City groups in display order. Any city not among the first three is
// bucketed into 'Other'.
export const CITY_ORDER = ['Nashik', 'Pune', 'Mumbai', 'Other'];

// The closed set of institute categories, in display order.
export const INSTITUTE_CATEGORIES = [
  'MBA',
  'Trust/Foundation',
  'Pharmacy college',
  'Day school',
  'Science college',
  'School',
  'Law college',
];

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

// Buckets an arbitrary city string into one of the four City groups.
// Nashik/Pune/Mumbai map to themselves; anything else maps to 'Other'.
function cityBucket(city) {
  if (city === 'Nashik' || city === 'Pune' || city === 'Mumbai') return city;
  return 'Other';
}

// Returns true iff `value` is one of the seven valid outreach statuses.
function isValidStatus(value) {
  return typeof value === 'string' && OUTREACH_STATUSES.includes(value);
}

// Returns the resolved status held on an already-resolved lead, defaulting
// invalid/absent values to 'Not contacted'.
function statusOf(lead) {
  return isValidStatus(lead && lead.status) ? lead.status : 'Not contacted';
}

// ---------------------------------------------------------------------------
// Status resolution
// ---------------------------------------------------------------------------

// Resolves the effective status for a lead given a persisted status store.
// Precedence (design.md "Status resolution precedence"):
//   1. valid persisted override in store[lead.id]
//   2. lead's seed status (if a valid status)
//   3. 'Not contacted'
// Any persisted value that is not one of the seven valid statuses is ignored.
export function resolveStatus(lead, store) {
  const persisted = store ? store[lead.id] : undefined;
  if (isValidStatus(persisted)) return persisted;
  if (isValidStatus(lead && lead.status)) return lead.status;
  return 'Not contacted';
}

// ---------------------------------------------------------------------------
// Lead validation & uniqueness
// ---------------------------------------------------------------------------

function isNonEmptyString(value) {
  return typeof value === 'string' && value.length > 0;
}

// Validates a single lead. Accepts iff every required field is present,
// the name length is 1–200, the city is one of the four City values, and
// the category is one of the closed InstituteCategory set. Optional contact
// fields (phone/email/website) never affect validity.
export function validateLead(lead) {
  if (!lead || typeof lead !== 'object') return false;

  // Required non-empty string fields.
  if (!isNonEmptyString(lead.id)) return false;
  if (!isNonEmptyString(lead.weakness)) return false;
  if (!isNonEmptyString(lead.suggestedProof)) return false;
  if (!isNonEmptyString(lead.contactAngle)) return false;

  // Name present with length 1–200.
  if (typeof lead.name !== 'string') return false;
  if (lead.name.length < 1 || lead.name.length > 200) return false;

  // City within the closed City set.
  if (!CITY_ORDER.includes(lead.city)) return false;

  // Category within the closed InstituteCategory set.
  if (!INSTITUTE_CATEGORIES.includes(lead.category)) return false;

  return true;
}

// Returns true iff every lead has a unique id (i.e. no two leads share an id).
// A uniqueness violation exists iff this returns false.
export function hasUniqueIds(leads) {
  const seen = new Set();
  for (const lead of leads) {
    const id = lead.id;
    if (seen.has(id)) return false;
    seen.add(id);
  }
  return true;
}

// ---------------------------------------------------------------------------
// Grouping & filtering
// ---------------------------------------------------------------------------

// Groups leads by City. Returns an array of { city, leads, count } whose
// order is a subsequence of CITY_ORDER (empty groups are omitted). Every
// lead whose city is not Nashik/Pune/Mumbai is routed to 'Other'; each lead
// appears in exactly one group; leads within a group are sorted A→Z by name
// case-insensitively (stable for equal names).
export function groupLeadsByCity(leads) {
  const buckets = new Map();
  for (const city of CITY_ORDER) buckets.set(city, []);
  for (const lead of leads) {
    buckets.get(cityBucket(lead.city)).push(lead);
  }

  const groups = [];
  for (const city of CITY_ORDER) {
    const groupLeads = buckets.get(city);
    if (groupLeads.length === 0) continue;
    const sorted = [...groupLeads].sort((a, b) => {
      const an = String(a.name).toLowerCase();
      const bn = String(b.name).toLowerCase();
      if (an < bn) return -1;
      if (an > bn) return 1;
      return 0;
    });
    groups.push({ city, leads: sorted, count: sorted.length });
  }
  return groups;
}

// Filters leads by city and resolved status. `cityFilter` and `statusFilter`
// each accept 'all' to disable that predicate. The status predicate compares
// against each lead's ALREADY-RESOLVED status (lead.status on the resolved
// leads passed in), consistent with design.md (leads are pre-resolved into
// resolvedLeads before filtering). The result is always a subset of the input.
export function applyFilters(leads, cityFilter, statusFilter) {
  return leads.filter((lead) => {
    const cityOk =
      cityFilter === 'all' || cityBucket(lead.city) === cityFilter;
    const statusOk =
      statusFilter === 'all' || statusOf(lead) === statusFilter;
    return cityOk && statusOk;
  });
}

// ---------------------------------------------------------------------------
// Pipeline
// ---------------------------------------------------------------------------

// Computes the pipeline summary over a set of already-resolved leads.
// `cityScope` limits the scope to a single City bucket; 'all' (or a falsy
// value) includes every lead. Returns:
//   counts        — a map with an entry for all seven statuses (default 0)
//   total         — the number of scoped leads (== sum of counts)
//   conversionPct — round(closedWon / total * 100) as an integer 0–100,
//                    or 0 when total is 0.
export function computePipeline(leads, cityScope) {
  const counts = {};
  for (const status of OUTREACH_STATUSES) counts[status] = 0;

  const scoped =
    !cityScope || cityScope === 'all'
      ? leads
      : leads.filter((lead) => cityBucket(lead.city) === cityScope);

  for (const lead of scoped) {
    counts[statusOf(lead)] += 1;
  }

  const total = scoped.length;
  const conversionPct =
    total === 0 ? 0 : Math.round((counts[CLOSED_WON] / total) * 100);

  return { counts, total, conversionPct };
}

// ---------------------------------------------------------------------------
// Portfolio proof matching
// ---------------------------------------------------------------------------

// Matches a lead to its portfolio proof group.
//
// Return shape (kept consistent for callers):
//   - MATCH:    the PortfolioProofGroup object itself, i.e. { category, urls }
//               where category === lead.category. This is deterministic: the
//               first group whose category equals the lead's category.
//   - FALLBACK: { fallback: true, groups: [...all proof groups] } when the
//               lead's category has no matching group.
//
// Callers can distinguish the two by checking the `fallback` flag.
export function matchProof(lead, portfolioProof) {
  const groups = Array.isArray(portfolioProof) ? portfolioProof : [];
  const match = groups.find((group) => group.category === lead.category);
  if (match) return match;
  return { fallback: true, groups };
}
