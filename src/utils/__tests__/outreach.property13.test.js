// Feature: institute-outreach, Property 13: for a lead whose category has no
// matching PortfolioProofGroup, matchProof returns all available proof groups
// flagged as a fallback (indicating no category-specific proof is available).
// Validates: Requirements 7.5
import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { matchProof, INSTITUTE_CATEGORIES } from '../outreach.js';
import { leadArb } from './outreach.arbitraries.js';

const groupFor = (category) =>
  fc
    .array(fc.webUrl(), { minLength: 1, maxLength: 2 })
    .map((urls) => ({ category, urls }));

describe('Property 13: proof fallback for unmatched categories', () => {
  it('returns all groups flagged as fallback when the category has no match', () => {
    fc.assert(
      fc.property(leadArb, (lead) => {
        // Build proof groups for every OTHER category, so the lead's category
        // has no matching group.
        const otherCategories = INSTITUTE_CATEGORIES.filter((c) => c !== lead.category);
        const portfolioProof = otherCategories.map((c) => ({
          category: c,
          urls: [`https://example.com/${encodeURIComponent(c)}`],
        }));

        const result = matchProof(lead, portfolioProof);

        expect(result.fallback).toBe(true);
        expect(result.groups).toEqual(portfolioProof);
        // No returned group matches the lead's category.
        expect(result.groups.some((g) => g.category === lead.category)).toBe(false);
      }),
      { numRuns: 100 }
    );
  });
});
