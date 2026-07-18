// Feature: institute-outreach, Property 10: computePipeline returns a counts
// map with an entry for every one of the seven statuses (default 0), each equal
// to the number of scoped leads whose resolved status is that status, and the
// sum of all counts equals the total number of scoped leads.
// Validates: Requirements 9.1, 9.3, 9.4, 9.5
import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import {
  computePipeline,
  resolveStatus,
  OUTREACH_STATUSES,
  CITY_ORDER,
} from '../outreach.js';
import { leadsArb, persistedValueArb, resolveAll } from './outreach.arbitraries.js';

const cityBucket = (city) =>
  city === 'Nashik' || city === 'Pune' || city === 'Mumbai' ? city : 'Other';

const cityScopeArb = fc.constantFrom('all', ...CITY_ORDER);

describe('Property 10: pipeline counts partition the scoped leads', () => {
  it('covers all seven statuses and sums to the scoped total', () => {
    fc.assert(
      fc.property(
        leadsArb,
        fc.dictionary(fc.string(), persistedValueArb),
        cityScopeArb,
        (rawLeads, store, cityScope) => {
          const leads = resolveAll(rawLeads, store, resolveStatus);
          const { counts, total } = computePipeline(leads, cityScope);

          // counts has an entry for every one of the seven statuses.
          expect(Object.keys(counts).sort()).toEqual([...OUTREACH_STATUSES].sort());

          // Scoped leads = leads whose bucket matches the scope (or all).
          const scoped =
            cityScope === 'all'
              ? leads
              : leads.filter((l) => cityBucket(l.city) === cityScope);

          // Each count equals the number of scoped leads with that status.
          for (const status of OUTREACH_STATUSES) {
            const expected = scoped.filter((l) => l.status === status).length;
            expect(counts[status]).toBe(expected);
          }

          // Sum of counts equals total equals scoped count.
          const sum = OUTREACH_STATUSES.reduce((acc, s) => acc + counts[s], 0);
          expect(sum).toBe(total);
          expect(total).toBe(scoped.length);
        }
      ),
      { numRuns: 100 }
    );
  });
});
