# Implementation Plan: Team Dashboard Access

## Overview

Convert the tiered envelope-encryption design into incremental coding steps for the existing Ready2UP dashboard (React + Vite + Tailwind + Recharts, static/client-side, `localStorage`). Each step builds on the previous one and ends by wiring the new access modules into `App.jsx` and `Layout.jsx` so no code is left orphaned.

Implementation language is JavaScript/JSX (the design specifies concrete JS against the existing project). Property-based tests use the project's existing **fast-check** (`^3.23.1`) + **vitest** (`^2.1.8`), minimum `numRuns: 100` per property. Each property test is tagged with its design property in the format `// Feature: team-dashboard-access, Property {n}: {property_text}`.

Build order: pure access foundation → session → tiered build step → runtime crypto/resolution → post-build scan → login UI → app orchestration/routing → navigation filtering + content wiring → integration.

## Tasks

- [x] 1. Access foundation: credentials, roles, and visibility config
  - [x] 1.1 Extend `.password.json` to three role passwords
    - Change the build-time credential source to `{ "_warning": "...", "roles": { "owner": "kairaBaby@015", "head": "Head@Ready2UP", "employee": "Ready2UP" } }`
    - Confirm `.password.json` remains gitignored and is not imported by any shipped code
    - _Requirements: 1.1, 11.4_

  - [x] 1.2 Implement `src/access/roles.js`
    - Define `ROLES = ['owner','head','employee']`, `TIERS = ['work','restricted','personal']`, `ROLE_TIERS` nesting lattice, `LEAST_PRIVILEGED_ROLE = 'employee'`
    - Export pure helpers `isRole(x)` and `tiersForRole(role)` (invalid/undetermined role falls back to least-privileged tiers)
    - _Requirements: 1.1, 7.4, 7.5, 7.6, 8.6_

  - [x] 1.3 Implement `src/access/visibility.js`
    - Define authoritative `CONTENT_TIER` map (every content key assigned exactly one tier) and `NAV_CONTENT` (nav id → backing content keys)
    - Implement `tierForContentKey`, `canAccessContentKey(role,key)` (unknown key → owner only), `permittedContentKeys(role)`, `permittedNavIds(role)`
    - _Requirements: 4.1, 4.2, 4.3, 5.1, 5.3, 6.1, 6.4, 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8, 7.9, 13.4_

  - [x]* 1.4 Write property test for content-key access decision
    - **Property 5: Content-key access decision is correct**
    - **Validates: Requirements 7.7, 7.8, 7.9**

  - [x]* 1.5 Write property test for role permitted-content = tier union
    - **Property 6: Role permitted-content equals its tier union**
    - **Validates: Requirements 4.1, 4.2, 5.1, 6.1, 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 13.4**

  - [x]* 1.6 Write property test for strict nesting
    - **Property 7: Visibility is strictly nested (Employee ⊆ Head ⊆ Owner)**
    - **Validates: Requirements 4.6, 8.6**

  - [x]* 1.7 Write property test for navigation reflecting permitted content
    - **Property 8: Navigation reflects permitted content**
    - **Validates: Requirements 4.3, 5.3, 6.4**

  - [x]* 1.8 Write smoke/structural tests for roles and nav set
    - Assert `ROLES` equals exactly the three defined roles (Req 1.1)
    - Assert the `NAV_CONTENT` id set matches the base build's nav ids (no section added/removed)
    - _Requirements: 1.1, 13.1_

- [x] 2. Session persistence module
  - [x] 2.1 Implement `src/access/session.js`
    - Constants `SESSION_KEY = 'r2up_v1::access_session'`, `SESSION_TTL_MS = 30 days`
    - Pure `serializeSession(role, createdAt)` (no password field) and `parseSession(raw, now, isRoleFn, ttl)` returning `{status:'valid',role}` / `{status:'expired'}` / `{status:'invalid'}`
    - `localStorage` adapters `saveSession`, `loadSession` (clears bad/expired), `clearSession` (removes only `SESSION_KEY`)
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 10.2, 13.6_

  - [x]* 2.2 Write property test for session round-trip and TTL boundary
    - **Property 13: Session serialize/parse round-trip with TTL boundary**
    - **Validates: Requirements 9.1, 9.2, 9.4**

  - [x]* 2.3 Write property test for malformed/unknown-role sessions
    - **Property 14: Malformed or unknown-role sessions are treated as invalid**
    - **Validates: Requirements 9.3**

  - [x]* 2.4 Write property test for sessions never storing a password
    - **Property 15: Sessions never store a password**
    - **Validates: Requirements 9.5**

  - [x]* 2.5 Write property test for clear-session isolation
    - **Property 16: Clearing a session preserves all other stored data**
    - **Validates: Requirements 10.2, 13.6**

- [x] 3. Tiered envelope-encryption build step
  - [x] 3.1 Extend `scripts/encrypt-content.mjs` to tiered envelope encryption
    - Read the three role passwords from `.password.json`; validate all present/non-empty before encrypting and, on failure, emit an error naming the offending role and exit non-zero without touching the previous payload
    - Export a pure `buildTieredPayload(contents, passwords)` that: partitions content by `CONTENT_TIER` into work/restricted/personal buckets; generates one random CEK per tier; AES-256-GCM encrypts each tier under its CEK; derives per-role KEKs via PBKDF2-SHA256 (600k iters, per-role salt); wraps each CEK under the KEK of every permitted role per the lattice
    - Emit `src/data/__payload.js` (v2) with `salts`, per-tier `tiers` ciphertext, and the `wraps` role→tier table (no passwords, no plaintext, no unwrapped CEKs); generate the current payload from `.password.json`
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

  - [x]* 3.2 Write property test for missing-credential build failure
    - **Property 18: Missing credentials fail the build and name the role**
    - **Validates: Requirements 11.5**

- [x] 4. Runtime crypto and role resolution
  - [x] 4.1 Implement `src/crypto/envelope.js`
    - Reuse the AES-GCM/PBKDF2 Web Crypto primitives from `src/crypto/decrypt.js`
    - `unwrapCEK(wrappedEntry, salt, password)` → raw CEK bytes, throwing on wrong password (GCM tag failure); `decryptTier(tierCipher, cekBytes)` → parsed JSON tier content
    - _Requirements: 11.2, 11.3_

  - [x] 4.2 Implement `src/access/resolveRole.js`
    - `resolveRole(password, payload)` iterates roles, attempts to unwrap each role's `work` wrap, returns `{role, tiers}` for the authenticating role or `null`
    - `unlock(password, payload)` resolves the role then unwraps + decrypts only permitted tiers and returns the merged permitted content object (non-permitted tiers never decrypted)
    - _Requirements: 1.2, 1.3, 1.4, 1.5, 1.6, 2.2, 2.3, 2.5, 5.2, 6.2, 6.3, 8.1, 8.4, 8.5, 12.3, 12.4_

  - [x]* 4.3 Write property test for exact/unique role resolution
    - **Property 1: Role resolution is exact and unique**
    - **Validates: Requirements 1.2, 1.3, 1.4, 2.2, 10.4, 12.3**

  - [x]* 4.4 Write property test for rejecting non-matching passwords
    - **Property 2: Non-matching passwords are rejected**
    - **Validates: Requirements 1.6, 2.3, 3.1, 10.5, 12.4**

  - [x]* 4.5 Write property test for no case/whitespace normalization
    - **Property 3: No case or whitespace normalization**
    - **Validates: Requirements 1.5**

  - [x]* 4.6 Write property test for permitted-only unlocked payload
    - **Property 10: The unlocked payload contains only permitted content**
    - **Validates: Requirements 2.5, 5.2, 6.2, 6.3, 8.1, 8.4, 8.5**

  - [x]* 4.7 Write property test for cryptographic nesting (build + runtime)
    - **Property 11: Cryptographic nesting — higher tiers are unrecoverable by lower roles**
    - **Validates: Requirements 5.2, 6.2, 6.3, 11.2, 11.3**

  - [x]* 4.8 Write property test for tier decryption round-trip (build + runtime)
    - **Property 12: Tier decryption round-trip for the correct role**
    - **Validates: Requirements 1.2, 1.3, 1.4, 11.2, 11.3**

  - [x]* 4.9 Write smoke test asserting resolveRole makes no network requests
    - Assert `resolveRole`/`unlock` perform authentication entirely in-browser
    - _Requirements: 12.1_

- [x] 5. Post-build password scan
  - [x] 5.1 Implement `scripts/scan-bundle.mjs`
    - Scan all `dist/` output text for any of the three role password values; export a pure `scanText(text, passwords)` helper and a runner that exits non-zero (blocking release) when any password is found, zero when clean
    - _Requirements: 11.1, 11.6, 11.7_

  - [x] 5.2 Wire the scan into the `build` npm script
    - Update `package.json` `build` to run `node scripts/encrypt-content.mjs && vite build && node scripts/scan-bundle.mjs` so the tainted `dist/` is never released
    - _Requirements: 11.6, 11.7_

  - [x]* 5.3 Write property test for the build scan
    - **Property 17: The build scan detects any password value in the bundle**
    - **Validates: Requirements 11.1, 11.7**

  - [x]* 5.4 Write integration test for the full build scan path
    - Run tiered encryption against a fixture `.password.json`, produce a bundle, then run the scan: assert a clean bundle passes and a deliberately tainted bundle fails
    - _Requirements: 11.6, 11.7_

- [x] 6. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Login screen and input validation
  - [x] 7.1 Implement `src/access/validateInput.js`
    - Pure validator classifying a submitted string: `required` when empty or whitespace-only, `too_long` when length > 256, otherwise `ok` (permits a resolution attempt); rejected inputs must not trigger resolution
    - _Requirements: 1.7, 2.4, 3.3, 3.5_

  - [x] 7.2 Extend `src/components/PasswordGate.jsx` for validation/error states
    - Surface `required`, `too_long`, and `invalid` messages ("Password required", "Password not recognized"); keep the error visible until the input changes; show no personal content pre-auth; allow unlimited attempts
    - _Requirements: 1.6, 1.7, 2.1, 2.3, 2.4, 3.2, 3.4, 3.6_

  - [x]* 7.3 Write property test for input validation classification
    - **Property 4: Input validation classification**
    - **Validates: Requirements 1.7, 2.4, 3.3, 3.5**

  - [x]* 7.4 Write unit tests for the Login screen
    - Renders with no session and shows no content; error persists until the input changes; permits unlimited submissions
    - _Requirements: 2.1, 3.2, 3.4, 3.6_

- [x] 8. App orchestration and routing
  - [x] 8.1 Implement `src/access/router.js` default-section resolution
    - Pure helper resolving a requested nav target for a role: returns the target when permitted, otherwise the role's default permitted nav entry (never a non-permitted target); undetermined/invalid role restricted to least-privileged set
    - _Requirements: 2.6, 6.5, 8.2_

  - [x]* 8.2 Write property test for non-permitted target redirect
    - **Property 9: Non-permitted targets redirect to a permitted default**
    - **Validates: Requirements 2.6, 6.5, 8.2**

  - [x] 8.3 Extend `src/App.jsx` for role-based orchestration
    - Replace single-password unlock with: silent session restore via `loadSession`; role resolution + tier decryption via `unlock`; establish and persist session (role + timestamp) via `saveSession`; logout/role-switch via `clearSession` (still locks and shows login even if `removeItem` throws); pass only the merged permitted data and resolved role into `Layout`
    - _Requirements: 2.2, 2.5, 8.6, 9.1, 9.2, 9.3, 9.4, 10.2, 10.3, 10.4, 10.5, 10.6, 12.1, 12.2_

  - [x]* 8.4 Write unit tests for App logout/session behavior
    - Logout control present on views; logout returns to login and withholds content; logout survives a throwing `removeItem`
    - _Requirements: 10.1, 10.3, 10.6_

- [x] 9. Navigation filtering and content wiring
  - [x] 9.1 Filter navigation in `src/components/Layout.jsx`
    - Filter the `NAV` list through `permittedNavIds(role)`; set initial `active` section to the role's default permitted nav id; show a visible "not accessible to your role" indication when a non-permitted target is requested
    - _Requirements: 4.3, 5.3, 6.4, 8.2, 8.3_

  - [x] 9.2 Wire permitted, filtered content into the existing sections
    - Pass only the merged permitted content down through `Layout` so unchanged `src/components/sections/*` render only permitted content keys; a per-tier decryption failure flags only the affected item as unavailable while other tiers still render
    - _Requirements: 4.4, 4.5, 5.2, 6.2, 6.3, 8.1, 13.1, 13.2_

  - [x]* 9.3 Write unit tests for section rendering and enforcement
    - Selecting a permitted section renders it; a non-permitted target shows the inaccessible indication; a per-tier decryption failure isolates the affected item
    - _Requirements: 4.4, 4.5, 8.3_

  - [x]* 9.4 Write snapshot tests for unchanged section rendering
    - Assert existing sections render unchanged (same theme, nav, charts) under gating
    - _Requirements: 13.2, 13.4_

- [x] 10. Integration and tracker-state preservation
  - [x]* 10.1 Write property test for tracker-state preservation
    - **Property 19: Gating never destroys stored tracker state**
    - **Validates: Requirements 13.3, 13.6**

  - [x]* 10.2 Write integration tests for tracker behavior across roles
    - Permitted trackers keep their existing behavior; stored tracker state is preserved across unlock/filter/logout and across role switches
    - _Requirements: 13.3, 13.5, 13.6_

- [x] 11. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional test tasks and can be skipped for a faster MVP; core implementation tasks are never optional.
- Each task references specific granular requirements for traceability, and every one of the 19 correctness properties maps to exactly one property-based test sub-task.
- Property tests reuse the project's existing fast-check + vitest, minimum `numRuns: 100` (higher for the crypto round-trip in 4.8), and are tagged with their design property reference.
- Crypto properties (4.7, 4.8) exercise the real build-side envelope construction (`buildTieredPayload`) and the runtime unwrap/decrypt path end to end.
- Checkpoints (tasks 6, 11) ensure incremental validation at natural breaks.
- The build step chains encryption → `vite build` → post-build scan so a bundle containing any password is blocked from release.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2", "2.1", "4.1", "5.1", "7.1"] },
    { "id": 1, "tasks": ["1.3", "2.2", "2.3", "2.4", "2.5", "5.2", "5.3", "7.2", "7.3"] },
    { "id": 2, "tasks": ["1.4", "1.5", "1.6", "1.7", "1.8", "3.1", "4.2", "8.1", "7.4"] },
    { "id": 3, "tasks": ["3.2", "4.3", "4.4", "4.5", "4.6", "4.7", "4.8", "4.9", "8.2", "8.3", "9.1", "5.4"] },
    { "id": 4, "tasks": ["8.4", "9.2", "10.1"] },
    { "id": 5, "tasks": ["9.3", "9.4", "10.2"] }
  ]
}
```
