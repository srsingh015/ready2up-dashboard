// Feature: institute-outreach, Property 8: for any leads, city filter, and
// status filter, applyFilters returns exactly the leads whose city matches (or
// filter is 'all') and whose resolved status matches (or filter is 'all'); the
// result is always a subset of the input and drops no lead satisfying both.
// Validates: Requirements 4.6, 4.7, 4.8
import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import {
  applyFilters,
  resolveStatus,
  CITY_ORDER,
  OUTREACH_STATUSES,
} from '../outreach.js';
import { leadsArb, resolveAll } from './outreach.arbitraries.js';

const cityBucket = (city) =>
  city === 'Nashik' || city === 'Pune' || city === 'Mumbai' ? city : 'Other';

const cityFilterArb = fc.constantFrom('all', ...CITY_ORDER);
const statusFilterArb = fc.constantFrom('all', ...OUTREACH_STATUSES);

describe('Property 8: filter conjunction subset', () => {
  it('returns exactly the conjunction match and is always a subset', () => {
    fc.assert(
      fc.property(leadsArb, cityFilterArb, statusFilterArb, (rawLeads, cityFilter, statusFilter) => {
        // Pre-resolve leads (UI passes resolvedLeads to applyFilters).
        const leads = resolveAll(rawLeads, {}, resolveStatus);
        const result = applyFilters(leads, cityFilter, statusFilter);

        // Subset: every result element is one of the inputs (by reference).
        for (const lead of result) {
          expect(leads).toContain(lead);
        }

        // Exact conjunction match against an independent oracle.
        const oracle = leads.filter((lead) => {
          const cityOk = cityFilter === 'all' || cityBucket(lead.city) === cityFilter;
          const statusOk = statusFilter === 'all' || lead.status === statusFilter;
          return cityOk && statusOk;
        });
        expect(result).toEqual(oracle);
      }),
      { numRuns: 100 }
    );
  });
});
