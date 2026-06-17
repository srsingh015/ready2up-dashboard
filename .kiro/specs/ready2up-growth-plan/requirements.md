# Requirements Document

## Introduction

The Ready2UP Growth Plan is a private, single-user web application that serves as a deep, fully-prepared business-growth dashboard for one founder (Saurabh Singh / "DragoSaurabh") running the web agency "Ready2UP". The application replaces an existing single static HTML dashboard with a modern React + Vite + Tailwind CSS application that uses Recharts for data visualization and the browser's localStorage for persistence.

The product exists because the first static version felt "starter-level". This version must deliver a genuinely deep, detailed, and practical plan that spans every level of granularity: a North Star vision, a realistic 24-month target, an ordered income-stream strategy, a phased 24-month roadmap, month-by-month milestones for all 24 months, weekly plans, daily routines, a client-acquisition playbook with ready-to-use outreach scripts and proposal templates, India and international pricing strategy, a "mandatory-only" smart-spending plan, and a revenue-tied team/hiring plan. The application must include interactive trackers (checklists, income vs target, weekly goals, milestone completion) that persist progress on the device, plus charts (revenue projection, progress over time, income-stream breakdown). The interface must be a premium, modern dark theme that is responsive for phone and desktop, and all written content must use clear, plain, motivating language for a non-technical reader. The plan must feel realistic, achievable, and sustainability-first.

The application is built and shipped as static assets so the founder can open or host the result easily.

## Glossary

- **Growth_Plan_App**: The complete React + Vite + Tailwind CSS single-user web application that presents the business growth plan and trackers.
- **Application_Shell**: The persistent top-level UI frame, including header/branding and the primary navigation, that wraps all content sections.
- **Navigation_Component**: The UI element that lists all content sections and lets the user move between them.
- **Content_Section**: A distinct, addressable area of plan content (for example: Goals, Income Streams, Roadmap, Monthly Milestones, Weekly Plans, Daily Routines, Client Acquisition, Outreach Scripts, Pricing, Smart Spending, Team & Hiring, Motivation).
- **Goals_Section**: The Content_Section presenting the North Star dream goal and the realistic 24-month target.
- **Income_Streams_Section**: The Content_Section presenting income streams in their recommended sequencing order.
- **Roadmap_Section**: The Content_Section presenting the 24-month roadmap divided into phases.
- **Monthly_Milestones_Section**: The Content_Section presenting milestones for each of the 24 months.
- **Weekly_Plans_Section**: The Content_Section presenting weekly breakdowns of activities.
- **Daily_Routines_Section**: The Content_Section presenting recommended daily routines.
- **Client_Acquisition_Section**: The Content_Section presenting the playbook for finding and closing clients.
- **Outreach_Scripts_Section**: The Content_Section presenting ready-to-use outreach messages, scripts, and proposal templates.
- **Pricing_Section**: The Content_Section presenting pricing strategy for Indian and international clients.
- **Smart_Spending_Section**: The Content_Section presenting the mandatory-only budget and spending plan.
- **Team_Hiring_Section**: The Content_Section presenting the revenue-tied team-building and hiring plan.
- **Motivation_Section**: The Content_Section presenting motivational content and vision reinforcement.
- **Tracker**: Any interactive component whose user-entered state is persisted on the device, including the Checklist_Tracker, Income_Tracker, Weekly_Goal_Tracker, and Milestone_Tracker.
- **Checklist_Tracker**: A Tracker of completable task items the user can mark done or not done.
- **Income_Tracker**: A Tracker that records actual income amounts and compares them against the target.
- **Weekly_Goal_Tracker**: A Tracker that records completion of weekly goals.
- **Milestone_Tracker**: A Tracker that records completion of roadmap and monthly milestones.
- **Progress_Indicator**: A computed value that expresses overall completion as a percentage based on Tracker state.
- **Chart_Component**: A Recharts-based visualization, including the Revenue_Projection_Chart, Progress_Over_Time_Chart, and Income_Breakdown_Chart.
- **Revenue_Projection_Chart**: A Chart_Component showing projected revenue growth across the 24-month plan.
- **Progress_Over_Time_Chart**: A Chart_Component showing the user's recorded progress across time.
- **Income_Breakdown_Chart**: A Chart_Component showing the breakdown of income by stream.
- **Persistence_Service**: The module that reads and writes Tracker and Income_Tracker state to the browser's localStorage.
- **Production_Build**: The static asset output produced by the Vite build process.
- **User**: The single private founder who uses the Growth_Plan_App.

## Requirements

### Requirement 1: Application Shell and Branding

**User Story:** As the founder, I want a persistent application shell with Ready2UP branding, so that the dashboard feels like a finished, premium product every time I open it.

#### Acceptance Criteria

1. THE Application_Shell SHALL display the Ready2UP brand name and the North Star goal indicator in a persistent header.
2. WHILE the User scrolls within any Content_Section, THE Application_Shell SHALL keep the header visible at the top of the viewport.
3. THE Application_Shell SHALL render the Navigation_Component and the currently selected Content_Section together on screen.
4. THE Application_Shell SHALL apply a dark color theme to all surfaces, text, and controls.

### Requirement 2: Section Navigation

**User Story:** As the founder, I want to move smoothly between every part of the plan, so that I can find any section without scrolling through everything.

#### Acceptance Criteria

1. THE Navigation_Component SHALL present a selectable entry for each Content_Section.
2. WHEN the User selects a navigation entry, THE Growth_Plan_App SHALL display the corresponding Content_Section.
3. WHEN the User selects a navigation entry, THE Navigation_Component SHALL visually mark that entry as the active section.
4. WHEN a Content_Section is displayed, THE Growth_Plan_App SHALL position the view at the start of that Content_Section.

### Requirement 3: Goals and North Star

**User Story:** As the founder, I want the dream and the realistic target shown separately, so that I stay inspired without confusing the vision with the actual plan.

#### Acceptance Criteria

1. THE Goals_Section SHALL display the North Star goal of ₹5 Crore labeled as a 3-to-4-year vision.
2. THE Goals_Section SHALL display the 24-month target of a steady ₹8–12 lakh per month, described as approximately ₹1 Crore-plus per year run-rate.
3. THE Goals_Section SHALL present the North Star goal and the 24-month target as visually distinct items.
4. THE Goals_Section SHALL state that the plan is sustainability-first and prioritizes repeatable monthly cash flow over a quick spike.

### Requirement 4: Income Stream Sequencing

**User Story:** As the founder, I want income streams shown in the order I should add them, so that I focus on one engine before spreading thin.

#### Acceptance Criteria

1. THE Income_Streams_Section SHALL display income streams in a recommended sequencing order.
2. THE Income_Streams_Section SHALL identify web design and development as the primary starting income stream.
3. THE Income_Streams_Section SHALL label each income stream with the stage at which to begin it.
4. THE Income_Streams_Section SHALL explain that streams are added sequentially rather than simultaneously.

### Requirement 5: 24-Month Phased Roadmap

**User Story:** As the founder, I want the 24 months broken into clear phases, so that I understand the journey from reset to a steady agency.

#### Acceptance Criteria

1. THE Roadmap_Section SHALL divide the 24-month period into sequential phases.
2. THE Roadmap_Section SHALL display, for each phase, the time period it covers, its revenue expectation, and its key activities.
3. WHEN the User selects a phase, THE Roadmap_Section SHALL display the detailed activities for that phase.
4. THE Roadmap_Section SHALL order the phases from the reset and foundation stage through to the steady-agency stage.

### Requirement 6: Month-by-Month Milestones

**User Story:** As the founder, I want a milestone for every month, so that I always know what to focus on next.

#### Acceptance Criteria

1. THE Monthly_Milestones_Section SHALL display milestones for each of the 24 months.
2. THE Monthly_Milestones_Section SHALL present each month with its associated focus and target outcome.
3. THE Monthly_Milestones_Section SHALL order the months from month 1 through month 24.

### Requirement 7: Weekly Plans

**User Story:** As the founder, I want weekly breakdowns, so that monthly goals turn into manageable weekly work.

#### Acceptance Criteria

1. THE Weekly_Plans_Section SHALL display weekly breakdowns of activities.
2. THE Weekly_Plans_Section SHALL present each weekly breakdown with its specific activities.

### Requirement 8: Daily Routines

**User Story:** As the founder, I want recommended daily routines, so that I know how to spend each working day productively.

#### Acceptance Criteria

1. THE Daily_Routines_Section SHALL display recommended daily routines.
2. THE Daily_Routines_Section SHALL present each routine with its activities and suggested timing.

### Requirement 9: Client Acquisition Playbook

**User Story:** As the founder, I want a practical playbook for finding and closing clients, so that I can turn outreach into paying projects.

#### Acceptance Criteria

1. THE Client_Acquisition_Section SHALL describe methods for finding potential clients.
2. THE Client_Acquisition_Section SHALL describe steps for closing a potential client into a paying project.
3. THE Client_Acquisition_Section SHALL present a recommended starting approach with Indian clients before expanding to international clients.

### Requirement 10: Outreach Scripts and Templates

**User Story:** As the founder, I want ready-to-use messages and templates, so that I can reach out and send proposals without writing from scratch.

#### Acceptance Criteria

1. THE Outreach_Scripts_Section SHALL display ready-to-use outreach message scripts.
2. THE Outreach_Scripts_Section SHALL display at least one reusable proposal template.
3. WHEN the User selects a copy control for a script or template, THE Growth_Plan_App SHALL copy the corresponding text to the device clipboard.
4. WHEN text is copied to the clipboard, THE Growth_Plan_App SHALL display a confirmation that the copy succeeded.

### Requirement 11: Pricing Strategy

**User Story:** As the founder, I want pricing guidance for both Indian and international clients, so that I charge fairly while growing toward higher rates.

#### Acceptance Criteria

1. THE Pricing_Section SHALL display pricing guidance for Indian clients.
2. THE Pricing_Section SHALL display pricing guidance for international clients.
3. THE Pricing_Section SHALL present pricing for recurring care or maintenance plans separately from one-time project pricing.

### Requirement 12: Smart Spending Plan

**User Story:** As the founder, I want a mandatory-only budget plan, so that I protect my limited funds while building a sustainable base.

#### Acceptance Criteria

1. THE Smart_Spending_Section SHALL display spending items within a total budget range of ₹10,000 to ₹50,000.
2. THE Smart_Spending_Section SHALL label each spending item as mandatory.
3. THE Smart_Spending_Section SHALL display the cost associated with each spending item.

### Requirement 13: Team and Hiring Plan

**User Story:** As the founder, I want a hiring plan tied to revenue, so that I add people only when income supports them.

#### Acceptance Criteria

1. THE Team_Hiring_Section SHALL display recommended hires tied to revenue stages.
2. THE Team_Hiring_Section SHALL identify the role to hire first as revenue grows.
3. THE Team_Hiring_Section SHALL present a target team size of 3 to 5 people for the 24-month plan.

### Requirement 14: Motivation Content

**User Story:** As the founder, I want motivating content, so that I stay committed during slow or hard periods.

#### Acceptance Criteria

1. THE Motivation_Section SHALL display motivational content written in plain, encouraging language.
2. THE Motivation_Section SHALL reference the sustainability-first mindset of the plan.

### Requirement 15: Checklist Tracker with Persistence

**User Story:** As the founder, I want to tick off tasks and have them saved, so that my progress stays even after I close the app.

#### Acceptance Criteria

1. THE Checklist_Tracker SHALL display task items that the User can mark as done or not done.
2. WHEN the User marks a task item as done, THE Checklist_Tracker SHALL display that item as completed.
3. WHEN the User changes a task item's completion state, THE Persistence_Service SHALL save the updated state to localStorage.
4. WHEN the Growth_Plan_App loads, THE Persistence_Service SHALL restore each task item to its last saved completion state.
5. IF saved Tracker state cannot be read from localStorage, THEN THE Growth_Plan_App SHALL display the Checklist_Tracker in its default uncompleted state.

### Requirement 16: Income Tracking vs Target

**User Story:** As the founder, I want to record my actual income against the target, so that I can see how close I am to a steady ₹8–12 lakh per month.

#### Acceptance Criteria

1. THE Income_Tracker SHALL allow the User to record an actual income amount for a month.
2. THE Income_Tracker SHALL display recorded income amounts alongside the 24-month monthly target.
3. WHEN the User records or changes an income amount, THE Persistence_Service SHALL save the updated amount to localStorage.
4. WHEN the Growth_Plan_App loads, THE Persistence_Service SHALL restore the previously recorded income amounts.
5. IF the User enters a value that is not a non-negative number, THEN THE Income_Tracker SHALL reject the entry and display an input error.

### Requirement 17: Weekly Goal and Milestone Tracking

**User Story:** As the founder, I want to mark weekly goals and milestones complete, so that I can track momentum at every level of the plan.

#### Acceptance Criteria

1. THE Weekly_Goal_Tracker SHALL allow the User to mark each weekly goal as completed or not completed.
2. THE Milestone_Tracker SHALL allow the User to mark each roadmap milestone and monthly milestone as completed or not completed.
3. WHEN the User changes a weekly goal or milestone completion state, THE Persistence_Service SHALL save the updated state to localStorage.
4. WHEN the Growth_Plan_App loads, THE Persistence_Service SHALL restore each weekly goal and milestone to its last saved completion state.

### Requirement 18: Overall Progress Indicator

**User Story:** As the founder, I want a single progress percentage, so that I can see my overall momentum at a glance.

#### Acceptance Criteria

1. THE Progress_Indicator SHALL display overall completion as a percentage derived from Tracker completion state.
2. WHEN the User changes any tracked completion state, THE Progress_Indicator SHALL update the displayed percentage to reflect the change.
3. WHERE no task items exist, THE Progress_Indicator SHALL display 0 percent.

### Requirement 19: Revenue Projection Chart

**User Story:** As the founder, I want to see projected revenue growth, so that I can visualize the path to the 24-month target.

#### Acceptance Criteria

1. THE Revenue_Projection_Chart SHALL display projected revenue across the 24-month plan period.
2. THE Revenue_Projection_Chart SHALL render using Recharts.

### Requirement 20: Progress Over Time Chart

**User Story:** As the founder, I want to see my progress over time, so that I can watch my consistency build.

#### Acceptance Criteria

1. THE Progress_Over_Time_Chart SHALL display the User's recorded progress across time.
2. THE Progress_Over_Time_Chart SHALL reflect data persisted by the Persistence_Service.

### Requirement 21: Income Breakdown Chart

**User Story:** As the founder, I want to see income split by stream, so that I understand where my revenue comes from.

#### Acceptance Criteria

1. THE Income_Breakdown_Chart SHALL display a breakdown of income by income stream.
2. THE Income_Breakdown_Chart SHALL render using Recharts.

### Requirement 22: Premium Dark Theme and Plain Language

**User Story:** As a non-technical founder, I want a premium dark interface with clear writing, so that the plan feels professional and is easy to understand.

#### Acceptance Criteria

1. THE Growth_Plan_App SHALL present all Content_Section text in plain, non-technical language.
2. THE Growth_Plan_App SHALL apply a consistent dark color theme across all Content_Sections.
3. WHEN the User interacts with a navigable or selectable control, THE Growth_Plan_App SHALL provide a visible response to the interaction.

### Requirement 23: Responsive Layout

**User Story:** As the founder, I want the dashboard to work on my phone and desktop, so that I can review the plan anywhere.

#### Acceptance Criteria

1. WHILE the viewport width is in a phone-sized range, THE Growth_Plan_App SHALL present all Content_Sections in a single-column layout without horizontal scrolling.
2. WHILE the viewport width is in a desktop-sized range, THE Growth_Plan_App SHALL use the available width to present multi-column layouts where applicable.
3. THE Navigation_Component SHALL remain usable across phone-sized and desktop-sized viewport widths.

### Requirement 24: Migration from the Existing Static Dashboard

**User Story:** As the founder, I want the existing dashboard content carried into the new app, so that nothing valuable from the first version is lost.

#### Acceptance Criteria

1. THE Growth_Plan_App SHALL include the plan content currently present in the existing index.html dashboard.
2. THE Growth_Plan_App SHALL be structured as a React + Vite project using Tailwind CSS for styling and Recharts for charts.
3. THE Growth_Plan_App SHALL replace the existing single static HTML dashboard as the primary interface.

### Requirement 25: Static Production Build

**User Story:** As the founder, I want a static build I can open or host easily, so that I can use the dashboard without running a development environment.

#### Acceptance Criteria

1. WHEN the Production_Build is run, THE Growth_Plan_App SHALL output static assets to a build output directory.
2. THE Production_Build SHALL produce assets that load the Growth_Plan_App when served as static files.
3. THE Growth_Plan_App SHALL function without a backend server for plan content and Tracker persistence.

### Requirement 26: Local-Only Data Storage

**User Story:** As the founder, I want my data kept on my own device, so that my private plan and progress stay private.

#### Acceptance Criteria

1. THE Persistence_Service SHALL store all Tracker and Income_Tracker data in the browser's localStorage on the User's device.
2. THE Growth_Plan_App SHALL operate without transmitting Tracker or Income_Tracker data to any external server.
