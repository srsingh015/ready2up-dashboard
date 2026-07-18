// Feature: institute-outreach, Property 3: the uniqueness validator reports a
// violation if and only if two or more leads share the same id value.
// Validates: Requirements 3.5
import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { hasUniqueIds } from '../outreach.js';
import { leadArb, leadsArb } from './outreach.arbitraries.js';

describe('Property 3: lead identifiers are unique', () => {
  it('hasUniqueIds is true iff no two leads share an id', () => {
    fc.assert(
      fc.property(leadsArb, (leads) => {
        const ids = leads.map((l) => l.id);
        const oracle = new Set(ids).size === ids.length;
        expect(hasUniqueIds(leads)).toBe(oracle);
      }),
      { numRuns: 100 }
    );
  });

  it('flags a violation whenever a duplicate id is deliberately introduced', () => {
    fc.assert(
      fc.property(
        fc.array(leadArb, { minLength: 1, maxLength: 25 }),
        fc.nat(),
        (leads, pick) => {
          // Give everyone a unique id first.
          const unique = leads.map((lead, i) => ({ ...lead, id: `u-${i}` }));
          expect(hasUniqueIds(unique)).toBe(true);

          // Now duplicate one existing id -> must be flagged.
          const idx = pick % unique.length;
          const withDup = [...unique, { ...unique[idx] }];
          expect(hasUniqueIds(withDup)).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });
});
