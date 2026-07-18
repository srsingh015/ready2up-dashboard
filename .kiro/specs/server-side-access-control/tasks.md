# Implementation Plan: Server-Side Access Control

## Overview

This plan re-architects the Ready2UP Growth Plan dashboard from client-side tiered encryption to
true server-side authentication and authorization on Supabase (Postgres + Auth) and Vercel. Work
proceeds bottom-up: database schema and RLS first (the authorization source of truth), then the
pure seed/redaction logic, then the client data-access layer (auth + content), then the UI
rewrite, then retirement of the old encryption path, and finally build/config hardening and
Supabase integration verification.

Implementation language is **JavaScript** (React + Vite + `.mjs` scripts), matching the existing
codebase and the design. Property-based tests use **fast-check** (already a dev dependency) with
**numRuns >= 100**, each tagged `// Feature: server-side-access-control, Property {N}`.

> **Manual / prerequisite steps are flagged inline.** Tasks that require you to run SQL migrations
> against Supabase, or to supply the service-role key / account passwords, cannot be completed by
> the coding agent alone and are marked **[MANUAL / PREREQUISITE]**. Integration tests are marked
> **[INTEGRATION — requires a Supabase instance]**.

## Tasks

- [ ] 1. Author database schema and RLS migrations **[MANUAL / PREREQUISITE: you must apply these SQL migrations to Supabase — locally via `supabase start` / `supabase db push`, or in the Supabase SQL editor — the agent only writes the `.sql` files]**
  - [ ] 1.1 Write `profiles` table + `current_role()` helper migration
    - Create `supabase/migrations/0001_profiles.sql`
    - `create table public.profiles (id uuid primary key references auth.users(id) on delete cascade, role text not null check (role in ('owner','employee')), updated_at timestamptz not null default now())`
    - Enable RLS on `profiles`
    - Create `public.current_role()` as `language sql stable security definer set search_path = public` returning `role from public.profiles where id = auth.uid()`
    - _Requirements: 3.1, 3.2, 3.3_

  - [ ] 1.2 Write `content_sections` table + RLS SELECT policies migration
    - Create `supabase/migrations/0002_content_sections.sql`
    - `create table public.content_sections (key text not null, min_role text not null check (min_role in ('owner','employee')), data jsonb not null, updated_at timestamptz not null default now(), primary key (key, min_role))`
    - Enable RLS; add SELECT policy: employee sessions may read rows where `min_role = 'employee'`; owner sessions may read all rows — driven by `public.current_role()`
    - Deny all rows when there is no valid session / no recognized role (no permissive policy for unauthenticated)
    - _Requirements: 4.1, 4.3, 5.1, 5.2, 5.5, 5.6, 3.4, 3.6_

  - [ ] 1.3 Write `user_state` RLS owner-only policies migration
    - Create `supabase/migrations/0003_user_state_rls.sql`
    - `alter table public.user_state enable row level security`
    - Policy `user_state_owner_rw for all using (user_id = auth.uid() and public.current_role() = 'owner') with check (user_id = auth.uid() and public.current_role() = 'owner')`
    - _Requirements: 14.1, 14.4_

  - [ ] 1.4 Write role-assignment seed migration for the two existing users
    - Create `supabase/migrations/0004_assign_roles.sql`
    - Upsert `profiles` rows resolving `auth.users.id` by email: `dragosaurabh@gmail.com` → `owner`, `ready2up.in@gmail.com` → `employee`
    - Use an idempotent `insert ... on conflict (id) do update` keyed off a subselect on `auth.users`
    - _Requirements: 3.2, 3.3, 16.1_

- [ ] 2. Implement money-redaction and owner-variant pure functions
  - [ ] 2.1 Implement `redactMoney` and `buildOwnerVariant` in `src/lib/redact.js`
    - `redactMoney(section, key)`: deep-strip `revenueTarget`, `revenueTargetInr`, `mrrTargetInr`, `teamSize`, and any `kpis[]` entry whose `label` matches a money / MRR / revenue / deal-size / runway pattern, at every nesting depth of roadmap phases and monthly plans
    - Fail-closed: drop any numeric field that cannot be classified as non-money rather than emit it
    - Retain all non-money content (focus, gates, outcomes, weekly actions, risks, decisions, titles, dates) unchanged
    - `buildOwnerVariant(section)`: return data deep-equal to the source section (no removal/masking/omission)
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 8.4_

  - [ ]* 2.2 Write property test for money redaction completeness
    - **Property 4: Employee redaction removes every money figure while retaining other content**
    - **Validates: Requirements 7.1, 7.2, 7.3, 7.5**
    - fast-check, numRuns >= 100; generate roadmap/months structures with money + non-money fields at varied nesting; deep-scan output asserts zero Money_Figure keys and no money-labeled numeric KPI survive; assert non-money fields preserved

  - [ ]* 2.3 Write property test for owner-variant fidelity
    - **Property 5: The owner variant is the unredacted source**
    - **Validates: Requirements 7.4, 8.4**
    - fast-check, numRuns >= 100; assert `buildOwnerVariant(section)` is deep-equal to the source for arbitrary section structures

  - [ ]* 2.4 Write unit tests for redaction edge cases
    - Empty section, section with only money fields, unclassifiable numeric field (asserts dropped), nested KPI arrays
    - _Requirements: 7.5_

- [ ] 3. Implement the content seed script
  - [ ] 3.1 Implement `scripts/seed-content.mjs` **[MANUAL / PREREQUISITE: run locally or in CI with `SUPABASE_SERVICE_ROLE_KEY` set — this key is never a `VITE_` var and is never bundled]**
    - Load `content-source/contents.js`
    - Build owner rows (`min_role='owner'`) via `buildOwnerVariant` for all sections, including `dailyRoutine`, `meta`, `vision`, `streams`, `pricing`, `scripts`, `properties`, `dubai`, `settle`, `partnerships`, `kaira`, `brandPlaybook`, `instituteOutreach`
    - Build employee rows (`min_role='employee'`): redacted `roadmap`/`months` via `redactMoney`, plus employee copies of `weeklyRhythm`, `monthlyRhythm`, `channels`, `onboarding`, `principles`; omit `dailyRoutine` and all owner-only sections
    - Upsert into `content_sections` on conflict `(key, min_role)` using a service-role Supabase client (bypasses RLS); read the service-role key from an env var, never from a `VITE_` var
    - _Requirements: 4.1, 4.3, 6.1, 6.2, 7.1, 7.2, 8.4, 11.4_

- [ ] 4. Add account-email constants to the Supabase client
  - [ ] 4.1 Export `OWNER_EMAIL`, `EMPLOYEE_EMAIL`, `LOGIN_EMAILS` from `src/lib/supabase.js`
    - `OWNER_EMAIL = import.meta.env.VITE_SUPABASE_LOGIN_EMAIL || ''`
    - `EMPLOYEE_EMAIL = import.meta.env.VITE_SUPABASE_EMPLOYEE_EMAIL || ''`
    - `LOGIN_EMAILS = [OWNER_EMAIL, EMPLOYEE_EMAIL].filter(Boolean)` (fixed evaluation order)
    - Leave existing client config (`persistSession`, `autoRefreshToken`, `storageKey: 'r2up_auth'`) unchanged
    - _Requirements: 1.2, 1.6, 9.1_

- [ ] 5. Implement password-only login resolution
  - [ ] 5.1 Implement `signInResolvingRole(password, deps)` in `src/lib/auth.js`
    - Empty / whitespace-only password → return `{ ok:false, code:'empty' }` with **zero** auth calls
    - Send the raw, untrimmed password byte-for-byte (no trim/case/normalize)
    - Iterate `LOGIN_EMAILS` in fixed order; call `signInWithPassword({ email, password })` wrapped in a 10s `Promise.race` timeout; stop at and return the first success, resolving its role, without attempting later emails
    - Map errors: `status === 429` / rate-limit message → `{ code:'ratelimited' }`; timeout / network → `{ code:'timeout' }`; all emails invalid → `{ code:'invalid' }`
    - Accept an injectable `deps` (fake auth + role fetch) so tests run offline
    - _Requirements: 1.3, 1.6, 1.7, 1.8, 1.9, 1.10, 2.1, 2.2, 2.6, 2.7, 13.3_

  - [ ]* 5.2 Write property test for ordered single-match login resolution
    - **Property 1: Login resolution is ordered, single, and password-faithful**
    - **Validates: Requirements 1.3, 1.6, 1.7, 1.9, 2.1**
    - fast-check, numRuns >= 100; generate non-empty passwords + random email lists with at most one designated winner index; assert first-match stop, no later attempts, byte-faithful password forwarding, and `invalid` with no session when none matches

  - [ ]* 5.3 Write property test for empty/whitespace passwords never hitting the network
    - **Property 2: Empty or whitespace-only passwords never reach the network**
    - **Validates: Requirements 1.8, 2.2**
    - fast-check, numRuns >= 100; generate whitespace-only strings (empty, spaces, tabs, newlines, Unicode spaces); assert `code:'empty'`, no session, zero auth calls

  - [ ]* 5.4 Write unit tests for login error mapping
    - 10s timeout path (Req 1.10/2.7), rate-limit mapping from 429 (Req 2.6/13.3), invalid-credential mapping after all emails fail (Req 1.9/2.1)
    - _Requirements: 1.10, 2.6, 2.7, 13.3_

- [ ] 6. Implement the content data-access layer
  - [ ] 6.1 Implement `getRole`, `fetchContent`, `rowsToContentObject`, `navIdsFromContent` in `src/lib/content.js`
    - `getRole(userId)`: return `'owner'`/`'employee'` iff the stored role is exactly that; return `null` for missing profile, null role, or any other value (injectable query dep)
    - `fetchContent()`: `supabase.from('content_sections').select('key, data')` — RLS filters; `min_role` never leaves the DB; map timeout (>10s) / error to a non-destructive failure result that retains prior content
    - `rowsToContentObject(rows)`: PURE — build `{ key: data }`, first row wins per key, never invent/drop/corrupt keys, total over `null`/empty
    - `navIdsFromContent(contentObj)`: PURE — present a nav entry iff all its backing keys (from `src/config/navContent.js`) are present in the object
    - _Requirements: 3.3, 3.4, 4.2, 4.5, 4.6, 5.3, 6.1, 6.2, 6.3, 8.2, 15.3_

  - [ ]* 6.2 Write property test for role derivation
    - **Property 3: Role is derived only from a valid server role value**
    - **Validates: Requirements 3.3, 3.4**
    - fast-check, numRuns >= 100; generate profile-fetch results (missing, null role, arbitrary strings, valid values); assert `getRole` returns the value iff exactly `owner`/`employee`, else `null`

  - [ ]* 6.3 Write property test for row reconstruction
    - **Property 6: Row reconstruction is faithful and total**
    - **Validates: Requirements 4.2, 5.3, 6.2, 15.3**
    - fast-check, numRuns >= 100; generate arbitrary `{ key, data }` row sets; assert output keys == distinct row keys, each maps to its data, no invented/dropped/corrupted key

  - [ ]* 6.4 Write property test for navigation derivation
    - **Property 7: Navigation reflects exactly the content that arrived**
    - **Validates: Requirements 6.1, 6.3, 8.2**
    - fast-check, numRuns >= 100; assert a nav entry appears iff all backing keys present; assert the employee content set yields exactly the 7 employee nav entries and omits all others

  - [ ]* 6.5 Write property test for role-not-identity authorization
    - **Property 8: Authorization derives from role, not identity**
    - **Validates: Requirements 16.1, 16.2, 16.4**
    - fast-check, numRuns >= 100; generate two distinct identities (different ids/emails) both holding `employee`; assert identical permitted content set and derived nav, independent of email/id

  - [ ]* 6.6 Write unit tests for `fetchContent` failure handling
    - Timeout (>10s) and error-response paths return a non-destructive result and retain the session; empty store handled without decryption fallback
    - _Requirements: 4.5, 4.6, 15.4_

- [ ] 7. Extract navigation config as UI-only config
  - [ ] 7.1 Create `src/config/navContent.js`
    - Move the `NAV_CONTENT` map (nav id → backing content keys) out of the retired access layer into this UI-config module
    - Contains no role/security logic — only which nav entries to attempt to show given the data that arrived
    - _Requirements: 5.3, 6.3, 8.2, 15.3_

- [ ] 8. Rewrite the App authentication + content flow
  - [ ] 8.1 Rewrite `src/App.jsx`
    - On mount: `supabase.auth.getSession()` + `onAuthStateChange`; on a valid session, fetch role + content and render `Layout` without the login screen
    - `handleLogin(password)` → `signInResolvingRole` → on `ok`, `fetchContent`, build `data` via `rowsToContentObject`, set `role`, render; on failure map `code` to the `PasswordGate` message and clear input on `invalid`
    - `logout()` → `supabase.auth.signOut()`; on error still force local logged-out state, show login screen within 2s, and message "session ended locally"
    - Remove `REMEMBERED_PW_KEY` and all remembered-password storage
    - Expired session / failed refresh (`onAuthStateChange` → null) shows the login screen and withholds content
    - _Requirements: 1.9, 2.3, 2.4, 9.2, 9.4, 9.5, 9.6, 10.2, 10.3, 10.4, 10.5_

  - [ ]* 8.2 Write unit tests for the App auth flow
    - Session-restore rendering (Req 9.2), logout success + `signOut` throw paths (Req 10.2/10.4), login `code`→message mapping and input-clear on invalid, no password persisted (Req 9.6)
    - _Requirements: 9.2, 9.6, 10.2, 10.4_

- [ ] 9. Update the login gate UI
  - [ ] 9.1 Update `src/components/PasswordGate.jsx`
    - Add `maxLength={72}` to the password input
    - Render the new error codes: `empty`, `invalid`, `ratelimited`, `timeout`, `unavailable`
    - Keep a single password input; never render an email field
    - _Requirements: 1.1, 1.3, 1.8, 2.1, 2.4, 2.6, 2.7_

  - [ ]* 9.2 Write unit tests for `PasswordGate`
    - Each error code renders its message; message persists until the input is edited (Req 2.4); no email field present (Req 1.1)
    - _Requirements: 1.1, 2.4_

- [ ] 10. Update the layout to reflect server authorization
  - [ ] 10.1 Update `src/components/Layout.jsx`
    - Switch nav filtering from the client tier table to `navIdsFromContent(data)`
    - Render the "Building to ₹5CR" badge and `WelcomeIntro` overlay only when `role === 'owner'`
    - Render the `Rhythm` section with weekly+monthly only when `dailyRoutine` is absent (employee)
    - _Requirements: 5.3, 6.2, 6.3, 6.4, 8.2, 8.5_

  - [ ]* 10.2 Write unit tests for role-conditioned UI
    - Owner sees badge + welcome overlay + all nav entries; employee sees neither and exactly the 7 employee nav entries
    - _Requirements: 6.3, 6.4, 8.2, 8.5_

- [ ] 11. Retire the client-side encryption path
  - [ ] 11.1 Delete encryption modules and update the build
    - Delete `src/data/__payload.js`, `src/access/resolveRole.js`, `src/crypto/*`, `scripts/encrypt-content.mjs`, and the retired `src/access/visibility.js`/`roles.js` security table
    - Update `package.json`: remove the `encrypt-content` build step and any script that references the deleted files
    - Ensure no remaining import references the deleted modules
    - _Requirements: 4.4, 15.1, 15.2, 15.3, 15.4_

- [ ] 12. Adapt the post-build bundle scanner
  - [ ] 12.1 Adapt `scripts/scan-bundle.mjs` and wire it into the build
    - Implement/retain a pure `scanText(text, secrets)` that reports `found=true` with exact matches when any non-empty secret appears verbatim, `found=false` otherwise, and ignores empty/blank candidates
    - Scan every `dist/` file for the two Supabase account passwords (read from the gitignored local scan input / CI secret, NOT a `VITE_` var) in plaintext and reversibly-encoded forms
    - Add a signature check for the retired `__payload` / encrypted content; fail the build (non-zero exit) on any hit and report each offending file
    - Wire the scan into the `package.json` build (post-build gate)
    - _Requirements: 11.1, 11.4, 11.5, 11.6, 11.7, 15.2, 15.5, 15.6_

  - [ ]* 12.2 Write property test for the bundle scanner
    - **Property 9: The bundle scanner detects any secret and passes only when clean**
    - **Validates: Requirements 11.1, 11.5, 11.6, 11.7**
    - fast-check, numRuns >= 100; generate arbitrary text + candidate secret sets; assert `found=true` with exact matches when any non-empty secret is embedded verbatim, `found=false` when none is, and blank candidates ignored

- [ ] 13. Configure production security headers
  - [ ] 13.1 Create/update `vercel.json`
    - CSP: `default-src 'self'; connect-src 'self' https://<project-ref>.supabase.co wss://<project-ref>.supabase.co`
    - `Strict-Transport-Security: max-age=31536000; includeSubDomains`
    - `frame-ancestors 'self'` (CSP) and/or `X-Frame-Options`
    - `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`
    - Declare headers via `vercel.json` (not `.htaccess`)
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7_

  - [ ]* 13.2 Write a config assertion test for `vercel.json`
    - Assert presence/values of CSP (incl. Supabase `connect-src` https + wss), HSTS max-age >= 31536000, frame-ancestors/X-Frame-Options, nosniff, Referrer-Policy
    - _Requirements: 12.2, 12.3, 12.4, 12.5, 12.6_

- [ ] 14. Checkpoint - Ensure all pure-logic and config tests pass
  - Ensure all property tests (1–9), unit tests, and the config assertion pass, ask the user if questions arise.

- [ ] 15. Supabase RLS integration verification **[INTEGRATION — requires a Supabase instance: run against local `supabase start` or a dedicated test project with migrations 1.1–1.4 applied and the seed script run. These are NOT property-based tests.]**
  - [ ]* 15.1 Integration test: employee excludes owner rows
    - Sign in as employee; `select * from content_sections`; assert every row has `min_role='employee'` and no owner-only key (`meta`, `streams`, `pricing`, `scripts`, `dailyRoutine`, …) appears
    - _Requirements: 5.1, 5.3, 6.6_

  - [ ]* 15.2 Integration test: employee money redaction end-to-end
    - Deep-scan employee `roadmap`/`months` rows returned by the DB; assert zero money figures
    - _Requirements: 7.1, 7.2, 7.3_

  - [ ]* 15.3 Integration test: owner sees everything
    - Sign in as owner; assert all seeded keys present, including money figures
    - _Requirements: 5.2, 8.1, 8.6_

  - [ ]* 15.4 Integration test: unauthenticated denied
    - Select with no JWT; assert zero rows returned
    - _Requirements: 3.6, 5.6_

  - [ ]* 15.5 Integration test: role CHECK constraint
    - Insert a profile with role `'head'` / `''` / `null`; assert the DB rejects it
    - _Requirements: 3.1_

  - [ ]* 15.6 Integration test: tracker gating
    - With owner `user_state` rows present, sign in as employee and assert zero `user_state` rows returned; assert owner can read only its own rows
    - _Requirements: 14.1, 14.4_

  - [ ]* 15.7 Integration test: extensibility (add / flip employee role)
    - Add a second account with role `'employee'`; assert identical employee access with no policy change; flip its role and assert access is revoked while other employees are unaffected
    - _Requirements: 16.2, 16.4_

- [ ] 16. Final checkpoint - Ensure all tests pass
  - Ensure all property, unit, config, and (where a Supabase instance is available) integration tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional test sub-tasks and can be skipped for a faster MVP; core implementation tasks are never optional.
- **[MANUAL / PREREQUISITE]** tasks require you to apply SQL migrations or supply the service-role key / account passwords — the coding agent authors the files but cannot run these against your Supabase project.
- **[INTEGRATION]** tasks require a real Supabase instance (local `supabase start` or a test project) and are the authoritative check for RLS-enforced authorization; they are representative example tests, not 100-iteration property tests.
- Each property test maps to exactly one of the 9 correctness properties, uses fast-check with `numRuns >= 100`, and is tagged `// Feature: server-side-access-control, Property {N}`.
- Passwords and the service-role key are kept out of every `VITE_` var and out of the bundle; the post-build scan (task 12) enforces this.
- Property→test map: P1→5.2, P2→5.3, P3→6.2, P4→2.2, P5→2.3, P6→6.3, P7→6.4, P8→6.5, P9→12.2.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "2.1", "4.1", "7.1"] },
    { "id": 1, "tasks": ["1.2", "1.3", "2.2", "2.3", "2.4", "5.1"] },
    { "id": 2, "tasks": ["1.4", "3.1", "5.2", "5.3", "5.4", "6.1"] },
    { "id": 3, "tasks": ["6.2", "6.3", "6.4", "6.5", "6.6", "8.1", "9.1", "10.1"] },
    { "id": 4, "tasks": ["8.2", "9.2", "10.2", "11.1", "13.1"] },
    { "id": 5, "tasks": ["12.1", "13.2"] },
    { "id": 6, "tasks": ["12.2", "15.1", "15.2", "15.3", "15.4", "15.5", "15.6", "15.7"] }
  ]
}
```
