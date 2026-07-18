// Feature: institute-outreach, Property 1: Content serialization round-trip —
// for any valid instituteOutreach content object, serializing it (as the build
// step does via JSON.stringify) and deserializing it produces a deeply-equal
// object, preserving every lead, tier, add-on, proof group, and template
// without omission or alteration.
// Validates: Requirements 2.3
import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { instituteOutreach } from '../../../content-source/instituteOutreach.js';
import { INSTITUTE_CATEGORIES, OUTREACH_STATUSES, CITY_ORDER } from '../outreach.js';

describe('Property 1: content serialization round-trip', () => {
  it('round-trips the real seed content object deeply equal', () => {
    const roundTripped = JSON.parse(JSON.stringify(instituteOutreach));
    expect(roundTripped).toEqual(instituteOutreach);
  });

  // A generator producing objects that conform to the instituteOutreach schema
  // (JSON-safe values only), to exercise the round-trip property across the
  // input space rather than only the single seed literal.
  const leadArb = fc.record(
    {
      id: fc.string({ minLength: 1, maxLength: 12 }),
      name: fc.string({ minLength: 1, maxLength: 40 }),
      category: fc.constantFrom(...INSTITUTE_CATEGORIES),
      city: fc.constantFrom(...CITY_ORDER),
      weakness: fc.string({ maxLength: 40 }),
      suggestedProof: fc.string({ maxLength: 40 }),
      contactAngle: fc.string({ maxLength: 40 }),
      status: fc.option(fc.constantFrom(...OUTREACH_STATUSES), { nil: undefined }),
      phone: fc.option(fc.string({ maxLength: 15 }), { nil: undefined }),
      email: fc.option(fc.string({ maxLength: 20 }), { nil: undefined }),
      website: fc.option(fc.string({ maxLength: 30 }), { nil: undefined }),
    },
    { requiredKeys: ['id', 'name', 'category', 'city', 'weakness', 'suggestedProof', 'contactAngle'] }
  );

  const pricingTierArb = fc.record(
    {
      id: fc.string({ minLength: 1, maxLength: 12 }),
      name: fc.string({ minLength: 1, maxLength: 20 }),
      priceRange: fc.string({ maxLength: 30 }),
      scope: fc.string({ maxLength: 40 }),
      recommended: fc.option(fc.boolean(), { nil: undefined }),
    },
    { requiredKeys: ['id', 'name', 'priceRange', 'scope'] }
  );

  const addOnArb = fc.record(
    {
      id: fc.string({ minLength: 1, maxLength: 12 }),
      name: fc.string({ minLength: 1, maxLength: 30 }),
      priceRange: fc.option(fc.string({ maxLength: 30 }), { nil: undefined }),
    },
    { requiredKeys: ['id', 'name'] }
  );

  const proofGroupArb = fc.record({
    category: fc.constantFrom(...INSTITUTE_CATEGORIES),
    urls: fc.array(fc.webUrl(), { minLength: 1, maxLength: 3 }),
  });

  const templateArb = fc.record({
    id: fc.string({ minLength: 1, maxLength: 12 }),
    channel: fc.constantFrom('email', 'WhatsApp'),
    label: fc.string({ minLength: 1, maxLength: 30 }),
    body: fc.string({ maxLength: 200 }),
  });

  const contentArb = fc.record({
    offer: fc.record({
      headline: fc.string({ maxLength: 80 }),
      description: fc.string({ maxLength: 200 }),
    }),
    leads: fc.array(leadArb, { maxLength: 10 }),
    pricingTiers: fc.array(pricingTierArb, { maxLength: 3 }),
    addOns: fc.array(addOnArb, { maxLength: 5 }),
    portfolioProof: fc.array(proofGroupArb, { maxLength: 7 }),
    outreachTemplates: fc.array(templateArb, { maxLength: 5 }),
  });

  it('round-trips any schema-conforming content object deeply equal', () => {
    fc.assert(
      fc.property(contentArb, (obj) => {
        const roundTripped = JSON.parse(JSON.stringify(obj));
        expect(roundTripped).toEqual(obj);
      }),
      { numRuns: 100 }
    );
  });
});
