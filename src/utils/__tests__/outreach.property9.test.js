// Feature: institute-outreach, Property 9: applying a single status change to
// one lead makes only that lead resolve to the new status; every other lead's
// resolved status is unchanged.
// Validates: Requirements 5.1
import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { resolveStatus } from '../outreach.js';
import { leadArb, validStatusArb, withUniqueIds } from './outreach.arbitraries.js';

describe('Property 9: status-change isolation', () => {
  it('changes only the targeted lead, leaving all others resolved identically', () => {
    fc.assert(
      fc.property(
        fc.array(leadArb, { minLength: 1, maxLength: 20 }),
        fc.nat(),
        validStatusArb,
        (rawLeads, pick, newStatus) => {
          const leads = withUniqueIds(rawLeads);
          const store = {};
          const target = leads[pick % leads.length];

          // Resolved statuses before the change.
          const before = leads.map((l) => resolveStatus(l, store));

          // Apply a single status change for the target lead.
          const nextStore = { ...store, [target.id]: newStatus };

          leads.forEach((lead, i) => {
            const resolved = resolveStatus(lead, nextStore);
            if (lead.id === target.id) {
              expect(resolved).toBe(newStatus);
            } else {
              expect(resolved).toBe(before[i]);
            }
          });
        }
      ),
      { numRuns: 100 }
    );
  });
});
