# Requirements Document

## Introduction

This feature reworks "Ready2UP," an existing private, single-page personal business growth dashboard for a solo founder (Saurabh), into a grounded, transparent, and maintainable planning tool. The current dashboard presents an aspirational "₹5 Crore in 24 months" target driven by 7 income streams, but its figures (₹25L+/month by month 24, 8-12 team members, 50% international revenue, "₹5CR net profit") are unsubstantiated and conflate revenue with net profit.

The rework has two intertwined goals:

1. **A realistic financial model** — Present a conservative/grounded scenario alongside the ₹5CR stretch ambition, clearly separate revenue from net profit, and tie each phase to realistic preconditions (clients, pricing, capacity, runway).
2. **A better dashboard** — Improve design, structure, code quality, and usefulness, including editable plan data, persistent progress tracking, mobile-first responsive UX, resolution of the orphaned `styles.css`, and preservation of the existing privacy/no-index behavior.

The dashboard remains strictly plain HTML/CSS/JS (no frameworks), statically hosted, and private/non-indexed.

## Assumptions

These assumptions were supplied by the user (who could not use the interactive clarification picker) and are recorded here as the basis for the requirements. They should be revisited if circumstances change.

- **A1 — Founder profile**: Solo founder, India-based, strong web-development skills, bootstrapping with limited upfront capital, working full-time or close to full-time.
- **A2 — Markets**: India first; international markets (US/UK/Middle East) are pursued only after a domestic track record exists.
- **A3 — Targets**: ₹5 Crore remains a labeled stretch ambition; a realistic conservative scenario must be shown alongside it. All monetary figures must clearly label whether they represent net profit or revenue.
- **A4 — Usage**: The dashboard is for personal use and is mobile-first.
- **A5 — Persistence**: Checklist progress and any in-page edits must persist across visits using browser `localStorage` (no backend, no account).
- **A6 — Editability**: Key plan numbers (targets, prices, stream estimates) must be editable in-page so the plan stays realistic over time.
- **A7 — Tech constraints**: Strictly plain HTML/CSS/JS with no frameworks; statically hosted; the site remains private and non-indexed (existing `robots.txt`, `.htaccess`, and `noindex` meta behavior preserved).
- **A8 — Single user, single device caveat**: Because persistence uses `localStorage`, plan data and progress are stored per-browser and are not synchronized across devices.

## Glossary

- **Dashboard**: The single-page Ready2UP web application rendered from `index.html`.
- **Financial_Model**: The component that computes and displays revenue and net-profit figures for the conservative and stretch scenarios from the underlying plan data.
- **Conservative_Scenario**: A grounded set of plan figures representing a realistic, lower-bound outcome.
- **Stretch_Scenario**: An aspirational set of plan figures representing the ₹5 Crore ambition.
- **Plan_Data**: The structured set of editable values backing the dashboard, including targets, prices, per-stream revenue estimates, costs, timeline, and phase preconditions.
- **Income_Stream**: One of the defined revenue sources (for example, web dev agency, AI automation, digital products, content) with associated estimates.
- **Phase**: A time-bounded stage of the plan with targets, actions, and preconditions.
- **Precondition**: A measurable condition (clients, pricing, capacity, or runway) that must hold for a phase's targets to be plausible.
- **Editor**: The in-page editing capability that lets the user change Plan_Data values.
- **Persistence_Store**: The browser `localStorage` mechanism used to save Plan_Data and progress.
- **Progress_Tracker**: The checklist and completion-tracking component whose state is saved to the Persistence_Store.
- **Net_Profit**: Revenue minus associated costs (tools, team, taxes, platform fees) for a given period.
- **Revenue**: Gross income before costs for a given period.
- **Runway**: The number of months the founder can operate given available capital and current burn rate.
- **Privacy_Controls**: The combined `robots.txt`, `.htaccess` headers, and `noindex` meta tags that keep the site private and non-indexed.

## Requirements

### Requirement 1: Transparent Two-Scenario Financial Model

**User Story:** As the founder, I want to see a grounded conservative scenario alongside the ₹5CR stretch ambition, so that I can plan against realistic outcomes while keeping the ambition visible.

#### Acceptance Criteria

1. THE Financial_Model SHALL display a Conservative_Scenario and a Stretch_Scenario together for the same time horizon.
2. THE Financial_Model SHALL label the Stretch_Scenario as an aspirational target and the Conservative_Scenario as the grounded baseline.
3. WHEN the Dashboard displays any monetary figure, THE Financial_Model SHALL label the figure as either Revenue or Net_Profit.
4. THE Financial_Model SHALL display Revenue, total costs, and Net_Profit as separate values for each scenario.
5. WHERE a scenario figure is derived from per-stream estimates, THE Financial_Model SHALL display the underlying Income_Stream estimates that produce the total.
6. THE Financial_Model SHALL display the time horizon in months for each scenario target.

### Requirement 2: Phase Preconditions Grounding

**User Story:** As the founder, I want each phase tied to measurable preconditions, so that targets are plausible rather than assumed.

#### Acceptance Criteria

1. THE Dashboard SHALL display, for each Phase, the Preconditions covering clients, pricing, capacity, and Runway.
2. THE Dashboard SHALL display each Phase's target as a Revenue value and a Net_Profit value.
3. WHERE a Phase target depends on a number of clients or a price point, THE Dashboard SHALL display that client count and price point as part of the Phase's Preconditions.
4. THE Dashboard SHALL display the time period for each Phase in months.

### Requirement 3: Editable Plan Data

**User Story:** As the founder, I want to edit key plan numbers in-page, so that the plan stays accurate as conditions change.

#### Acceptance Criteria

1. THE Editor SHALL allow the user to edit plan targets, prices, and per-Income_Stream Revenue estimates.
2. WHEN the user changes a Plan_Data value, THE Financial_Model SHALL recompute and display the affected Revenue and Net_Profit figures.
3. IF the user enters a non-numeric value in a numeric Plan_Data field, THEN THE Editor SHALL reject the entry and retain the previous valid value.
4. IF the user enters a negative value in a Plan_Data field that represents an amount or count, THEN THE Editor SHALL reject the entry and retain the previous valid value.
5. WHEN the user requests to reset Plan_Data, THE Editor SHALL restore the default Plan_Data values.
6. WHILE the Editor is active, THE Dashboard SHALL indicate which values are editable.

### Requirement 4: Persistence of Plan Data and Progress

**User Story:** As the founder, I want my edits and progress to be saved, so that my changes remain after I close and reopen the dashboard.

#### Acceptance Criteria

1. WHEN the user changes a Plan_Data value, THE Dashboard SHALL save the updated Plan_Data to the Persistence_Store.
2. WHEN the Dashboard loads, THE Dashboard SHALL read saved Plan_Data from the Persistence_Store and display the saved values.
3. WHEN the user changes the completion state of a Progress_Tracker item, THE Dashboard SHALL save the updated state to the Persistence_Store.
4. WHEN the Dashboard loads, THE Dashboard SHALL read saved Progress_Tracker state from the Persistence_Store and display the saved completion states.
5. IF the Persistence_Store contains no saved data when the Dashboard loads, THEN THE Dashboard SHALL display the default Plan_Data and an empty Progress_Tracker state.
6. IF reading from the Persistence_Store yields data that cannot be parsed, THEN THE Dashboard SHALL display the default Plan_Data and continue operation.
7. FOR ALL saved Plan_Data, loading the saved data into the Dashboard SHALL reproduce the values that were saved (round-trip property).

### Requirement 5: Progress Tracking

**User Story:** As the founder, I want to track which plan actions I have completed, so that I can see how far along I am.

#### Acceptance Criteria

1. WHEN the user marks a Progress_Tracker item as complete, THE Progress_Tracker SHALL display the item as completed.
2. WHEN the user marks a completed Progress_Tracker item as incomplete, THE Progress_Tracker SHALL display the item as not completed.
3. THE Progress_Tracker SHALL display the count of completed items and the total number of items.
4. WHEN the completion state of any Progress_Tracker item changes, THE Progress_Tracker SHALL recompute and display the completion summary.

### Requirement 6: Dashboard Structure and Code Quality

**User Story:** As the founder maintaining this myself, I want clean, well-structured code, so that I can update the dashboard without breaking it.

#### Acceptance Criteria

1. THE Dashboard SHALL define Plan_Data as a single structured data source that the displayed figures are derived from.
2. THE Dashboard SHALL render the Financial_Model figures, Phase targets, and Income_Stream estimates from the Plan_Data data source rather than from hard-coded duplicated values.
3. THE Dashboard SHALL retain the existing dashboard sections covering income streams, phase roadmap, milestones, schedule, client channels, pricing, pitch templates, checklist, team scaling, and international pricing.
4. WHERE the orphaned `styles.css` file exists, THE Dashboard SHALL either link `styles.css` as the active stylesheet or remove `styles.css` so that no unused stylesheet remains in the project.
5. THE Dashboard SHALL load without console errors in a current desktop browser and a current mobile browser.

### Requirement 7: Mobile-First Responsive UX

**User Story:** As the founder who checks the plan on my phone, I want the dashboard to work well on mobile first, so that it is usable on small screens.

#### Acceptance Criteria

1. WHILE the viewport width is at most 400 pixels, THE Dashboard SHALL display all content without horizontal page scrolling.
2. THE Dashboard SHALL render layout, navigation, and interactive controls usable at viewport widths from 320 pixels upward.
3. WHERE interactive controls are touch targets, THE Dashboard SHALL render each touch target at no less than 44 by 44 CSS pixels.
4. WHEN the viewport width increases across the defined breakpoints, THE Dashboard SHALL adapt the layout to use the available width.

### Requirement 8: Privacy and No-Index Preservation

**User Story:** As the founder, I want the dashboard to stay private and unindexed, so that my personal business plan is not exposed publicly.

#### Acceptance Criteria

1. THE Dashboard SHALL include the `noindex` and `nofollow` directives in its robots meta tags.
2. THE Privacy_Controls SHALL retain the existing `robots.txt` directives that disallow crawling for all user agents.
3. THE Privacy_Controls SHALL retain the existing `.htaccess` `X-Robots-Tag` header set to `noindex, nofollow`.
4. THE Dashboard SHALL operate without requiring any third-party network request other than the existing web-font request.
