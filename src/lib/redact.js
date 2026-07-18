// Feature: server-side-access-control
//
// Pure money-redaction and owner-variant builders used by the content seed
// (scripts/seed-content.mjs) to produce the two stored variants of the
// `roadmap` and `months` sections:
//   - employee row (min_role='employee'): money figures deep-stripped
//   - owner row    (min_role='owner')   : an exact, unredacted deep copy
//
// Design references:
//   - Requirements 7.1, 7.2, 7.3, 7.4, 7.5, 8.4
//   - design.md "Data Models" -> redactMoney, buildOwnerVariant
//   - Correctness Properties 4 (redaction completeness) and 5 (owner fidelity)
//
// These functions are PURE: they never mutate their arguments and perform no
// I/O. `redactMoney` is applied ONLY to the `roadmap` and `months` sections by
// the seed; for any other key it returns the section unchanged.

/**
 * Field names that are always Money_Figures and must be removed at every
 * nesting depth, regardless of their value type (Req 7.1, 7.2).
 *
 *   revenueTarget     -> roadmap phase: { from, to }
 *   revenueTargetInr  -> monthly plan:  { from, to }
 *   mrrTargetInr      -> monthly plan:  number
 *   teamSize          -> roadmap phase: string/number head-count figure
 */
export const MONEY_FIELD_NAMES = Object.freeze([
  'revenueTarget',
  'revenueTargetInr',
  'mrrTargetInr',
  'teamSize',
]);

const MONEY_FIELD_SET = new Set(MONEY_FIELD_NAMES);

/**
 * Case-insensitive pattern that classifies a KPI `label` (or any label-like
 * string) as a Money_Figure: revenue, MRR/ARR, currency symbols/codes, deal
 * size, runway, and other monetary signals, plus team-size head-count KPIs
 * (Req 7.1-7.3).
 */
export const MONEY_LABEL_PATTERN =
  /revenue|mrr|arr|₹|inr|\$|usd|deal\s*size|runway|income|profit|margin|team\s*size|head\s*count|salary|cash\b|valuation|funding/i;

/**
 * Numeric fields we can POSITIVELY classify as non-money in roadmap/months
 * structures. Any other bare-number field is dropped (fail-closed, Req 7.5).
 *
 *   week   -> weekly breakdown index within a monthly plan
 *   n      -> monthly plan number (1..24)
 *   target -> KPI target metric on a NON-money KPI (money KPIs are removed
 *             wholesale before this is ever reached)
 *   month / day / order / index / count / step / rank / priority -> structural
 *             counters that carry no monetary meaning
 */
const NON_MONEY_NUMERIC_KEYS = new Set([
  'week',
  'n',
  'target',
  'month',
  'day',
  'order',
  'index',
  'count',
  'step',
  'rank',
  'priority',
]);

const isPlainObject = (v) =>
  v !== null && typeof v === 'object' && !Array.isArray(v);

/**
 * True when a KPI-like entry should be treated as a Money_Figure and removed.
 * An entry qualifies if its `label` matches the money pattern. Entries whose
 * label is missing/non-string cannot be positively classified as non-money, so
 * they are treated as money and dropped (fail-closed, Req 7.5).
 */
function isMoneyKpi(entry) {
  if (!isPlainObject(entry)) return false; // non-objects handled elsewhere
  const { label } = entry;
  if (typeof label !== 'string') return true; // unclassifiable -> drop
  return MONEY_LABEL_PATTERN.test(label);
}

/**
 * Recursively strip Money_Figures from an arbitrary roadmap/months value.
 * Returns a new value; never mutates the input.
 */
function scrub(value) {
  if (Array.isArray(value)) {
    // Recurse into each element. Primitive elements (e.g. month-index numbers
    // in roadmap `months: [1,2]`) are structural, not named money fields, so
    // they are retained as-is.
    return value.map((el) => (isPlainObject(el) || Array.isArray(el) ? scrub(el) : el));
  }

  if (isPlainObject(value)) {
    const out = {};
    for (const [key, val] of Object.entries(value)) {
      // 1) Named money fields: drop at any depth.
      if (MONEY_FIELD_SET.has(key)) continue;

      // 2) KPI arrays: drop money-labeled entries, recurse into the rest.
      if (key === 'kpis' && Array.isArray(val)) {
        out[key] = val
          .filter((entry) => !isMoneyKpi(entry))
          .map((entry) => (isPlainObject(entry) || Array.isArray(entry) ? scrub(entry) : entry));
        continue;
      }

      // 3) Bare numbers: keep only positively-classified non-money fields,
      //    otherwise drop (fail-closed, Req 7.5). NaN is not classifiable.
      if (typeof val === 'number') {
        if (NON_MONEY_NUMERIC_KEYS.has(key) && Number.isFinite(val)) {
          out[key] = val;
        }
        // else: drop the unclassifiable numeric field.
        continue;
      }

      // 4) Nested objects / arrays: recurse.
      if (isPlainObject(val) || Array.isArray(val)) {
        out[key] = scrub(val);
        continue;
      }

      // 5) Everything else (strings, booleans, null, undefined): retain.
      out[key] = val;
    }
    return out;
  }

  // Primitive at the top level: return unchanged.
  return value;
}

/**
 * Deep-clone a JSON-serializable value. Uses structuredClone when available and
 * falls back to a JSON round-trip. Pure — the input is never mutated.
 */
function deepCopy(value) {
  if (typeof structuredClone === 'function') {
    return structuredClone(value);
  }
  if (value === undefined) return undefined;
  return JSON.parse(JSON.stringify(value));
}

/**
 * redactMoney(section, key)
 *
 * Deep-remove every Money_Figure from a `roadmap` or `months` section:
 *   - fields named revenueTarget, revenueTargetInr, mrrTargetInr, teamSize
 *     (at any nesting depth)
 *   - any kpis[] entry whose label matches the money pattern
 *   - any unclassifiable numeric field (fail-closed, Req 7.5)
 * while retaining all non-money content unchanged.
 *
 * The `key` scopes behaviour: only 'roadmap' and 'months' are redacted; any
 * other key returns the section unchanged (this function is only applied to
 * those two sections by the seed).
 *
 * PURE: returns a new value and never mutates `section`.
 *
 * @template T
 * @param {T} section  the source roadmap/months data (array or object)
 * @param {string} key the section type ('roadmap' | 'months')
 * @returns {T} redacted copy for roadmap/months; a deep copy otherwise
 */
export function redactMoney(section, key) {
  if (key !== 'roadmap' && key !== 'months') {
    // Out of scope for redaction: return an untouched deep copy.
    return deepCopy(section);
  }
  return scrub(deepCopy(section));
}

/**
 * buildOwnerVariant(section)
 *
 * Return data deep-equal to the source section, applying NO removal, masking,
 * or omission — every Money_Figure is preserved for the Owner_Role
 * (Req 7.4, 8.4). PURE: returns a deep copy and never mutates `section`.
 *
 * @template T
 * @param {T} section
 * @returns {T}
 */
export function buildOwnerVariant(section) {
  return deepCopy(section);
}
