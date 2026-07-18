# Requirements Document

## Introduction

The Institute Outreach feature adds a new section to the existing private Ready2UP Private Growth Plan dashboard. It serves as an outreach command center for winning new website design and development clients among small to mid-size colleges and schools. Ready2UP personally built the full Navjeevan portfolio of institute websites and uses that portfolio as credibility proof.

The section brings together five capabilities in one place: a target-client lead list organized by city (Nashik first, then Pune, then Mumbai), a display of the offer and tiered pricing, the Navjeevan portfolio proof matched by institute category, copyable outreach scripts and templates, and a pipeline status view summarizing where each lead stands. Lead status edits persist locally so the user's tracking is retained across sessions.

The feature follows all existing app conventions: content authored in a `content-source/*.js` module aggregated into `content-source/contents.js` and encrypted into `src/data/__payload.js`; a React section component under `src/components/sections/` registered in `src/components/Layout.jsx`; a private, password-gated, noindex, mobile-first, dark-themed UI; and editable state persisted via the existing `useLocalStorage` hook.

## Glossary

- **Institute_Outreach_Section**: The React section component that renders the Institute Outreach feature within the dashboard main area.
- **Content_Module**: The `content-source/instituteOutreach.js` file that exports static feature content (leads seed data, offer, pricing tiers, add-ons, portfolio proof, scripts) consumed by the encryption build step.
- **Content_Aggregator**: The `content-source/contents.js` module that combines all content modules into a single object.
- **Encrypted_Payload**: The `src/data/__payload.js` file produced by the build/encrypt step and decrypted at runtime.
- **Navigation_Registry**: The `NAV` array and `renderSection()` switch in `src/components/Layout.jsx` that register dashboard sections.
- **Lead**: A single target-client record for a college or school being pursued for outreach.
- **Lead_Store**: The locally persisted collection of Lead records and their editable state, managed through the `useLocalStorage` hook.
- **Outreach_Status**: The stage of a Lead in the outreach process, one of: Not contacted, Contacted, Replied, Meeting, Proposal sent, Closed won, Closed lost.
- **City**: The location grouping for Leads, with priority order Nashik, then Pune, then Mumbai, plus an "Other" grouping for leads in any other location.
- **Pricing_Tier**: One of the three offer tiers: Starter, Standard, Advanced.
- **Add_On**: An optional supplementary service (yearly maintenance, SEO, admission-season landing pages) quoted separately.
- **Portfolio_Proof**: A Navjeevan reference website link associated with an institute category, used as credibility.
- **Institute_Category**: The classification of an institute, matched to a Portfolio_Proof (for example MBA, Trust/Foundation, Pharmacy college, Day school, Science college, School, Law college).
- **Outreach_Template**: A reusable email or WhatsApp message the user can copy for outreach.
- **Pipeline_View**: The summary display that counts and groups Leads by Outreach_Status.
- **User**: The dashboard owner (Ready2UP) operating the outreach command center.

## Requirements

### Requirement 1: Section Registration and Navigation

**User Story:** As the User, I want the Institute Outreach section accessible from the dashboard navigation, so that I can open my outreach command center alongside other plan sections.

#### Acceptance Criteria

1. THE Navigation_Registry SHALL include exactly one navigation entry for the Institute_Outreach_Section, with a unique id, a non-empty label, an icon, and a group.
2. THE Navigation_Registry SHALL place the Institute_Outreach_Section navigation entry in the "execution" group, alongside the Client Channels and Pricing entries.
3. WHEN the User selects the Institute Outreach navigation entry, THE Institute_Outreach_Section SHALL render as the single active section, replacing the previously active section in the dashboard main area.
4. THE Institute_Outreach_Section SHALL be implemented as a React section component located under `src/components/sections/`.
5. WHEN the Institute_Outreach_Section is rendered, THE Institute_Outreach_Section SHALL receive the decrypted content data through the `data` prop, consistent with the props mechanism used by existing sections.
6. IF the decrypted content data for the Institute_Outreach_Section is absent or empty, THEN THE Institute_Outreach_Section SHALL render an empty state without crashing.

### Requirement 2: Content Sourcing and Build Integration

**User Story:** As the User, I want the outreach content authored in the standard content pipeline, so that the feature is maintainable and consistent with the rest of the app.

#### Acceptance Criteria

1. THE Content_Module SHALL export the Institute Outreach content as a single named object containing seed Lead records, the offer description, Pricing_Tier definitions, Add_On definitions, Portfolio_Proof links, and Outreach_Template records.
2. THE Content_Aggregator SHALL import the Content_Module and include the Institute Outreach content in the aggregated content object under a single dedicated key that is unique among the existing aggregated content keys.
3. WHEN the build and encrypt step runs, THE Encrypted_Payload SHALL contain the Institute Outreach content with every record exported by the Content_Module preserved without omission or alteration.
4. IF the build and encrypt step runs and the Institute Outreach content is absent from the aggregated content object, THEN THE build and encrypt step SHALL terminate with an error indicating the missing Institute Outreach content and SHALL NOT produce an Encrypted_Payload.
5. WHEN the dashboard decrypts the Encrypted_Payload at runtime, THE Institute_Outreach_Section SHALL read the Institute Outreach content from the decrypted data using the dedicated key.
6. IF the decrypted data does not contain the Institute Outreach content under the dedicated key, THEN THE Institute_Outreach_Section SHALL display an error indication that the outreach content is unavailable and SHALL NOT render partial outreach content.

### Requirement 3: Lead Data Structure

**User Story:** As the User, I want each target institute captured with the fields I need for outreach, so that I have all context in one record.

#### Acceptance Criteria

1. THE Content_Module SHALL define each Lead with the following required fields: a unique identifier, institute name (1 to 200 characters), Institute_Category, City, current website weakness, suggested matching Portfolio_Proof reference, contact angle, and an Outreach_Status.
2. WHERE a Lead is defined in the seed data without an explicit Outreach_Status, THE Institute_Outreach_Section SHALL treat that Lead as having the Outreach_Status "Not contacted".
3. THE Content_Module SHALL assign each Lead a City value of exactly one of: Nashik, Pune, Mumbai, or Other.
4. THE Content_Module SHALL assign each Lead a suggested Portfolio_Proof reference whose Institute_Category equals the Lead Institute_Category.
5. THE Content_Module SHALL assign each Lead an identifier that is unique across all Leads, such that no two Leads share the same identifier value.
6. THE Content_Module SHALL assign each Lead an Outreach_Status equal to exactly one of a defined, closed set of status values that includes "Not contacted".
7. WHERE a Lead includes optional contact fields, THE Content_Module SHALL store each provided value as a phone number, an email address, or a website URL, and THE Institute_Outreach_Section SHALL treat any absent contact field as empty rather than invalid.

### Requirement 4: Target-Client List by City

**User Story:** As the User, I want the target-client list organized by city with Nashik first, so that I focus my outreach effort where my local proof is strongest.

#### Acceptance Criteria

1. THE Institute_Outreach_Section SHALL display Leads grouped into City groups, with each group labeled by its City name and showing the count of Leads it contains.
2. THE Institute_Outreach_Section SHALL order the City groups as Nashik first, then Pune, then Mumbai, then Other, where the Other group contains every Lead whose City is not Nashik, Pune, or Mumbai.
3. WHILE displaying Leads within a City group, THE Institute_Outreach_Section SHALL order those Leads alphabetically (A to Z, case-insensitive) by institute name.
4. WHEN a Lead is displayed, THE Institute_Outreach_Section SHALL show the institute name, Institute_Category, City, current website weakness, contact angle, suggested Portfolio_Proof link, and current Outreach_Status.
5. IF a displayed Lead has no value for the current website weakness, contact angle, or suggested Portfolio_Proof link field, THEN THE Institute_Outreach_Section SHALL render that field with a visible placeholder indicating the value is not available, rather than omitting the field or showing an empty space.
6. WHERE the User applies a City filter, THE Institute_Outreach_Section SHALL display only the Leads whose City matches the selected filter value exactly.
7. WHERE the User applies an Outreach_Status filter, THE Institute_Outreach_Section SHALL display only the Leads whose Outreach_Status matches the selected filter value exactly.
8. WHERE the User applies both a City filter and an Outreach_Status filter, THE Institute_Outreach_Section SHALL display only the Leads whose City and Outreach_Status both match the selected filter values.
9. IF an applied filter or combination of filters matches zero Leads, THEN THE Institute_Outreach_Section SHALL display an empty-state message indicating that no Leads match the current filter selection and SHALL retain the active filter controls so the User can change or clear the selection.

### Requirement 5: Editable Outreach Status with Local Persistence

**User Story:** As the User, I want to update each lead's outreach status and have it saved locally, so that my tracking persists across sessions without a backend.

#### Acceptance Criteria

1. WHEN the User changes the Outreach_Status of a Lead, THE Institute_Outreach_Section SHALL update the displayed Outreach_Status for that Lead to the selected value within 1 second, without altering the Outreach_Status of any other Lead.
2. WHEN the User changes the Outreach_Status of a Lead, THE Lead_Store SHALL persist the updated Outreach_Status for that Lead through the `useLocalStorage` hook within 1 second.
3. WHEN the User reloads the dashboard, THE Institute_Outreach_Section SHALL display each Lead with the Outreach_Status previously persisted in the Lead_Store.
4. THE Institute_Outreach_Section SHALL restrict the selectable Outreach_Status values to exactly the seven values: Not contacted, Contacted, Replied, Meeting, Proposal sent, Closed won, Closed lost.
5. IF the Lead_Store contains no persisted status for a Lead, THEN THE Institute_Outreach_Section SHALL display the Outreach_Status defined for that Lead in the content data.
6. IF persisting an updated Outreach_Status to the Lead_Store fails, THEN THE Institute_Outreach_Section SHALL retain the last successfully persisted value and display an indication that the change was not saved.
7. IF the Lead_Store contains a persisted Outreach_Status value that is not one of the seven defined values, THEN THE Institute_Outreach_Section SHALL fall back to the Outreach_Status defined for that Lead in the content data.

### Requirement 6: Offer and Tiered Pricing Display

**User Story:** As the User, I want the offer and tiered pricing shown clearly, so that I can reference and quote them during outreach.

#### Acceptance Criteria

1. THE Institute_Outreach_Section SHALL display exactly three Pricing_Tiers in the order Starter, Standard, then Advanced, and SHALL display each tier's name, price range, and scope description.
2. THE Institute_Outreach_Section SHALL display the Starter tier with the price range ₹20,000 to ₹35,000 and the scope text "4 to 6 page small site".
3. THE Institute_Outreach_Section SHALL display the Standard tier with the price range ₹40,000 to ₹75,000 and the scope text "8 to 12 page admissions-focused site".
4. THE Institute_Outreach_Section SHALL display the Advanced tier with the price range ₹90,000 to ₹1,50,000 and the scope text "near-Navjeevan custom build".
5. THE Institute_Outreach_Section SHALL mark the Standard tier as the primary recommended offer with a visible label distinguishing it from the Starter and Advanced tiers.
6. THE Institute_Outreach_Section SHALL display the yearly maintenance Add_On with the price range ₹8,000 to ₹15,000 per year.
7. THE Institute_Outreach_Section SHALL display the SEO Add_On and the admission-season landing pages Add_On, and SHALL display a label indicating that all Add_Ons are quoted separately from the Pricing_Tiers.
8. IF the pricing or tier data is unavailable from the content module when the Institute_Outreach_Section is rendered, THEN THE Institute_Outreach_Section SHALL display a message indicating that pricing is unavailable and SHALL NOT display any partial or placeholder tier price.

### Requirement 7: Navjeevan Portfolio Proof by Category

**User Story:** As the User, I want the Navjeevan portfolio proof shown and matched by category, so that I can present relevant credibility to each prospect.

#### Acceptance Criteria

1. THE Institute_Outreach_Section SHALL display each Portfolio_Proof link under a visible text label naming its associated Institute_Category, with exactly one labeled group per Institute_Category.
2. THE Institute_Outreach_Section SHALL include the following Portfolio_Proof links matched to their categories: MBA (https://navjeevanmba.com/); Trust/Foundation (https://navjeevannashik.org/ and https://navjeevanfoundationnashik.org/); Pharmacy college (https://navjeevanpharmacycollege.com/); Day school (https://navjeevandayschoolsinnar.com/); Science college (https://navjeevandayschoolsinnar.com/navjeevan-college-of-science/); School (https://navjeevanschoolnashik.com/); Law college (https://www.navjeevanlawcollege.com/).
3. WHEN the User activates a Portfolio_Proof link, THE Institute_Outreach_Section SHALL open the linked website in a new browser tab such that the new tab is not granted programmatic access to the originating page.
4. WHEN a Lead is displayed and that Lead Institute_Category matches one of the categories listed in Criterion 2, THE Institute_Outreach_Section SHALL present the matching Portfolio_Proof reference as the suggested proof for that Lead.
5. IF a Lead is displayed and that Lead Institute_Category has no matching Portfolio_Proof reference in Criterion 2, THEN THE Institute_Outreach_Section SHALL display all available Portfolio_Proof references as fallback and SHALL show a visible indication that no category-specific proof is available.

### Requirement 8: Outreach Scripts and Templates

**User Story:** As the User, I want copyable email and WhatsApp outreach templates, so that I can quickly reach out to prospects with proven messaging.

#### Acceptance Criteria

1. THE Institute_Outreach_Section SHALL display at least one Outreach_Template, and SHALL display each Outreach_Template with a visible label indicating its channel as either "email" or "WhatsApp".
2. WHERE an Outreach_Template contains placeholder tokens (for example, "[Institute Name]"), THE Institute_Outreach_Section SHALL display the placeholder tokens verbatim within the template text.
3. WHEN the User activates the copy control for an Outreach_Template, THE Institute_Outreach_Section SHALL copy the complete text of that Outreach_Template, including any placeholder tokens, to the system clipboard via the browser Clipboard API.
4. WHEN an Outreach_Template has been copied to the clipboard, THE Institute_Outreach_Section SHALL display a confirmation indication to the User within 1 second of the successful copy, and SHALL remove that confirmation indication within 5 seconds after it is displayed.
5. IF the clipboard copy operation fails, THEN THE Institute_Outreach_Section SHALL display an error indication to the User indicating that the copy did not succeed, and SHALL leave the displayed Outreach_Template text unchanged.

### Requirement 9: Pipeline Status Summary

**User Story:** As the User, I want a pipeline view summarizing where each lead stands, so that I can see my outreach progress at a glance.

#### Acceptance Criteria

1. THE Pipeline_View SHALL display a count of Leads for every defined Outreach_Status value, displaying a count of 0 for any Outreach_Status value that has no matching Leads.
2. WHEN the User changes the Outreach_Status of a Lead, THE Pipeline_View SHALL update the affected Outreach_Status counts to reflect the change without requiring a manual page reload or refresh action.
3. THE Pipeline_View SHALL derive its counts from the current Lead_Store state combined with the content seed data.
4. WHERE a City filter is applied, THE Pipeline_View SHALL compute all displayed counts from only the Leads matching the selected City.
5. WHEN no City filter is applied, THE Pipeline_View SHALL compute all displayed counts from all Leads in the Lead_Store combined with the content seed data.
6. THE Pipeline_View SHALL display the total count of Leads and a closed-won conversion figure expressed as the percentage of total Leads whose Outreach_Status equals the closed-won value, rounded to the nearest whole percent, displaying 0% when the total Lead count is 0.

### Requirement 10: Privacy and UI Conventions

**User Story:** As the User, I want the section to match the app's private, dark-themed, mobile-first conventions, so that it feels consistent and stays hidden from search engines.

#### Acceptance Criteria

1. WHEN the User has successfully passed the existing password gate, THE Institute_Outreach_Section SHALL render its content.
2. IF the User has not passed the existing password gate, THEN THE Institute_Outreach_Section SHALL remain unrendered and its content SHALL NOT be present in the delivered markup.
3. THE Institute_Outreach_Section SHALL apply the existing dark theme and UI conventions, reusing the shared UI primitives under `src/components/ui`, including glass panels, amber and rose accents, and lucide-react icons.
4. WHILE the dashboard is viewed on a viewport width of 767px or less, THE Institute_Outreach_Section SHALL present all of its content in a single-column layout with no horizontal scrolling.
5. WHILE the dashboard is viewed on a viewport width of 768px or greater, THE Institute_Outreach_Section SHALL apply the multi-column layout defined by the existing dashboard breakpoints.
6. THE Institute_Outreach_Section SHALL be excluded from search engine indexing by inheriting the existing noindex configuration of the app, adding no route, meta tag, or markup that overrides or removes that noindex directive.
