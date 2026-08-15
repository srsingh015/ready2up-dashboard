// Tests for the shared decision→styling helper.
//
// The key property: the helper is TOTAL. A malformed or unknown persisted
// decision must never produce undefined class names (which would render as the
// string "undefined" in a className and break the card), it must fall back to
// the neutral Undecided styling.
import { describe, it, expect } from 'vitest';
import { decisionStyle, decisionCardClass, decisionBarClass } from '../decisionStyle.js';
import { OUTREACH_DECISIONS } from '../outreach.js';

describe('decisionStyle', () => {
  it('returns a complete style bundle for every valid decision', () => {
    for (const decision of OUTREACH_DECISIONS) {
      const style = decisionStyle(decision);
      expect(typeof style.card).toBe('string');
      expect(typeof style.bar).toBe('string');
      expect(typeof style.pill).toBe('string');
    }
  });

  it('gives the three decided states a visible accent bar and Undecided none', () => {
    expect(decisionBarClass('Accepted')).not.toBe('');
    expect(decisionBarClass('In progress')).not.toBe('');
    expect(decisionBarClass('Rejected')).not.toBe('');
    expect(decisionBarClass('Undecided')).toBe('');
  });

  it('uses a distinct colour per decision', () => {
    expect(decisionCardClass('Accepted')).toContain('emerald');
    expect(decisionCardClass('In progress')).toContain('amber');
    expect(decisionCardClass('Rejected')).toContain('rose');
    expect(decisionCardClass('Undecided')).toBe('');
  });

  it('is total: unknown, null and undefined fall back to Undecided', () => {
    for (const bad of [undefined, null, '', 'Nonsense', 42, {}, []]) {
      const style = decisionStyle(bad);
      expect(style).toEqual(decisionStyle('Undecided'));
      expect(typeof style.card).toBe('string');
      expect(typeof style.bar).toBe('string');
    }
  });

  it('never yields the literal string "undefined" in class names', () => {
    for (const bad of [undefined, null, 'Nonsense']) {
      expect(decisionCardClass(bad)).not.toContain('undefined');
      expect(decisionBarClass(bad)).not.toContain('undefined');
    }
  });
});
