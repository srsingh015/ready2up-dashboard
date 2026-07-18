# Implementation Plan: Institute Outreach

## Overview

This plan implements the Institute Outreach dashboard section by building outward from a pure, testable logic core to the React UI and the content pipeline, following the exact content → aggregate → encrypt → decrypt → prop flow every other section uses.

Sequence: stand up the test toolchain → build the pure logic layer with property tests → define the content module schema and fixed seed constants → research and seed real lead data (Nashik first) → build the section component and sub-components → register navigation → add the build guard → wire everything together and verify the build.

Each task builds on the prior ones, ends with integration into the running app, and leaves no orphaned code.

## Tasks

- [x] 1. Set up the test toolchain (Vitest + fast-check)
  - Add `vitest`, `fast-check`, `jsdom`, and `@testing-library/react` (plus `@testing-library/jest-dom`) as devDependencies in `package.json`
  - Add a `"test": "vitest run"` script (single-run, not watch) and a `"test:watch": "vitest"` script to `package.json`
  - Configure Vitest in `vite.config.js` (or `vitest.config.js`) with `environment: 'jsdom'` and a `setupFiles` entry for `@testing-library/jest-dom`
  - Add a trivial smoke test (e.g. `src/utils/__tests__/smoke.test.js`) and confirm `npm run test` discovers and runs it
  - _Requirements: supports property/unit testing referenced across all requirements_

- [x] 2. Build the pure logic layer `src/utils/outreach.js`
  - [x] 2.1 Define exported constants and status resolution
    - Create `src/utils/outreach.js` exporting `OUTREACH_STATUSES` (the seven statuses in display order), `CLOSED_WON` (`'Closed won'`), `CITY_ORDER` (`['Nashik','Pune','Mumbai','Other']`), and `INSTITUTE_CATEGORIES` (the seven categories in order)
    - Implement `resolveStatus(lead, store)` with precedence: valid persisted override → lead seed status → `'Not contacted'`; ignore persisted values not in `OUTREACH_STATUSES`
    - _Requirements: 3.2, 3.6, 5.4, 5.5, 5.7_

  - [x]* 2.2 Write property test for status resolution precedence
    - **Property 4: Status resolution precedence** — `resolveStatus` returns the valid persisted override if present, else the seed status, else `'Not contacted'`
    - **Validates: Requirements 3.2, 5.5**
    - Tag: `// Feature: institute-outreach, Property 4: ...`
    - _Requirements: 3.2, 5.5_

  - [x]* 2.3 Write property test for resolution closure and invalid-value fallback
    - **Property 5: Status resolution closure and invalid-value fallback** — output is always one of the seven statuses; garbage persisted values are ignored in favor of seed/default
    - **Validates: Requirements 3.6, 5.7**
    - Tag: `// Feature: institute-outreach, Property 5: ...`
    - _Requirements: 3.6, 5.7_

  - [x]* 2.4 Write property test for persistence round-trip
    - **Property 6: Persistence round-trip** — writing a valid status to the store and reading it back through the resolution path returns the same status
    - **Validates: Requirements 5.3**
    - Tag: `// Feature: institute-outreach, Property 6: ...`
    - _Requirements: 5.3_

  - [x] 2.5 Implement lead validation and uniqueness helpers
    - Implement `validateLead(lead)` — accepts iff required fields present (id, name, category, city, weakness, suggestedProof, contactAngle), name length 1–200, city ∈ City set, category ∈ `INSTITUTE_CATEGORIES`; optional contact fields (phone/email/website) do not affect validity
    - Implement `hasUniqueIds(leads)` — reports a violation iff two or more leads share the same `id`
    - _Requirements: 3.1, 3.3, 3.5, 3.7_

  - [x]* 2.6 Write property test for the lead validator
    - **Property 2: Lead validator accepts well-formed leads and rejects malformed ones**
    - **Validates: Requirements 3.1, 3.3, 3.7**
    - Tag: `// Feature: institute-outreach, Property 2: ...`
    - _Requirements: 3.1, 3.3, 3.7_

  - [x]* 2.7 Write property test for lead identifier uniqueness
    - **Property 3: Lead identifiers are unique** — uniqueness validator flags a violation iff two leads share an `id`
    - **Validates: Requirements 3.5**
    - Tag: `// Feature: institute-outreach, Property 3: ...`
    - _Requirements: 3.5_

  - [x] 2.8 Implement `groupLeadsByCity` and `applyFilters`
    - `groupLeadsByCity(leads)` returns groups ordered as a subsequence of `CITY_ORDER`, routes non-Nashik/Pune/Mumbai leads to `Other`, reports per-group counts, places each lead in exactly one group, and sorts leads within a group case-insensitively A→Z by name
    - `applyFilters(leads, cityFilter, statusFilter)` returns exactly the leads matching city (or `'all'`) and resolved status (or `'all'`); result is always a subset
    - _Requirements: 4.1, 4.2, 4.3, 4.6, 4.7, 4.8_

  - [x]* 2.9 Write property test for city grouping invariants
    - **Property 7: City grouping invariants** — order is a subsequence of CITY_ORDER, Other bucket correctness, counts match, total partition, alphabetical order within groups
    - **Validates: Requirements 4.1, 4.2, 4.3**
    - Tag: `// Feature: institute-outreach, Property 7: ...`
    - _Requirements: 4.1, 4.2, 4.3_

  - [x]* 2.10 Write property test for filter conjunction subset
    - **Property 8: Filter conjunction subset** — filtered result contains exactly the leads matching both active predicates and is always a subset of the input
    - **Validates: Requirements 4.6, 4.7, 4.8**
    - Tag: `// Feature: institute-outreach, Property 8: ...`
    - _Requirements: 4.6, 4.7, 4.8_

  - [x]* 2.11 Write property test for status-change isolation
    - **Property 9: Status-change isolation** — applying a single status change makes only that lead resolve to the new status; all others unchanged
    - **Validates: Requirements 5.1**
    - Tag: `// Feature: institute-outreach, Property 9: ...`
    - _Requirements: 5.1_

  - [x] 2.12 Implement `computePipeline`
    - `computePipeline(leads, cityScope)` returns `{ counts, total, conversionPct }`: counts has an entry for all seven statuses (default 0), each equal to the number of scoped leads with that resolved status; total equals the sum of counts; conversionPct is the closed-won share as an integer 0–100 rounded to the nearest whole percent, 0 when total is 0
    - _Requirements: 9.1, 9.3, 9.4, 9.5, 9.6_

  - [x]* 2.13 Write property test for pipeline count partition
    - **Property 10: Pipeline counts partition the scoped leads** — counts map covers all seven statuses and sums to the scoped total
    - **Validates: Requirements 9.1, 9.3, 9.4, 9.5**
    - Tag: `// Feature: institute-outreach, Property 10: ...`
    - _Requirements: 9.1, 9.3, 9.4, 9.5_

  - [x]* 2.14 Write property test for conversion percentage bounds
    - **Property 11: Conversion percentage bounds** — integer in [0,100], equals rounded closed-won/total×100, 0 when total is 0
    - **Validates: Requirements 9.6**
    - Tag: `// Feature: institute-outreach, Property 11: ...`
    - _Requirements: 9.6_

  - [x] 2.15 Implement `matchProof`
    - `matchProof(lead, portfolioProof)` returns the matching `PortfolioProofGroup` (category equals lead category) deterministically when one exists; otherwise returns all proof groups flagged as a fallback
    - _Requirements: 3.4, 7.4, 7.5_

  - [x]* 2.16 Write property test for proof match determinism
    - **Property 12: Proof match determinism** — for a lead whose category has a matching group, `matchProof` returns that group with equal category
    - **Validates: Requirements 3.4, 7.4**
    - Tag: `// Feature: institute-outreach, Property 12: ...`
    - _Requirements: 3.4, 7.4_

  - [x]* 2.17 Write property test for proof fallback
    - **Property 13: Proof fallback for unmatched categories** — for a lead whose category has no match, `matchProof` returns all groups flagged as fallback
    - **Validates: Requirements 7.5**
    - Tag: `// Feature: institute-outreach, Property 13: ...`
    - _Requirements: 7.5_

- [x] 3. Checkpoint - pure logic layer complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Create the content module schema and fixed seed constants
  - [x] 4.1 Create `content-source/instituteOutreach.js` structure and non-lead seed data
    - Export `const instituteOutreach = { offer, leads: [], pricingTiers, addOns, portfolioProof, outreachTemplates }`
    - Seed `pricingTiers` exactly: Starter (₹20,000 – ₹35,000, "4 to 6 page small site"), Standard (₹40,000 – ₹75,000, "8 to 12 page admissions-focused site", `recommended: true`), Advanced (₹90,000 – ₹1,50,000, "near-Navjeevan custom build"), in that order
    - Seed `addOns`: Yearly maintenance (₹8,000 – ₹15,000 / year), SEO, Admission-season landing pages
    - Seed `portfolioProof` as one group per category with the exact category→URL mapping from the design (MBA, Trust/Foundation with two URLs, Pharmacy college, Day school, Science college, School, Law college)
    - Seed `outreachTemplates`: at least one email and one WhatsApp template with placeholder tokens (e.g. `[Institute Name]`) preserved verbatim in the body
    - Seed `offer` with a headline and a short description
    - _Requirements: 2.1, 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 7.1, 7.2, 8.1, 8.2_

  - [x]* 4.2 Write unit tests for the fixed seed literals
    - Assert three pricing tiers with exact ranges/scopes and Standard marked recommended; add-on ranges and set; exact category→URL proof mapping; ≥1 email and ≥1 WhatsApp template with tokens preserved
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 7.2, 8.1, 8.2_

  - [x]* 4.3 Write property test for content serialization round-trip
    - **Property 1: Content serialization round-trip** — `JSON.parse(JSON.stringify(instituteOutreach))` is deeply equal to the source, preserving every record
    - **Validates: Requirements 2.3**
    - Tag: `// Feature: institute-outreach, Property 1: ...`
    - _Requirements: 2.3_

- [x] 5. Research and seed real lead data into `content-source/instituteOutreach.js`
  - [x] 5.1 Research and populate the `leads` array
    - Research small/mid colleges and schools and populate the `leads` array, capturing per lead: unique `id`, institute `name` (1–200 chars), `category` (from the seven-category set), `city`, current website `weakness` (the hook), `contactAngle`, and `suggestedProof` matched to the lead's category
    - Seed **Nashik first and most thoroughly** (priority city), then Pune, then Mumbai; use `Other` only where applicable
    - Ensure every lead's `category` has a matching `portfolioProof` group and every `id` is unique; set `status` only where known (absent → treated as "Not contacted")
    - Populate optional contact fields (`phone`, `email`, `website`) only when a real value is found; omit otherwise
    - Validate the seeded array against `validateLead` and `hasUniqueIds` from the logic layer
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 4.2_

  - [x]* 5.2 Write unit test validating the seeded leads
    - Assert every seeded lead passes `validateLead`, all ids are unique, every category maps to an existing proof group, and Nashik leads are present
    - _Requirements: 3.1, 3.4, 3.5, 4.2_

- [x] 6. Aggregate the content module
  - Import `instituteOutreach` in `content-source/contents.js` and add it under the unique key `instituteOutreach` in the exported `contents` object
  - _Requirements: 2.2_

- [x] 7. Checkpoint - content pipeline authored
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Build the section component and sub-components
  - [x] 8.1 Create `src/components/sections/InstituteOutreach.jsx` orchestrator
    - Default export reading `const io = data?.instituteOutreach`; render an "outreach content unavailable" state and return early when falsy (no partial content)
    - Own `cityFilter` and `statusFilter` via `useState`, and persisted overrides via `useLocalStorage('io_lead_status', {})`
    - Compute `resolvedLeads` (via `resolveStatus`), `pipeline` (via `computePipeline`), and `visibleGroups` (via `groupLeadsByCity(applyFilters(...))`) with `useMemo`
    - Reuse shared UI primitives from `src/components/ui/Section.jsx` (PageHeader, Card, etc.), lucide-react icons, and the dark/glass mobile-first theme; single-column ≤767px, multi-column ≥768px
    - _Requirements: 1.4, 1.5, 1.6, 2.5, 2.6, 10.1, 10.3, 10.4, 10.5_

  - [x] 8.2 Implement `PipelineSummary`
    - Render a count for every one of the seven statuses (including 0), total lead count, and closed-won conversion `${conversionPct}%`; recompute reactively from the memoized `pipeline`
    - _Requirements: 9.1, 9.2, 9.6_

  - [x] 8.3 Implement `Filters`
    - City selector (`all` + four buckets) and status selector (`all` + seven statuses) with a clear control; controls stay mounted even when zero leads match
    - _Requirements: 4.6, 4.7, 4.8, 4.9_

  - [x] 8.4 Implement `LeadList`
    - Render one block per non-empty city group with city name and lead count in CITY_ORDER; when `groups` is empty (filter match zero) render a "no leads match" empty state with filters still mounted; when seed leads are entirely empty render an empty state
    - _Requirements: 1.6, 4.1, 4.2, 4.3, 4.9_

  - [x] 8.5 Implement `LeadCard` and `StatusDropdown`
    - `LeadCard` renders institute name, category, city, weakness, contact angle, suggested proof link, and current status; missing weakness/angle/proof show a visible placeholder; optional contact fields render only when present
    - `StatusDropdown` is a `<select>` restricted to the seven statuses; on change calls back to the parent; shows a "not saved" indicator when the parent reports a persist error
    - Implement `commitStatus` in the orchestrator: optimistic update via the hook, verified read-back of the namespaced key, roll back to last good value and set the per-lead persist error on mismatch
    - _Requirements: 4.4, 4.5, 3.7, 5.1, 5.2, 5.4, 5.6_

  - [x]* 8.6 Write unit tests for lead rendering, status editing, and persistence
    - Rendered lead shows all required fields; empty fields show placeholders; status change updates only that lead and pipeline counts without reload; successful change writes the namespaced key; mocked verification mismatch triggers roll-back and "not saved" indicator; empty-state and zero-match cases
    - _Requirements: 4.4, 4.5, 5.1, 5.2, 5.6, 9.2, 1.6, 4.9_

  - [x] 8.7 Implement `PricingTiers`
    - Render exactly three tiers Starter→Standard→Advanced with name, price range, scope; mark Standard as recommended; render add-ons with a "quoted separately" label; when pricing data is missing/empty render "pricing unavailable" with no partial tier prices
    - _Requirements: 6.1, 6.5, 6.6, 6.7, 6.8_

  - [x] 8.8 Implement `PortfolioProof`
    - Render exactly one labeled group per institute category showing category name and link(s); all links use `target="_blank" rel="noopener noreferrer"`
    - _Requirements: 7.1, 7.2, 7.3_

  - [x] 8.9 Implement `OutreachTemplates`
    - Render each template with an "email"/"WhatsApp" channel label and body (tokens verbatim in a `<pre>` block); copy button uses `navigator.clipboard.writeText(body)`, shows confirmation on success and removes it within 5s, shows an error indication on failure and leaves displayed text unchanged
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

  - [x]* 8.10 Write property test for template copy fidelity
    - **Property 14: Template copy fidelity** — the string handed to the clipboard equals the template body exactly, tokens verbatim, no transformation
    - **Validates: Requirements 8.2, 8.3**
    - Tag: `// Feature: institute-outreach, Property 14: ...`
    - _Requirements: 8.2, 8.3_

  - [x]* 8.11 Write unit tests for pricing, proof, and template behavior
    - Pricing tiers/order/recommended/add-ons and "pricing unavailable" path; proof anchors carry `target="_blank" rel="noopener noreferrer"` and exact category→URL mapping; clipboard confirmation appears then clears within 5s (fake timers) and rejection shows error with text unchanged
    - _Requirements: 6.1, 6.8, 7.2, 7.3, 8.4, 8.5_

- [x] 9. Register the section in navigation
  - [x] 9.1 Add the nav entry and render case in `src/components/Layout.jsx`
    - Import a lucide-react icon (e.g. `GraduationCap`) and `import InstituteOutreach from './sections/InstituteOutreach.jsx'`
    - Add exactly one `NAV` entry in the `execution` group: `{ id: 'institute-outreach', label: 'Institute Outreach', icon: GraduationCap, group: 'execution' }`
    - Add one `renderSection()` case: `case 'institute-outreach': return <InstituteOutreach {...props} />;`
    - Add no route, meta tag, or markup that overrides the existing noindex directive
    - _Requirements: 1.1, 1.2, 1.3, 1.5, 10.2, 10.6_

  - [x]* 9.2 Write unit test for nav registration
    - Assert exactly one `execution`-group NAV entry with id `institute-outreach`, a non-empty label, and an icon; a `renderSection` case exists for the id
    - _Requirements: 1.1, 1.2_

- [x] 10. Add the build guard in `scripts/encrypt-content.mjs`
  - [x] 10.1 Implement the missing-content guard
    - After `loadContents()` and before `encrypt()`/`writeFileSync`, assert `contents.instituteOutreach` exists; if missing, log a clear error and `process.exit(1)` so no payload is produced
    - _Requirements: 2.4_

  - [x]* 10.2 Write unit test for the build guard
    - Extract/assert the guard errors and does not write when `instituteOutreach` is absent from the aggregated content
    - _Requirements: 2.4_

- [x] 11. Wire, encrypt, and verify the build
  - Run `npm run build` to encrypt the aggregated content (now including `instituteOutreach`) into `src/data/__payload.js` and produce the Vite build; confirm the section decrypts and reads `data.instituteOutreach` at runtime
  - Run `npm run test` and ensure all property and unit tests pass
  - Confirm the guard aborts the build when the key is intentionally removed, then restore it
  - _Requirements: 2.3, 2.4, 2.5_

- [x] 12. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional test tasks and can be skipped for a faster MVP; core implementation tasks are never optional.
- Each of the 14 correctness properties maps to exactly one property-based test, placed close to the implementation it validates, tagged `// Feature: institute-outreach, Property {number}: {property text}`, and run at ≥100 iterations with fast-check.
- Property tests and example/unit tests are complementary — properties cover the large input space of the pure logic layer; unit tests cover fixed seed literals, rendering, wiring, and error handling.
- Checkpoints ensure incremental validation at natural boundaries.
- Task 5 (real lead research/seeding) involves web research during implementation, with Nashik prioritized and seeded most thoroughly.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1"] },
    { "id": 1, "tasks": ["2.1", "2.5", "2.8", "2.12", "2.15"] },
    { "id": 2, "tasks": ["2.2", "2.3", "2.4", "2.6", "2.7", "2.9", "2.10", "2.11", "2.13", "2.14", "2.16", "2.17"] },
    { "id": 3, "tasks": ["4.1"] },
    { "id": 4, "tasks": ["4.2", "4.3", "5.1"] },
    { "id": 5, "tasks": ["5.2", "6"] },
    { "id": 6, "tasks": ["8.1", "10.1"] },
    { "id": 7, "tasks": ["8.2", "8.3", "8.4", "8.5", "8.7", "8.8", "8.9", "9.1"] },
    { "id": 8, "tasks": ["8.6", "8.10", "8.11", "9.2", "10.2"] },
    { "id": 9, "tasks": ["11"] }
  ]
}
```
