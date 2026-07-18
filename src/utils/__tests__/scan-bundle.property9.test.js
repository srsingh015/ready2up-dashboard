// Feature: server-side-access-control, Property 9: The bundle scanner detects any secret and passes only when clean
// Validates: Requirements 11.1, 11.5, 11.6, 11.7
//
// scanText is exported from the build-time post-build scanner. The scanner
// guards its runner with an isMain check, so importing it here only pulls in
// the pure scanText helper (no build side effects).
import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { scanText } from '../../../scripts/scan-bundle.mjs';

// Candidate secret values (Supabase account passwords) are non-empty strings.
// We use a small unique set of realistic (short, non-empty) candidates so the
// positive/negative cases stay well-defined. Empty strings are exercised
// separately since scanText must ignore them.
const secretArb = fc.string({ minLength: 3, maxLength: 24 });
const secretsArb = fc.uniqueArray(secretArb, { minLength: 1, maxLength: 5 });

describe('Property 9: bundle scanner detects any secret and passes only when clean', () => {
  it('reports found=true with exact matches when a non-empty secret is embedded verbatim', () => {
    fc.assert(
      fc.property(
        secretsArb,
        fc.string(), // arbitrary text before the secret
        fc.string(), // arbitrary text after the secret
        fc.nat(),    // selects which secret to embed
        (secrets, prefix, suffix, pick) => {
          const target = secrets[pick % secrets.length];
          const bundleText = prefix + target + suffix;

          const { found, matches } = scanText(bundleText, secrets);

          // The scan must flag the leak and list the exact matched secret.
          expect(found).toBe(true);
          expect(matches).toContain(target);
          // Every reported match must genuinely appear in the text.
          for (const m of matches) {
            expect(bundleText.includes(m)).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('reports found=false with no matches when no secret is embedded', () => {
    fc.assert(
      fc.property(secretsArb, fc.string(), (secrets, bundleText) => {
        // Only exercise texts that genuinely contain no secret value.
        fc.pre(!secrets.some((s) => s.length > 0 && bundleText.includes(s)));

        const { found, matches } = scanText(bundleText, secrets);

        expect(found).toBe(false);
        expect(matches).toEqual([]);
      }),
      { numRuns: 100 }
    );
  });

  it('ignores blank/empty candidate secrets even when the text is non-empty', () => {
    fc.assert(
      fc.property(
        fc.array(fc.constantFrom('', ' ', '\t', '\n', '   '), { minLength: 1, maxLength: 5 }),
        fc.string({ minLength: 1 }),
        (blankSecrets, bundleText) => {
          // Empty-string candidates are ignored outright. Whitespace-only
          // candidates are only "blank" for the empty-string case; guard the
          // whitespace ones so we don't accidentally assert a legitimate match.
          const onlyEmpties = blankSecrets.filter((s) => s.length === 0);

          const { found, matches } = scanText(bundleText, onlyEmpties);

          expect(found).toBe(false);
          expect(matches).toEqual([]);
        }
      ),
      { numRuns: 100 }
    );
  });
});
