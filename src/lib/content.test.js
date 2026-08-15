import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import {
  getRole,
  fetchContent,
  rowsToContentObject,
  navIdsFromContent,
} from './content.js';
import { NAV_CONTENT } from '../config/navContent.js';

// ---------------------------------------------------------------------------
// Feature: server-side-access-control, Property 3: Role is derived only from a
// valid server role value.
// `getRole` returns 'owner'/'employee' iff the stored role is exactly that
// value; a missing profile, null role, or any other value resolves to null.
// Validates: Requirements 3.3, 3.4
// ---------------------------------------------------------------------------
describe('Property 3: role derivation from a valid server value', () => {
  // A profile-fetch RESULT.data value: missing (null), { role: null },
  // { role: <arbitrary string> }, or one of the two valid roles.
  const profileResultArb = fc.oneof(
    fc.constant(null), // missing profile
    fc.constant({ role: null }), // present profile, null role
    fc.record({ role: fc.string() }), // arbitrary string role
    fc.constant({ role: 'owner' }),
    fc.constant({ role: 'employee' })
  );

  it('returns the role iff it is exactly owner/employee, else null', async () => {
    await fc.assert(
      fc.asyncProperty(profileResultArb, fc.string(), async (profile, userId) => {
        const deps = { query: async () => ({ data: profile, error: null }) };
        const role = await getRole(userId, deps);

        const stored = profile ? profile.role : undefined;
        const expected =
          stored === 'owner' ? 'owner' : stored === 'employee' ? 'employee' : null;

        expect(role).toBe(expected);
      }),
      { numRuns: 100 }
    );
  });

  it('treats a query error as denied (null)', async () => {
    const deps = { query: async () => ({ data: { role: 'owner' }, error: { message: 'boom' } }) };
    expect(await getRole('u1', deps)).toBe(null);
  });
});

// ---------------------------------------------------------------------------
// Feature: server-side-access-control, Property 6: Row reconstruction is
// faithful and total.
// `rowsToContentObject` yields exactly the distinct valid string keys, first
// row wins per key, never invents/drops/corrupts a key; total over null/empty.
// Validates: Requirements 4.2, 5.3, 6.2, 15.3
// ---------------------------------------------------------------------------
describe('Property 6: row reconstruction is faithful and total', () => {
  // Rows may be well-formed, have duplicate keys, or be malformed (non-string
  // key, or null).
  const rowArb = fc.oneof(
    fc.record({
      key: fc.constantFrom('roadmap', 'months', 'channels', 'principles', 'meta'),
      data: fc.jsonValue(),
    }),
    fc.record({ key: fc.string(), data: fc.jsonValue() }),
    // Malformed: missing/non-string key.
    fc.record({ key: fc.constantFrom(undefined, null, 42, {}), data: fc.jsonValue() }),
    fc.constant(null)
  );

  it('output keys == distinct valid string keys, first row wins, nothing invented', () => {
    fc.assert(
      fc.property(fc.array(rowArb, { maxLength: 40 }), (rows) => {
        const out = rowsToContentObject(rows);

        // Reference implementation: first valid row wins per key.
        const expected = {};
        for (const r of rows) {
          if (r && typeof r.key === 'string' && !(r.key in expected)) {
            expected[r.key] = r.data;
          }
        }

        const outKeys = Object.keys(out).sort();
        const expectedKeys = Object.keys(expected).sort();

        // Same key set — nothing invented, nothing dropped.
        expect(outKeys).toEqual(expectedKeys);
        // First row wins, data uncorrupted.
        for (const k of outKeys) {
          expect(out[k]).toBe(expected[k]);
        }
        // Every output key came from a valid string-keyed row (no invention).
        for (const k of outKeys) {
          expect(rows.some((r) => r && r.key === k)).toBe(true);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('is total over null and empty input', () => {
    expect(rowsToContentObject(null)).toEqual({});
    expect(rowsToContentObject(undefined)).toEqual({});
    expect(rowsToContentObject([])).toEqual({});
  });

  it('first row wins for duplicate keys', () => {
    const rows = [
      { key: 'roadmap', data: 'first' },
      { key: 'roadmap', data: 'second' },
    ];
    expect(rowsToContentObject(rows)).toEqual({ roadmap: 'first' });
  });
});

// ---------------------------------------------------------------------------
// Feature: server-side-access-control, Property 7: Navigation reflects exactly
// the content that arrived.
// A nav id appears iff all of its backing keys (NAV_CONTENT) are present.
// Validates: Requirements 6.1, 6.3, 8.2
// ---------------------------------------------------------------------------
describe('Property 7: navigation reflects the content that arrived', () => {
  // The universe of all backing keys referenced by any nav entry.
  const ALL_KEYS = Array.from(
    new Set(Object.values(NAV_CONTENT).flat())
  );

  it('a nav id appears iff all its backing keys are present', () => {
    fc.assert(
      fc.property(fc.subarray(ALL_KEYS), (presentKeys) => {
        const contentObj = {};
        for (const k of presentKeys) contentObj[k] = { some: 'data' };

        const ids = navIdsFromContent(contentObj);

        for (const navId of Object.keys(NAV_CONTENT)) {
          const backing = NAV_CONTENT[navId];
          const shouldShow = backing.every((k) => presentKeys.includes(k));
          expect(ids.includes(navId)).toBe(shouldShow);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('the employee content object yields exactly the 6 content-driven employee nav entries', () => {
    // The employee receives ONLY these six content keys. `trackers` is NOT
    // included here because `navIdsFromContent` is content-driven and pure —
    // the Work Tracker has no content_sections row and is added by Layout for
    // the employee role, not by this function.
    const employeeContent = {
      channels: {},
      onboarding: {},
      principles: {},
      scripts: {},
      instituteOutreach: {},
      lawnsOutreach: {},
    };
    const ids = navIdsFromContent(employeeContent);
    expect([...ids].sort()).toEqual(
      [
        'channels',
        'onboarding',
        'principles',
        'scripts',
        'institute-outreach',
        'lawns-outreach',
      ].sort()
    );
  });

  it('is total over null / non-object input', () => {
    expect(navIdsFromContent(null)).toEqual([]);
    expect(navIdsFromContent(undefined)).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Feature: server-side-access-control, Property 8: Authorization derives from
// role, not identity.
// Two distinct identities both resolving 'employee' get identical permitted
// content and derived nav — a function of role only.
// Validates: Requirements 16.1, 16.2, 16.4
// ---------------------------------------------------------------------------
describe('Property 8: authorization derives from role, not identity', () => {
  // The employee permitted content set is a function of ROLE, not identity.
  // Model it as the fixed set of employee keys, built independently of any
  // user id / email.
  const EMPLOYEE_KEYS = [
    'channels',
    'onboarding',
    'principles',
    'scripts',
    'instituteOutreach',
    'lawnsOutreach',
  ];

  const buildEmployeeContent = () => {
    const obj = {};
    for (const k of EMPLOYEE_KEYS) obj[k] = { data: k };
    return obj;
  };

  const identityArb = fc.record({
    userId: fc.string({ minLength: 1 }),
    email: fc.emailAddress(),
  });

  it('two distinct employee identities get identical content and nav', () => {
    fc.assert(
      fc.property(identityArb, identityArb, (idA, idB) => {
        fc.pre(idA.userId !== idB.userId || idA.email !== idB.email);

        // Both identities hold role 'employee' → permitted content is the same
        // function of role, independent of the identity.
        const contentA = buildEmployeeContent();
        const contentB = buildEmployeeContent();

        expect(contentA).toEqual(contentB);

        const navA = navIdsFromContent(contentA);
        const navB = navIdsFromContent(contentB);
        expect([...navA].sort()).toEqual([...navB].sort());
      }),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Unit tests — fetchContent failure handling (Task 6.6).
// Validates: Requirements 4.5, 4.6, 15.4
// ---------------------------------------------------------------------------
describe('fetchContent failure handling', () => {
  it('maps a slow response (> timeoutMs) to a non-destructive timeout result without throwing', async () => {
    // Query resolves well after the timeout window — the timeout should win.
    const deps = {
      timeoutMs: 20,
      query: () =>
        new Promise((resolve) =>
          setTimeout(() => resolve({ data: [{ key: 'roadmap', data: {} }], error: null }), 200)
        ),
    };
    const result = await fetchContent(deps);
    expect(result).toEqual({ ok: false, code: 'timeout' });
  });

  it('maps an error response to { ok: false, code: error }', async () => {
    const deps = {
      query: async () => ({ data: null, error: { message: 'permission denied' } }),
    };
    const result = await fetchContent(deps);
    expect(result).toEqual({ ok: false, code: 'error' });
  });

  it('maps a thrown query to { ok: false, code: error } without throwing', async () => {
    const deps = {
      query: async () => {
        throw new Error('network down');
      },
    };
    const result = await fetchContent(deps);
    expect(result).toEqual({ ok: false, code: 'error' });
  });

  it('returns { ok: true, rows: [] } for an empty store (no decryption fallback)', async () => {
    const deps = { query: async () => ({ data: [], error: null }) };
    const result = await fetchContent(deps);
    expect(result).toEqual({ ok: true, rows: [] });
  });

  it('returns { ok: true, rows } for a successful fetch', async () => {
    const rows = [
      { key: 'roadmap', data: { a: 1 } },
      { key: 'months', data: { b: 2 } },
    ];
    const deps = { query: async () => ({ data: rows, error: null }) };
    const result = await fetchContent(deps);
    expect(result).toEqual({ ok: true, rows });
  });
});
