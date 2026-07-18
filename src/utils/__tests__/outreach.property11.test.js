// Feature: institute-outreach, Property 11: the closed-won conversion figure
// from computePipeline is an integer in [0,100], equals round(closedWon/total×100),
// and equals 0 when the total lead count is 0.
// Validates: Requirements 9.6
import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import {
  computePipeline,
  resolveStatus,
  CLOSED_WON,
  CITY_ORDER,
} from '../outreach.js';
import { leadsArb, persistedValueArb, resolveAll } from './outreach.arbitraries.js';

const cityScopeArb = fc.constantFrom('all', ...CITY_ORDER);

describe('Property 11: conversion percentage bounds', () => {
  it('is an integer 0–100 equal to rounded closed-won share, 0 when empty', () => {
    fc.assert(
      fc.property(
        leadsArb,
        fc.dictionary(fc.string(), persistedValueArb),
        cityScopeArb,
        (rawLeads, store, cityScope) => {
          const leads = resolveAll(rawLeads, store, resolveStatus);
          const { counts, total, conversionPct } = computePipeline(leads, cityScope);

          expect(Number.isInteger(conversionPct)).toBe(true);
          expect(conversionPct).toBeGreaterThanOrEqual(0);
          expect(conversionPct).toBeLessThanOrEqual(100);

          if (total === 0) {
            expect(conversionPct).toBe(0);
          } else {
            expect(conversionPct).toBe(Math.round((counts[CLOSED_WON] / total) * 100));
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
