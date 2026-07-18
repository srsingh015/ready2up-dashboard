import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { signInResolvingRole } from './auth.js';

// ---------------------------------------------------------------------------
// Test helpers — a fake signIn that records every call it receives so tests can
// assert ordering, first-match stop, byte-faithful password forwarding, and the
// exact number of network attempts. No mocking of the module under test.
// ---------------------------------------------------------------------------

/**
 * Build a fake `signIn` dep.
 *
 * @param {object} opts
 *   - winner   {string|null} the email that "matches" (returns a session)
 *   - roleFor  (email) => 'owner'|'employee'|null  role resolved on success
 *   - behavior 'invalid' | 'ratelimited' | 'never'  for non-winner emails
 */
function makeFakeSignIn({ winner = null, behavior = 'invalid' } = {}) {
  const calls = [];
  const signIn = ({ email, password }) => {
    calls.push({ email, password });
    if (winner !== null && email === winner) {
      return Promise.resolve({
        data: {
          session: { access_token: 't', user: { id: `id-${email}` } },
          user: { id: `id-${email}` },
        },
        error: null,
      });
    }
    if (behavior === 'never') {
      // Never resolves — exercises the timeout path.
      return new Promise(() => {});
    }
    if (behavior === 'ratelimited') {
      return Promise.resolve({
        data: { session: null, user: null },
        error: { status: 429, message: 'Too many requests' },
      });
    }
    // Default: invalid credentials.
    return Promise.resolve({
      data: { session: null, user: null },
      error: { status: 400, message: 'Invalid login credentials' },
    });
  };
  return { signIn, calls };
}

const getRoleForEmail = (email) =>
  async (userId) => (email && userId === `id-${email}` ? 'owner' : 'employee');

// ===========================================================================
// Task 5.2 / Property 1
// Feature: server-side-access-control, Property 1: Login resolution is ordered,
// single, and password-faithful.
// Validates: Requirements 1.3, 1.6, 1.7, 1.9, 2.1
// ===========================================================================

describe('signInResolvingRole — ordered single-match resolution (Property 1)', () => {
  // A non-empty, non-whitespace password generator.
  const nonEmptyPassword = fc
    .string({ minLength: 1, maxLength: 72 })
    .filter((s) => s.trim().length > 0);

  // A list of distinct emails with an optional designated winner index.
  const scenarioArb = fc
    .array(
      fc.string({ minLength: 1, maxLength: 12 }).map((s) => `${s}@x.test`),
      { minLength: 1, maxLength: 6 },
    )
    .chain((rawEmails) => {
      // De-duplicate while preserving order (fixed evaluation order matters).
      const emails = [...new Set(rawEmails)];
      return fc.record({
        emails: fc.constant(emails),
        // winnerIndex in [-1, emails.length): -1 means "no winner".
        winnerIndex: fc.integer({ min: -1, max: emails.length - 1 }),
      });
    });

  it('stops at the first match, makes no later attempts, forwards the password byte-faithfully, and returns invalid when none match', async () => {
    await fc.assert(
      fc.asyncProperty(nonEmptyPassword, scenarioArb, async (password, { emails, winnerIndex }) => {
        const winner = winnerIndex >= 0 ? emails[winnerIndex] : null;
        const { signIn, calls } = makeFakeSignIn({ winner, behavior: 'invalid' });

        const result = await signInResolvingRole(password, {
          emails,
          signIn,
          getRole: getRoleForEmail(winner),
          timeoutMs: 10000,
        });

        if (winner === null) {
          // No email matches -> invalid, no session, every email attempted in order.
          expect(result).toEqual({ ok: false, code: 'invalid' });
          expect(calls.map((c) => c.email)).toEqual(emails);
        } else {
          // First match wins -> exactly one session, stop after the winner.
          expect(result.ok).toBe(true);
          expect(result.session).toBeTruthy();
          expect(['owner', 'employee']).toContain(result.role);
          // Attempts happen in order and STOP at the winner (no later emails).
          const attemptedEmails = calls.map((c) => c.email);
          const expectedAttempts = emails.slice(0, winnerIndex + 1);
          expect(attemptedEmails).toEqual(expectedAttempts);
          // No attempts after the match.
          expect(attemptedEmails[attemptedEmails.length - 1]).toBe(winner);
        }
        // Byte-faithful password forwarding on EVERY attempt (unchanged).
        for (const c of calls) {
          expect(c.password).toBe(password);
        }
      }),
      { numRuns: 200 },
    );
  });
});

// ===========================================================================
// Task 5.3 / Property 2
// Feature: server-side-access-control, Property 2: Empty or whitespace-only
// passwords never reach the network.
// Validates: Requirements 1.8, 2.2
// ===========================================================================

describe('signInResolvingRole — blank passwords never hit the network (Property 2)', () => {
  // Whitespace characters incl. Unicode spaces; assemble whitespace-only strings.
  const whitespaceChar = fc.constantFrom(
    ' ', '\t', '\n', '\r', '\f', '\v', '\u00a0', '\u2003', '\u2009', '\u3000',
  );
  const blankString = fc.oneof(
    fc.constant(''),
    fc.array(whitespaceChar, { minLength: 1, maxLength: 20 }).map((cs) => cs.join('')),
  );

  it('returns code:empty, no session, and zero auth calls for empty/whitespace passwords', async () => {
    await fc.assert(
      fc.asyncProperty(blankString, async (password) => {
        const { signIn, calls } = makeFakeSignIn({ winner: 'owner@x.test' });
        const result = await signInResolvingRole(password, {
          emails: ['owner@x.test', 'emp@x.test'],
          signIn,
          getRole: getRoleForEmail('owner@x.test'),
          timeoutMs: 10000,
        });
        expect(result).toEqual({ ok: false, code: 'empty' });
        expect(result.session).toBeUndefined();
        expect(calls).toHaveLength(0); // ZERO network calls
      }),
      { numRuns: 200 },
    );
  });
});

// ===========================================================================
// Task 5.4 — unit tests for login error mapping
// ===========================================================================

describe('signInResolvingRole — error mapping (unit)', () => {
  const emails = ['owner@x.test', 'emp@x.test'];

  it('maps a never-resolving auth call to code:timeout via the injected timeout (Req 1.10 / 2.7)', async () => {
    const { signIn, calls } = makeFakeSignIn({ winner: null, behavior: 'never' });
    const result = await signInResolvingRole('secretpw', {
      emails,
      signIn,
      getRole: async () => 'owner',
      timeoutMs: 20, // small injected timeout so the test is fast
    });
    expect(result).toEqual({ ok: false, code: 'timeout' });
    // It timed out on the first email and did not proceed.
    expect(calls).toHaveLength(1);
  });

  it('maps a 429 rate-limit error to code:ratelimited immediately (Req 2.6 / 13.3)', async () => {
    const { signIn, calls } = makeFakeSignIn({ winner: null, behavior: 'ratelimited' });
    const result = await signInResolvingRole('secretpw', {
      emails,
      signIn,
      getRole: async () => 'owner',
      timeoutMs: 10000,
    });
    expect(result).toEqual({ ok: false, code: 'ratelimited' });
    // Stops on the first rate-limited response — does not try the second email.
    expect(calls).toHaveLength(1);
  });

  it('maps all-invalid credential errors to code:invalid after trying every email (Req 1.9 / 2.1)', async () => {
    const { signIn, calls } = makeFakeSignIn({ winner: null, behavior: 'invalid' });
    const result = await signInResolvingRole('secretpw', {
      emails,
      signIn,
      getRole: async () => 'owner',
      timeoutMs: 10000,
    });
    expect(result).toEqual({ ok: false, code: 'invalid' });
    expect(calls.map((c) => c.email)).toEqual(emails);
  });

  it('resolves role and session on the first matching email (happy path)', async () => {
    const { signIn, calls } = makeFakeSignIn({ winner: 'emp@x.test', behavior: 'invalid' });
    const result = await signInResolvingRole('secretpw', {
      emails,
      signIn,
      getRole: async (userId) => (userId === 'id-emp@x.test' ? 'employee' : 'owner'),
      timeoutMs: 10000,
    });
    expect(result.ok).toBe(true);
    expect(result.role).toBe('employee');
    expect(result.session).toBeTruthy();
    // Tried owner (invalid) then employee (match) — exactly 2 attempts.
    expect(calls.map((c) => c.email)).toEqual(emails);
  });
});
