// Unit + property tests for the Ready2UP Accept/Reject decision axis.
// Covers resolveDecision precedence, applyDecisionFilter subset behaviour, and
// computeDecisionSummary totals. The decision axis is independent of the
// outreach pipeline status.
import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import {
  OUTREACH_DECISIONS,
  resolveDecision,
  applyDecisionFilter,
  computeDecisionSummary,
} from '../outreach.js';

describe('OUTREACH_DECISIONS', () => {
  it('is exactly the four triage decisions in order', () => {
    expect(OUTREACH_DECISIONS).toEqual(['Undecided', 'Accepted', 'In progress', 'Rejected']);
  });
});

describe('resolveDecision — precedence', () => {
  const lead = { id: 'a', decision: 'Accepted' };

  it('prefers a valid persisted override', () => {
    expect(resolveDecision(lead, { a: 'Rejected' })).toBe('Rejected');
  });

  it('falls back to the seed decision when no valid override exists', () => {
    expect(resolveDecision(lead, {})).toBe('Accepted');
    expect(resolveDecision(lead, { a: 'nonsense' })).toBe('Accepted');
  });

  it('defaults to Undecided when neither is valid', () => {
    expect(resolveDecision({ id: 'b' }, {})).toBe('Undecided');
    expect(resolveDecision({ id: 'b', decision: 'bogus' }, undefined)).toBe('Undecided');
  });
});

describe('applyDecisionFilter', () => {
  const leads = [
    { id: 'a', decision: 'Accepted' },
    { id: 'b', decision: 'Rejected' },
    { id: 'c', decision: 'Undecided' },
    { id: 'd' }, // no decision → treated as Undecided
  ];

  it('returns the full list unchanged for "all"', () => {
    expect(applyDecisionFilter(leads, 'all')).toEqual(leads);
  });

  it('keeps only leads matching the requested decision', () => {
    expect(applyDecisionFilter(leads, 'Accepted').map((l) => l.id)).toEqual(['a']);
    expect(applyDecisionFilter(leads, 'Rejected').map((l) => l.id)).toEqual(['b']);
    // 'd' has no decision and is treated as Undecided.
    expect(applyDecisionFilter(leads, 'Undecided').map((l) => l.id)).toEqual(['c', 'd']);
  });

  it('always returns a subset of the input (property)', () => {
    const decisionArb = fc.constantFrom('all', ...OUTREACH_DECISIONS);
    const leadArb = fc.record({
      id: fc.string(),
      decision: fc.option(fc.constantFrom(...OUTREACH_DECISIONS), { nil: undefined }),
    });
    fc.assert(
      fc.property(fc.array(leadArb), decisionArb, (arr, filter) => {
        const out = applyDecisionFilter(arr, filter);
        expect(out.length).toBeLessThanOrEqual(arr.length);
        for (const lead of out) expect(arr).toContain(lead);
      })
    );
  });
});

describe('computeDecisionSummary', () => {
  it('counts every decision (incl. zeroes) and totals them', () => {
    const leads = [
      { id: 'a', decision: 'Accepted', city: 'Mumbai' },
      { id: 'b', decision: 'Accepted', city: 'Nashik' },
      { id: 'c', decision: 'Rejected', city: 'Mumbai' },
      { id: 'd', city: 'Pune' }, // Undecided
    ];
    const { counts, total } = computeDecisionSummary(leads, 'all');
    expect(counts).toEqual({ Undecided: 1, Accepted: 2, 'In progress': 0, Rejected: 1 });
    expect(total).toBe(4);
  });

  it('scopes counts to a single city bucket', () => {
    const leads = [
      { id: 'a', decision: 'Accepted', city: 'Mumbai' },
      { id: 'b', decision: 'Accepted', city: 'Nashik' },
      { id: 'c', decision: 'Rejected', city: 'Mumbai' },
    ];
    const { counts, total } = computeDecisionSummary(leads, 'Mumbai');
    expect(counts.Accepted).toBe(1);
    expect(counts.Rejected).toBe(1);
    expect(total).toBe(2);
  });

  it('sum of counts always equals total (property)', () => {
    const leadArb = fc.record({
      id: fc.string(),
      city: fc.constantFrom('Nashik', 'Pune', 'Mumbai', 'Solapur', 'Other'),
      decision: fc.option(fc.constantFrom(...OUTREACH_DECISIONS), { nil: undefined }),
    });
    fc.assert(
      fc.property(fc.array(leadArb), (arr) => {
        const { counts, total } = computeDecisionSummary(arr, 'all');
        const sum = OUTREACH_DECISIONS.reduce((acc, d) => acc + counts[d], 0);
        expect(sum).toBe(total);
      })
    );
  });
});
