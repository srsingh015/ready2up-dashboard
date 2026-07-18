// Feature: institute-outreach, Property 4: resolveStatus returns the valid
// persisted override if one exists; otherwise the lead's seed status if
// present; otherwise 'Not contacted'.
// Validates: Requirements 3.2, 5.5
import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { resolveStatus, OUTREACH_STATUSES } from '../outreach.js';
import { leadArb, persistedValueArb } from './outreach.arbitraries.js';

describe('Property 4: status resolution precedence', () => {
  it('prefers valid persisted override, then seed status, then default', () => {
    fc.assert(
      fc.property(
        leadArb,
        fc.option(persistedValueArb, { nil: undefined }),
        (lead, persisted) => {
          const store = persisted === undefined ? {} : { [lead.id]: persisted };
          const result = resolveStatus(lead, store);

          const validPersisted =
            typeof persisted === 'string' && OUTREACH_STATUSES.includes(persisted);
          const validSeed =
            typeof lead.status === 'string' && OUTREACH_STATUSES.includes(lead.status);

          if (validPersisted) {
            expect(result).toBe(persisted);
          } else if (validSeed) {
            expect(result).toBe(lead.status);
          } else {
            expect(result).toBe('Not contacted');
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
