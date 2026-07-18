// Feature: institute-outreach, Property 7: groupLeadsByCity produces groups
// whose order is a subsequence of [Nashik, Pune, Mumbai, Other]; every lead
// whose city is not Nashik/Pune/Mumbai appears in the Other group; each group's
// count equals the number of input leads in it; every input lead appears in
// exactly one group; and within each group leads are ordered non-decreasing by
// name under case-insensitive comparison.
// Validates: Requirements 4.1, 4.2, 4.3
import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { groupLeadsByCity, CITY_ORDER } from '../outreach.js';
import { leadsArb } from './outreach.arbitraries.js';

const ON_LIST = ['Nashik', 'Pune', 'Mumbai'];

function isSubsequence(sub, full) {
  let i = 0;
  for (const item of full) {
    if (i < sub.length && sub[i] === item) i += 1;
  }
  return i === sub.length;
}

describe('Property 7: city grouping invariants', () => {
  it('holds order, Other bucketing, counts, partition, and alphabetical sort', () => {
    fc.assert(
      fc.property(leadsArb, (leads) => {
        const groups = groupLeadsByCity(leads);

        // Order is a subsequence of CITY_ORDER.
        const cities = groups.map((g) => g.city);
        expect(isSubsequence(cities, CITY_ORDER)).toBe(true);
        // No empty groups are emitted, so cities are also distinct.
        expect(new Set(cities).size).toBe(cities.length);

        // Other bucket correctness: everything in Other is off-list; nothing
        // off-list appears in an on-list group.
        for (const g of groups) {
          for (const lead of g.leads) {
            if (g.city === 'Other') {
              expect(ON_LIST).not.toContain(lead.city);
            } else {
              expect(lead.city).toBe(g.city);
            }
          }
        }

        // Counts match and total partitions the input.
        let total = 0;
        for (const g of groups) {
          expect(g.count).toBe(g.leads.length);
          total += g.leads.length;
        }
        expect(total).toBe(leads.length);

        // Alphabetical (case-insensitive) non-decreasing order within a group.
        for (const g of groups) {
          for (let i = 1; i < g.leads.length; i += 1) {
            const prev = String(g.leads[i - 1].name).toLowerCase();
            const cur = String(g.leads[i].name).toLowerCase();
            expect(prev <= cur).toBe(true);
          }
        }
      }),
      { numRuns: 100 }
    );
  });
});
