// Shared fast-check arbitraries for the Institute Outreach logic-layer
// property tests. This file is intentionally NOT named *.test.js so the
// Vitest include pattern does not treat it as a test suite; it is imported
// by the individual property test files.

import fc from 'fast-check';
import { INSTITUTE_CATEGORIES, OUTREACH_STATUSES } from '../outreach.js';

// City drawn from a set that includes the four on-list buckets AND off-list
// values, so grouping/filtering logic exercises the 'Other' bucket.
export const cityArb = fc.oneof(
  fc.constantFrom('Nashik', 'Pune', 'Mumbai', 'Other'),
  fc.constantFrom('Delhi', 'Sinnar', 'Nagpur', 'Thane', 'Aurangabad', 'Bengaluru')
);

export const categoryArb = fc.constantFrom(...INSTITUTE_CATEGORIES);

// One of the seven valid statuses.
export const validStatusArb = fc.constantFrom(...OUTREACH_STATUSES);

// A persisted store value: a valid status, an invalid/garbage string, a
// non-string, or absent — used to exercise invalid-value fallback.
export const persistedValueArb = fc.oneof(
  validStatusArb,
  fc.string(),
  fc.constantFrom('bogus', 'DELETED', '', 'not contacted', 'closed'),
  fc.integer(),
  fc.constant(null)
);

// Institute name including mixed case and empty strings.
export const nameArb = fc.oneof(
  fc.string({ maxLength: 30 }),
  fc.string({ minLength: 1, maxLength: 30 }).map((s) => s.toUpperCase()),
  fc.string({ minLength: 1, maxLength: 30 }).map((s) => s.toLowerCase()),
  fc.constant('')
);

// An optional contact field: present (non-empty string) or absent (undefined).
const optionalContactArb = fc.option(fc.string({ minLength: 1, maxLength: 15 }), {
  nil: undefined,
});

// A single lead record. `status` is optionally present as a valid seed status
// (or absent). Optional contact fields are randomly present/absent.
export const leadArb = fc.record({
  id: fc.string({ minLength: 1, maxLength: 10 }),
  name: nameArb,
  category: categoryArb,
  city: cityArb,
  weakness: fc.string({ maxLength: 20 }),
  suggestedProof: fc.string({ maxLength: 20 }),
  contactAngle: fc.string({ maxLength: 20 }),
  status: fc.option(validStatusArb, { nil: undefined }),
  phone: optionalContactArb,
  email: optionalContactArb,
  website: optionalContactArb,
});

// A collection of leads.
export const leadsArb = fc.array(leadArb, { maxLength: 25 });

// Reassigns deterministic unique ids by index so a generated collection has no
// duplicate ids (used where uniqueness must be guaranteed as a precondition).
export function withUniqueIds(leads) {
  return leads.map((lead, i) => ({ ...lead, id: `lead-${i}` }));
}

// Resolves every lead against a store, returning leads whose `status` holds the
// resolved status (the "resolvedLeads" shape the UI passes downstream).
export function resolveAll(leads, store, resolveStatus) {
  return leads.map((lead) => ({ ...lead, status: resolveStatus(lead, store) }));
}
