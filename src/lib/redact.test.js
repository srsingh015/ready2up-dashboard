import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import {
  redactMoney,
  buildOwnerVariant,
  MONEY_FIELD_NAMES,
  MONEY_LABEL_PATTERN,
} from './redact.js';

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

const MONEY_FIELD_SET = new Set(MONEY_FIELD_NAMES);

/**
 * Deep-walk any value and invoke `visit(key, value)` for every object entry.
 * Used by the deep-scan assertions to prove no money survives anywhere.
 */
function walkEntries(node, visit) {
  if (Array.isArray(node)) {
    for (const el of node) walkEntries(el, visit);
    return;
  }
  if (node !== null && typeof node === 'object') {
    for (const [k, v] of Object.entries(node)) {
      visit(k, v);
      walkEntries(v, visit);
    }
  }
}

/** Collect every money violation found anywhere in the redacted output. */
function findMoneyViolations(node) {
  const violations = [];
  walkEntries(node, (key, value) => {
    if (MONEY_FIELD_SET.has(key)) {
      violations.push(`money field "${key}" present`);
    }
    if (key === 'kpis' && Array.isArray(value)) {
      for (const entry of value) {
        if (entry && typeof entry === 'object' && typeof entry.label === 'string') {
          if (MONEY_LABEL_PATTERN.test(entry.label)) {
            violations.push(`money KPI label "${entry.label}" present`);
          }
        } else {
          // An unclassifiable KPI entry that survived is itself a violation.
          violations.push('unclassifiable KPI entry survived');
        }
      }
    }
  });
  return violations;
}

// ---------------------------------------------------------------------------
// fast-check generators for roadmap/months-like structures
// ---------------------------------------------------------------------------

// Money label fragments guaranteed to match MONEY_LABEL_PATTERN.
const moneyLabel = fc
  .constantFrom(
    'Monthly revenue',
    'International revenue',
    'Avg deal size',
    'Cash runway',
    'MRR growth',
    'Profit margin',
    'Team size',
    'ARR target',
  )
  .map((s) => s);

// Non-money KPI labels that must NOT match the money pattern.
const nonMoneyLabel = fc
  .constantFrom(
    'Outreach sent',
    'Replies',
    'Portfolio projects polished',
    'Profiles live',
    'Discovery calls',
    'Closed clients',
    'Care plans active',
    'YouTube live',
    'Newsletter subs',
  )
  .filter((s) => !MONEY_LABEL_PATTERN.test(s));

const moneyKpi = fc.record({
  label: moneyLabel,
  target: fc.integer({ min: 0, max: 10_000_000 }),
});

const nonMoneyKpi = fc.record({
  label: nonMoneyLabel,
  target: fc.integer({ min: 0, max: 500 }),
});

// A range object like { from, to } used for revenueTarget/revenueTargetInr.
const range = fc.record({
  from: fc.integer({ min: 0, max: 1_000_000 }),
  to: fc.integer({ min: 0, max: 5_000_000 }),
});

// A roadmap-phase-like object mixing money and non-money content.
const phaseArb = fc.record(
  {
    id: fc.string({ minLength: 1, maxLength: 6 }),
    title: fc.string({ minLength: 1, maxLength: 20 }),
    period: fc.string({ minLength: 1, maxLength: 10 }),
    focus: fc.string({ minLength: 1, maxLength: 40 }),
    months: fc.array(fc.integer({ min: 1, max: 24 }), { minLength: 1, maxLength: 6 }),
    keyOutcomes: fc.array(fc.string({ maxLength: 30 }), { maxLength: 4 }),
    gateToAdvance: fc.array(fc.string({ maxLength: 30 }), { maxLength: 4 }),
    // Money fields (must be stripped):
    revenueTarget: range,
    teamSize: fc.constantFrom('1 (you)', '1 → 2', '2 → 4', '4 → 6'),
  },
  { requiredKeys: ['id', 'title', 'focus', 'revenueTarget', 'teamSize'] },
);

// A monthly-plan-like object mixing money and non-money content, incl. KPIs.
const monthArb = fc.record(
  {
    n: fc.integer({ min: 1, max: 24 }),
    title: fc.string({ minLength: 1, maxLength: 20 }),
    theme: fc.string({ minLength: 1, maxLength: 40 }),
    topOutcomes: fc.array(fc.string({ maxLength: 30 }), { maxLength: 4 }),
    weeks: fc.array(
      fc.record({
        week: fc.integer({ min: 1, max: 4 }),
        focus: fc.string({ maxLength: 20 }),
        actions: fc.array(fc.string({ maxLength: 30 }), { maxLength: 4 }),
      }),
      { maxLength: 4 },
    ),
    risks: fc.array(fc.string({ maxLength: 30 }), { maxLength: 3 }),
    decisionsToMake: fc.array(fc.string({ maxLength: 30 }), { maxLength: 3 }),
    // KPI mix: some money, some non-money.
    kpis: fc.array(fc.oneof(moneyKpi, nonMoneyKpi), { maxLength: 6 }),
    // Money fields (must be stripped):
    revenueTargetInr: range,
    mrrTargetInr: fc.integer({ min: 0, max: 1_000_000 }),
  },
  { requiredKeys: ['n', 'title', 'theme', 'kpis', 'revenueTargetInr', 'mrrTargetInr'] },
);

const roadmapArb = fc.array(phaseArb, { minLength: 1, maxLength: 5 });
const monthsArb = fc.array(monthArb, { minLength: 1, maxLength: 6 });

// ---------------------------------------------------------------------------
// Property 4: redaction removes every money figure while retaining other content
// ---------------------------------------------------------------------------

describe('redactMoney — money removal', () => {
  // Feature: server-side-access-control, Property 4: Employee redaction removes
  // every money figure while retaining other content.
  // Validates: Requirements 7.1, 7.2, 7.3, 7.5
  it('removes every money figure at any nesting depth for roadmap and months', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.record({ key: fc.constant('roadmap'), section: roadmapArb }),
          fc.record({ key: fc.constant('months'), section: monthsArb }),
        ),
        ({ key, section }) => {
          const redacted = redactMoney(section, key);
          const violations = findMoneyViolations(redacted);
          expect(violations).toEqual([]);
        },
      ),
      { numRuns: 200 },
    );
  });

  // Feature: server-side-access-control, Property 4: Employee redaction removes
  // every money figure while retaining other content.
  // Validates: Requirements 7.1, 7.2, 7.3, 7.5
  it('preserves non-money content (titles, focus, outcomes, non-money KPIs)', () => {
    fc.assert(
      fc.property(monthsArb, (months) => {
        const redacted = redactMoney(months, 'months');
        expect(redacted).toHaveLength(months.length);
        redacted.forEach((m, i) => {
          const src = months[i];
          // Non-money scalar/array fields are retained unchanged.
          expect(m.title).toBe(src.title);
          expect(m.theme).toBe(src.theme);
          expect(m.n).toBe(src.n);
          expect(m.topOutcomes).toEqual(src.topOutcomes);
          expect(m.risks).toEqual(src.risks);
          expect(m.decisionsToMake).toEqual(src.decisionsToMake);
          // Weekly actions preserved (incl. the numeric `week` index).
          expect(m.weeks).toEqual(src.weeks);
          // Exactly the non-money KPIs survive, in order.
          const expectedKpis = src.kpis.filter((k) => !MONEY_LABEL_PATTERN.test(k.label));
          expect(m.kpis).toEqual(expectedKpis);
        });
      }),
      { numRuns: 200 },
    );
  });

  // Feature: server-side-access-control, Property 4: Employee redaction removes
  // every money figure while retaining other content.
  // Validates: Requirements 7.1, 7.2, 7.3, 7.5
  it('preserves roadmap non-money content while stripping revenueTarget/teamSize', () => {
    fc.assert(
      fc.property(roadmapArb, (roadmap) => {
        const redacted = redactMoney(roadmap, 'roadmap');
        expect(redacted).toHaveLength(roadmap.length);
        redacted.forEach((p, i) => {
          const src = roadmap[i];
          expect(p.id).toBe(src.id);
          expect(p.title).toBe(src.title);
          expect(p.focus).toBe(src.focus);
          expect(p.months).toEqual(src.months);
          expect(p.keyOutcomes).toEqual(src.keyOutcomes);
          expect(p.gateToAdvance).toEqual(src.gateToAdvance);
          expect('revenueTarget' in p).toBe(false);
          expect('teamSize' in p).toBe(false);
        });
      }),
      { numRuns: 200 },
    );
  });
});

// ---------------------------------------------------------------------------
// Property 5: owner variant is the unredacted source
// ---------------------------------------------------------------------------

describe('buildOwnerVariant — owner fidelity', () => {
  // A recursive arbitrary for arbitrary JSON-like section structures.
  const jsonLike = fc.letrec((tie) => ({
    node: fc.oneof(
      { depthSize: 'small' },
      fc.integer(),
      fc.double({ noNaN: true }),
      fc.string(),
      fc.boolean(),
      fc.constant(null),
      fc.array(tie('node'), { maxLength: 5 }),
      fc.dictionary(fc.string({ minLength: 1, maxLength: 8 }), tie('node'), { maxKeys: 5 }),
    ),
  })).node;

  // Feature: server-side-access-control, Property 5: The owner variant is the
  // unredacted source.
  // Validates: Requirements 7.4, 8.4
  it('produces data deep-equal to the source for arbitrary structures', () => {
    fc.assert(
      fc.property(jsonLike, (section) => {
        expect(buildOwnerVariant(section)).toEqual(section);
      }),
      { numRuns: 200 },
    );
  });

  // Feature: server-side-access-control, Property 5: The owner variant is the
  // unredacted source.
  // Validates: Requirements 7.4, 8.4
  it('retains every money figure for realistic roadmap/months structures', () => {
    fc.assert(
      fc.property(fc.oneof(roadmapArb, monthsArb), (section) => {
        const owner = buildOwnerVariant(section);
        expect(owner).toEqual(section);
      }),
      { numRuns: 200 },
    );
  });

  // Feature: server-side-access-control, Property 5: The owner variant is the
  // unredacted source.
  // Validates: Requirements 7.4, 8.4
  it('does not mutate the source section (returns an independent deep copy)', () => {
    fc.assert(
      fc.property(monthsArb, (months) => {
        const before = JSON.stringify(months);
        const owner = buildOwnerVariant(months);
        owner[0].title = '__mutated__';
        // Source is untouched.
        expect(JSON.stringify(months)).toBe(before);
      }),
      { numRuns: 100 },
    );
  });
});

// ---------------------------------------------------------------------------
// Task 2.4: unit tests for edge cases
// ---------------------------------------------------------------------------

describe('redactMoney — edge cases', () => {
  it('returns an empty array unchanged for an empty roadmap/months section', () => {
    expect(redactMoney([], 'roadmap')).toEqual([]);
    expect(redactMoney([], 'months')).toEqual([]);
  });

  it('returns an empty object unchanged for an empty object section', () => {
    expect(redactMoney({}, 'roadmap')).toEqual({});
  });

  it('strips a section that contains only money fields, leaving an empty shell', () => {
    const section = [
      { revenueTarget: { from: 0, to: 100 }, teamSize: '1 (you)' },
    ];
    expect(redactMoney(section, 'roadmap')).toEqual([{}]);
  });

  it('strips revenueTargetInr and mrrTargetInr from months entries', () => {
    const section = [{ n: 1, revenueTargetInr: { from: 0, to: 100 }, mrrTargetInr: 5000 }];
    expect(redactMoney(section, 'months')).toEqual([{ n: 1 }]);
  });

  it('drops an unclassifiable numeric field (fail-closed, Req 7.5)', () => {
    const section = [{ title: 'keep', n: 3, mysteryNumber: 42 }];
    const out = redactMoney(section, 'months');
    expect(out).toEqual([{ title: 'keep', n: 3 }]);
    expect('mysteryNumber' in out[0]).toBe(false);
  });

  it('keeps recognized non-money numeric fields (week, n, target)', () => {
    const section = [
      {
        n: 2,
        weeks: [{ week: 1, actions: ['a'] }],
        kpis: [{ label: 'Replies', target: 5 }],
      },
    ];
    expect(redactMoney(section, 'months')).toEqual([
      {
        n: 2,
        weeks: [{ week: 1, actions: ['a'] }],
        kpis: [{ label: 'Replies', target: 5 }],
      },
    ]);
  });

  it('filters money-labeled KPIs from nested KPI arrays but keeps non-money KPIs', () => {
    const section = [
      {
        n: 5,
        kpis: [
          { label: 'Monthly revenue', target: 250000 },
          { label: 'Care plans active', target: 5 },
          { label: 'Avg deal size', target: 60000 },
          { label: 'Discovery calls', target: 6 },
        ],
      },
    ];
    expect(redactMoney(section, 'months')).toEqual([
      {
        n: 5,
        kpis: [
          { label: 'Care plans active', target: 5 },
          { label: 'Discovery calls', target: 6 },
        ],
      },
    ]);
  });

  it('drops unclassifiable KPI entries lacking a string label (fail-closed)', () => {
    const section = [{ n: 1, kpis: [{ target: 10 }, { label: 42, target: 5 }, { label: 'Replies', target: 3 }] }];
    expect(redactMoney(section, 'months')).toEqual([
      { n: 1, kpis: [{ label: 'Replies', target: 3 }] },
    ]);
  });

  it('handles deeply nested money fields at any depth', () => {
    const section = [
      {
        n: 1,
        nested: { deeper: { revenueTargetInr: { from: 1, to: 2 }, keep: 'yes' } },
      },
    ];
    expect(redactMoney(section, 'months')).toEqual([
      { n: 1, nested: { deeper: { keep: 'yes' } } },
    ]);
  });

  it('returns other section keys unchanged (deep copy, no redaction)', () => {
    const section = { revenueTarget: { from: 0, to: 1 }, teamSize: '1' };
    const out = redactMoney(section, 'principles');
    expect(out).toEqual(section);
    // But it is an independent copy.
    expect(out).not.toBe(section);
  });
});
