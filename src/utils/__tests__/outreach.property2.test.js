// Feature: institute-outreach, Property 2: the lead validator accepts a lead if
// and only if it has all required fields (id, name, category, city, weakness,
// suggestedProof, contactAngle), name length 1–200, city is one of the four City
// values, and category is one of the closed InstituteCategory set — regardless of
// which optional contact fields are present or absent.
// Validates: Requirements 3.1, 3.3, 3.7
import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { validateLead, CITY_ORDER, INSTITUTE_CATEGORIES } from '../outreach.js';

// A field that may be a non-empty string, an empty string, or absent.
const maybeStringArb = fc.oneof(
  fc.string({ minLength: 1, maxLength: 20 }),
  fc.constant(''),
  fc.constant(undefined)
);

// Name that may be too short, in-range, too long, or absent.
const maybeNameArb = fc.oneof(
  fc.constant(''),
  fc.string({ minLength: 1, maxLength: 200 }),
  fc.string({ minLength: 201, maxLength: 210 }),
  fc.constant(undefined)
);

// City drawn from valid + off-list values.
const maybeCityArb = fc.oneof(
  fc.constantFrom(...CITY_ORDER),
  fc.constantFrom('Delhi', 'Nagpur', '', 'nashik'),
  fc.constant(undefined)
);

// Category drawn from valid + off-list values.
const maybeCategoryArb = fc.oneof(
  fc.constantFrom(...INSTITUTE_CATEGORIES),
  fc.constantFrom('Engineering', 'mba', '', 'unknown'),
  fc.constant(undefined)
);

const optionalContactArb = fc.option(fc.string({ maxLength: 15 }), { nil: undefined });

const possiblyMalformedLeadArb = fc.record({
  id: maybeStringArb,
  name: maybeNameArb,
  category: maybeCategoryArb,
  city: maybeCityArb,
  weakness: maybeStringArb,
  suggestedProof: maybeStringArb,
  contactAngle: maybeStringArb,
  phone: optionalContactArb,
  email: optionalContactArb,
  website: optionalContactArb,
});

function oracleValid(lead) {
  const nonEmpty = (v) => typeof v === 'string' && v.length > 0;
  if (!nonEmpty(lead.id)) return false;
  if (!nonEmpty(lead.weakness)) return false;
  if (!nonEmpty(lead.suggestedProof)) return false;
  if (!nonEmpty(lead.contactAngle)) return false;
  if (typeof lead.name !== 'string' || lead.name.length < 1 || lead.name.length > 200)
    return false;
  if (!CITY_ORDER.includes(lead.city)) return false;
  if (!INSTITUTE_CATEGORIES.includes(lead.category)) return false;
  return true;
}

describe('Property 2: lead validator', () => {
  it('accepts well-formed leads and rejects malformed ones (optional fields never matter)', () => {
    fc.assert(
      fc.property(possiblyMalformedLeadArb, (lead) => {
        expect(validateLead(lead)).toBe(oracleValid(lead));
      }),
      { numRuns: 100 }
    );
  });

  it('validity is independent of optional contact fields', () => {
    fc.assert(
      fc.property(possiblyMalformedLeadArb, (lead) => {
        const withContacts = { ...lead, phone: 'x', email: 'y', website: 'z' };
        const withoutContacts = { ...lead };
        delete withoutContacts.phone;
        delete withoutContacts.email;
        delete withoutContacts.website;
        expect(validateLead(withContacts)).toBe(validateLead(withoutContacts));
      }),
      { numRuns: 100 }
    );
  });
});
