// Feature: institute-outreach, Property 6: writing a valid status to the store
// and reading it back through the resolution path returns the same status, so a
// reload displays the previously persisted value.
// Validates: Requirements 5.3
import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { resolveStatus } from '../outreach.js';
import { leadArb, validStatusArb } from './outreach.arbitraries.js';

describe('Property 6: persistence round-trip', () => {
  it('reads back exactly the valid status written to the store', () => {
    fc.assert(
      fc.property(leadArb, validStatusArb, (lead, status) => {
        // Simulate persisting the status, then reading it back via resolution.
        const store = { [lead.id]: status };
        expect(resolveStatus(lead, store)).toBe(status);
      }),
      { numRuns: 100 }
    );
  });
});
