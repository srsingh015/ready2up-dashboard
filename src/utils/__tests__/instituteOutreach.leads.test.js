import { describe, it, expect } from 'vitest';
import { instituteOutreach } from '../../../content-source/instituteOutreach.js';
import {
  validateLead,
  hasUniqueIds,
  INSTITUTE_CATEGORIES,
  CITY_ORDER,
} from '../outreach.js';

// Task 5.2 — validate the seeded real lead data.
describe('instituteOutreach seeded leads', () => {
  const { leads, portfolioProof } = instituteOutreach;
  const proofCategories = new Set(portfolioProof.map((g) => g.category));

  it('has at least one seeded lead', () => {
    expect(Array.isArray(leads)).toBe(true);
    expect(leads.length).toBeGreaterThan(0);
  });

  it('every seeded lead is valid per validateLead', () => {
    for (const lead of leads) {
      expect(validateLead(lead), `invalid lead: ${lead.id ?? lead.name}`).toBe(true);
    }
  });

  it('all lead ids are unique', () => {
    expect(hasUniqueIds(leads)).toBe(true);
  });

  it('every lead category is one of the known categories and has a matching proof group', () => {
    for (const lead of leads) {
      expect(INSTITUTE_CATEGORIES).toContain(lead.category);
      expect(proofCategories.has(lead.category), `no proof for ${lead.category}`).toBe(true);
    }
  });

  it('every lead city is within the known city set', () => {
    for (const lead of leads) {
      expect(CITY_ORDER).toContain(lead.city);
    }
  });

  it('Nashik (priority city) is seeded most thoroughly', () => {
    const counts = { Nashik: 0, Pune: 0, Mumbai: 0, Other: 0 };
    for (const lead of leads) counts[lead.city] += 1;
    expect(counts.Nashik).toBeGreaterThan(0);
    expect(counts.Nashik).toBeGreaterThanOrEqual(counts.Pune);
    expect(counts.Nashik).toBeGreaterThanOrEqual(counts.Mumbai);
  });
});
