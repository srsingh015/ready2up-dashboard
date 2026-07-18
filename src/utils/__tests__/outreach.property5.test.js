// Feature: institute-outreach, Property 5: resolveStatus output is always one
// of the seven valid statuses, and any persisted value that is not one of the
// seven is ignored in favor of the lead's seed status or the default.
// Validates: Requirements 3.6, 5.7
import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { resolveStatus, OUTREACH_STATUSES } from '../outreach.js';
import { leadArb, persistedValueArb } from './outreach.arbitraries.js';

describe('Property 5: status resolution closure and invalid-value fallback', () => {
  it('always returns a valid status and ignores garbage persisted values', () => {
    fc.assert(
      fc.property(leadArb, persistedValueArb, (lead, persisted) => {
        const store = { [lead.id]: persisted };
        const result = resolveStatus(lead, store);

        // Closure: output is always one of the seven.
        expect(OUTREACH_STATUSES).toContain(result);

        const validPersisted =
          typeof persisted === 'string' && OUTREACH_STATUSES.includes(persisted);
        if (!validPersisted) {
          // Invalid persisted value ignored -> seed status or default.
          const expected =
            typeof lead.status === 'string' && OUTREACH_STATUSES.includes(lead.status)
              ? lead.status
              : 'Not contacted';
          expect(result).toBe(expected);
        }
      }),
      { numRuns: 100 }
    );
  });
});
