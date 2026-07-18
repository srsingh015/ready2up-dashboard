// Feature: institute-outreach, Property 12: for a lead whose category has a
// matching PortfolioProofGroup, matchProof deterministically returns that group,
// whose category equals the lead's category.
// Validates: Requirements 3.4, 7.4
import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { matchProof, INSTITUTE_CATEGORIES } from '../outreach.js';
import { leadArb } from './outreach.arbitraries.js';

// A proof group for a given category, with 1–2 arbitrary urls.
const groupFor = (category) =>
  fc
    .array(fc.webUrl(), { minLength: 1, maxLength: 2 })
    .map((urls) => ({ category, urls }));

describe('Property 12: proof match determinism', () => {
  it('returns the matching group whose category equals the lead category', () => {
    fc.assert(
      fc.property(
        leadArb,
        // Build a full proof set (one group per category) in random order.
        fc.tuple(...INSTITUTE_CATEGORIES.map(groupFor)).chain((groups) =>
          fc.shuffledSubarray(groups, {
            minLength: groups.length,
            maxLength: groups.length,
          })
        ),
        (lead, portfolioProof) => {
          const result = matchProof(lead, portfolioProof);
          const resultAgain = matchProof(lead, portfolioProof);

          // Deterministic.
          expect(result).toEqual(resultAgain);
          // Returned a real matching group (not a fallback), with equal category.
          expect(result.fallback).toBeUndefined();
          expect(result.category).toBe(lead.category);
        }
      ),
      { numRuns: 100 }
    );
  });
});
