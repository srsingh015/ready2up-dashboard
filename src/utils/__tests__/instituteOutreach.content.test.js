// Unit tests for the fixed seed literals in content-source/instituteOutreach.js.
// These assert the exact pricing tiers, add-ons, category→URL portfolio proof
// mapping, and outreach templates required by the design.
// Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 7.2, 8.1, 8.2
import { describe, it, expect } from 'vitest';
import { instituteOutreach } from '../../../content-source/instituteOutreach.js';
import { INSTITUTE_CATEGORIES } from '../outreach.js';

describe('instituteOutreach content — pricing tiers', () => {
  const { pricingTiers } = instituteOutreach;

  it('has exactly three tiers in Starter → Standard → Advanced order', () => {
    expect(pricingTiers).toHaveLength(3);
    expect(pricingTiers.map((t) => t.name)).toEqual([
      'Starter',
      'Standard',
      'Advanced',
    ]);
    expect(pricingTiers.map((t) => t.id)).toEqual([
      'starter',
      'standard',
      'advanced',
    ]);
  });

  it('has the exact price ranges and scopes per tier', () => {
    const [starter, standard, advanced] = pricingTiers;

    expect(starter.priceRange).toBe('₹20,000 – ₹35,000');
    expect(starter.scope).toBe('4 to 6 page small site');

    expect(standard.priceRange).toBe('₹40,000 – ₹75,000');
    expect(standard.scope).toBe('8 to 12 page admissions-focused site');

    expect(advanced.priceRange).toBe('₹90,000 – ₹1,50,000');
    expect(advanced.scope).toBe('near-Navjeevan custom build');
  });

  it('marks only the Standard tier as recommended', () => {
    const recommended = pricingTiers.filter((t) => t.recommended === true);
    expect(recommended).toHaveLength(1);
    expect(recommended[0].name).toBe('Standard');
  });
});

describe('instituteOutreach content — add-ons', () => {
  const { addOns } = instituteOutreach;

  it('includes yearly maintenance, SEO, and admission-season landing pages', () => {
    const names = addOns.map((a) => a.name);
    expect(names).toContain('Yearly maintenance');
    expect(names).toContain('SEO');
    expect(names).toContain('Admission-season landing pages');
  });

  it('gives yearly maintenance the exact price range', () => {
    const maintenance = addOns.find((a) => a.name === 'Yearly maintenance');
    expect(maintenance).toBeDefined();
    expect(maintenance.priceRange).toBe('₹8,000 – ₹15,000 / year');
  });
});

describe('instituteOutreach content — portfolio proof', () => {
  const { portfolioProof } = instituteOutreach;

  const EXPECTED = {
    MBA: ['https://navjeevanmba.com/'],
    'Trust/Foundation': [
      'https://navjeevannashik.org/',
      'https://navjeevanfoundationnashik.org/',
    ],
    'Pharmacy college': ['https://navjeevanpharmacycollege.com/'],
    'Day school': ['https://navjeevandayschoolsinnar.com/'],
    'Science college': [
      'https://navjeevandayschoolsinnar.com/navjeevan-college-of-science/',
    ],
    School: ['https://navjeevanschoolnashik.com/'],
    'Law college': ['https://www.navjeevanlawcollege.com/'],
  };

  it('has exactly one group per institute category', () => {
    const categories = portfolioProof.map((g) => g.category);
    // one group per category, no duplicates
    expect(new Set(categories).size).toBe(categories.length);
    expect(new Set(categories)).toEqual(new Set(INSTITUTE_CATEGORIES));
  });

  it('every category matches a known INSTITUTE_CATEGORIES value', () => {
    for (const group of portfolioProof) {
      expect(INSTITUTE_CATEGORIES).toContain(group.category);
    }
  });

  it('maps each category to the exact Navjeevan URL(s)', () => {
    for (const [category, urls] of Object.entries(EXPECTED)) {
      const group = portfolioProof.find((g) => g.category === category);
      expect(group, `missing proof group for ${category}`).toBeDefined();
      expect(group.urls).toEqual(urls);
    }
  });
});

describe('instituteOutreach content — outreach templates', () => {
  const { outreachTemplates } = instituteOutreach;

  it('includes at least one email and one WhatsApp template', () => {
    const channels = outreachTemplates.map((t) => t.channel);
    expect(channels).toContain('email');
    expect(channels).toContain('WhatsApp');
  });

  it('each template exposes id, channel, label, and body', () => {
    for (const t of outreachTemplates) {
      expect(typeof t.id).toBe('string');
      expect(t.id.length).toBeGreaterThan(0);
      expect(['email', 'WhatsApp']).toContain(t.channel);
      expect(typeof t.label).toBe('string');
      expect(t.label.length).toBeGreaterThan(0);
      expect(typeof t.body).toBe('string');
      expect(t.body.length).toBeGreaterThan(0);
    }
  });

  it('preserves placeholder tokens verbatim in the bodies', () => {
    // At least one email and one WhatsApp body must carry the core tokens.
    const email = outreachTemplates.find((t) => t.channel === 'email');
    const whatsapp = outreachTemplates.find((t) => t.channel === 'WhatsApp');

    for (const t of [email, whatsapp]) {
      expect(t.body).toContain('[Institute Name]');
      expect(t.body).toContain('[Your Name]');
      expect(t.body).toContain('[Matched Navjeevan Link]');
    }
  });
});
