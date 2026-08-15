// Data-integrity tests for the Lawns & Banquets seed leads.
//
// These guard the things that silently break the section at runtime: a typo in a
// `category` string (which would drop the lead out of every filter), a city
// outside CITY_ORDER (which would misroute it to 'Other'), or a duplicated id
// (which would make React keys collide and status writes overwrite each other).
import { describe, it, expect } from 'vitest';
import { lawnsOutreach } from '../../../content-source/lawnsOutreach.js';
import {
  validateVenueLead,
  hasUniqueIds,
  groupLeadsByCity,
  VENUE_CATEGORIES,
  VENUE_PRIORITIES,
  CITY_ORDER,
} from '../outreach.js';

describe('Lawns & Banquets seed leads', () => {
  const leads = lawnsOutreach.leads;

  it('ships a non-empty lead set', () => {
    expect(Array.isArray(leads)).toBe(true);
    expect(leads.length).toBeGreaterThan(0);
  });

  it('every lead passes venue validation', () => {
    const invalid = leads.filter((l) => !validateVenueLead(l)).map((l) => l.id ?? l.name);
    expect(invalid).toEqual([]);
  });

  it('every lead id is unique', () => {
    expect(hasUniqueIds(leads)).toBe(true);
  });

  it('every category is in the closed VENUE_CATEGORIES set', () => {
    const bad = leads
      .filter((l) => !VENUE_CATEGORIES.includes(l.category))
      .map((l) => `${l.id}: ${l.category}`);
    expect(bad).toEqual([]);
  });

  it('every city is in CITY_ORDER', () => {
    const bad = leads.filter((l) => !CITY_ORDER.includes(l.city)).map((l) => `${l.id}: ${l.city}`);
    expect(bad).toEqual([]);
  });

  it('any priority present is one of VENUE_PRIORITIES', () => {
    const bad = leads
      .filter((l) => l.priority !== undefined && !VENUE_PRIORITIES.includes(l.priority))
      .map((l) => `${l.id}: ${l.priority}`);
    expect(bad).toEqual([]);
  });

  it('covers all three target cities', () => {
    const cities = groupLeadsByCity(leads).map((g) => g.city);
    expect(cities).toContain('Nashik');
    expect(cities).toContain('Pune');
    expect(cities).toContain('Mumbai');
  });

  it('no lead carries a seeded status or decision (all start clean)', () => {
    const seeded = leads
      .filter((l) => l.status !== undefined || l.decision !== undefined)
      .map((l) => l.id);
    expect(seeded).toEqual([]);
  });

  it('has the offer, pricing tiers, audit checklist and templates the section renders', () => {
    expect(lawnsOutreach.offer?.headline).toBeTruthy();
    expect(lawnsOutreach.pricingTiers).toHaveLength(3);
    expect(lawnsOutreach.pricingTiers.filter((t) => t.recommended)).toHaveLength(1);
    expect(lawnsOutreach.auditChecklist.length).toBeGreaterThan(0);
    expect(lawnsOutreach.templates.length).toBeGreaterThan(0);
    for (const t of lawnsOutreach.templates) {
      expect(t.id).toBeTruthy();
      expect(t.label).toBeTruthy();
      expect(t.body).toBeTruthy();
    }
  });
});
