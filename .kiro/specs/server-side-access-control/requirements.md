# Requirements Document

## Introduction

The Server-Side Access Control feature re-architects the Ready2UP Growth Plan dashboard's access control from client-side tiered encryption (the existing `team-dashboard-access` spec) to true server-side authentication and authorization. Today the dashboard is a static React + Vite + Tailwind + Recharts single-page application deployed on Vercel, and role gating is enforced cryptographically in the browser: all plan content ships (encrypted) in the bundle, and a role's password decrypts only that role's tier. That approach guarantees content-visibility but is not hardened security — a technically capable person can extract any tier whose password they hold, and all content physically ships to every browser.

This feature moves the source of truth for plan content into the project's existing Supabase Postgres database and enforces authorization with Supabase Row-Level Security (RLS) keyed to the authenticated user's role. The browser only ever receives the rows the authenticated role is permitted to see; content a role may not view is never transmitted to that browser, verifiable in the browser's network inspector. Authentication uses Supabase Auth with a password-only login: the user types only a password, the account email is supplied from a non-secret environment variable, and Supabase validates the password server-side against the hashed credential. No login password is ever embedded in the deployed bundle or in any build-time-inlined environment variable.

There are two roles: the Owner_Role (Saurabh and Kaira, account `dragosaurabh@gmail.com`), who sees all content, and the Employee_Role (the Ready2UP team, account `ready2up.in@gmail.com`), who sees a limited professional subset. The design is required to leave room for adding individual per-person employee accounts later without changing the authorization model. This feature supersedes the client-side tiered encryption approach for content delivery: once content is served from Supabase under RLS, the encrypted-payload content pipeline is retired.

## Glossary

- **Dashboard_App**: The existing Ready2UP Growth Plan React + Vite + Tailwind + Recharts single-page application deployed on Vercel that this feature re-architects.
- **Auth_Service**: The existing Supabase Auth service that stores user accounts, hashes passwords, validates credentials server-side, and issues session tokens (JWTs).
- **Content_Store**: The Supabase Postgres database that holds the plan content as the source of truth for this feature.
- **Authorization_Layer**: The Supabase Row-Level Security (RLS) policies that decide, per authenticated user, which Content_Store rows may be returned to that user's browser.
- **Login_Screen**: The UI presented before any content that collects a password and initiates authentication.
- **Role**: A named server-side access level. The defined roles are the Owner_Role and the Employee_Role.
- **Owner_Role**: The founder role (Saurabh and Kaira), backed by the Supabase account with email `dragosaurabh@gmail.com`, permitted to view all content.
- **Employee_Role**: The Ready2UP team role, backed by the Supabase account with email `ready2up.in@gmail.com`, permitted to view only Employee_Content.
- **Role_Attribute**: The server-side representation of a user's Role (for example a `role` column in a profiles table or a JWT/`app_metadata` claim) that the Authorization_Layer references when deciding access.
- **Account_Email**: A predefined, non-secret email address that identifies a Supabase account, supplied to the Dashboard_App through a `VITE_`-prefixed environment variable.
- **Login_Password**: The password a User types on the Login_Screen; it is validated server-side by the Auth_Service and is never stored in the Dashboard_App source, bundle, or any environment variable.
- **Active_Session**: The Supabase Auth session (access token plus refresh token) persisted on the device that represents the currently authenticated User and Role.
- **Content_Section**: A distinct, addressable area of dashboard content (for example: Overview, 24-Month Roadmap, Monthly Plans, Daily/Weekly Rhythm, Focus Mode, Client Channels, Client Onboarding, Operating Principles, Trackers, Goals/North Star, Income Streams, Pricing, Scripts & Templates, Institute Outreach, Brand Playbook, Content Plan, Properties, Dubai, Settle/Wealth, Partnerships, and personal "Us/Kaira/Me" content).
- **Employee_Content**: The Content_Sections the Employee_Role is permitted to view: the 24-Month Roadmap, Monthly Plans, the weekly and monthly portions of the Daily/Weekly Rhythm, Focus Mode, Client Channels, Client Onboarding, and Operating Principles.
- **Money_Figure**: Any revenue range, revenue target, MRR value, monetary KPI, or team-size figure contained within the 24-Month Roadmap or Monthly Plans.
- **Owner_Content**: All Content_Sections and data fields that are not part of Employee_Content, including every Money_Figure, the Overview, Trackers, Goals/North Star, Income Streams, Pricing, Scripts & Templates, Institute Outreach, Brand Playbook, Content Plan, Properties, Dubai, Settle/Wealth, Partnerships, the personal daily routine, all personal "Us/Kaira/Me" content, the personal welcome overlay, and the "Building to ₹5CR" badge.
- **Permitted_Content**: For a given Role, the set of Content_Store data that Role is authorized to receive.
- **Navigation_Component**: The existing UI element that lists Content_Sections and lets the User move between them.
- **Tracker**: An existing interactive stateful widget whose per-user state is synchronized via the existing cloud-sync/localStorage mechanism.
- **Production_Build**: The static asset output produced by the Vite build process.
- **Deployed_Bundle**: The static JavaScript, CSS, and asset files served to the browser by the Production_Build.
- **Public_Env_Var**: A `VITE_`-prefixed environment variable whose value is inlined into the Deployed_Bundle at build time and is therefore public.
- **Security_Headers_Config**: The Vercel configuration (`vercel.json`) that sets HTTP response security headers for the deployed Dashboard_App.
- **User**: A person using the Dashboard_App who authenticates through the Auth_Service.

## Requirements

### Requirement 1: Password-Only Authentication via Predefined Accounts

**User Story:** As a team member, I want to log in by typing only a password, so that I can access the dashboard without knowing or typing an account email.

#### Acceptance Criteria

1. WHILE no Active_Session exists, THE Login_Screen SHALL present a single password input and SHALL NOT present an email input or any Content_Section.
2. THE Dashboard_App SHALL obtain each Account_Email from a Public_Env_Var and SHALL NOT require the User to type an Account_Email.
3. WHEN the User submits a non-empty Login_Password of at most 72 characters, THE Dashboard_App SHALL request server-side credential validation from the Auth_Service using a predefined Account_Email and the submitted Login_Password.
4. WHEN a submitted Login_Password validates against the Auth_Service account whose Account_Email is the Owner_Role account, THE Auth_Service SHALL establish an Active_Session authenticated as the Owner_Role.
5. WHEN a submitted Login_Password validates against the Auth_Service account whose Account_Email is the Employee_Role account, THE Auth_Service SHALL establish an Active_Session authenticated as the Employee_Role.
6. WHEN the Dashboard_App attempts validation against more than one predefined Account_Email for a single submitted Login_Password, THE Dashboard_App SHALL evaluate the predefined Account_Emails in a fixed order, SHALL establish exactly one Active_Session for the first account whose credential validates, and SHALL NOT attempt the remaining Account_Emails after a match.
7. THE Auth_Service SHALL treat each Login_Password as case-sensitive and validate it against the stored hashed credential with no trimming, whitespace removal, or other normalization applied by the Dashboard_App.
8. IF the User submits an empty or whitespace-only Login_Password, THEN THE Dashboard_App SHALL reject the submission without requesting Auth_Service validation, SHALL retain the Login_Screen, and SHALL present an error indication that a password is required.
9. IF the submitted Login_Password validates against none of the predefined Account_Emails, THEN THE Dashboard_App SHALL NOT establish an Active_Session, SHALL retain the Login_Screen with the password input cleared, and SHALL present an error indication that authentication failed.
10. IF the Auth_Service is unavailable or does not return a validation result within 10 seconds, THEN THE Dashboard_App SHALL NOT establish an Active_Session, SHALL retain the Login_Screen, and SHALL present an error indication that login could not be completed.

### Requirement 2: Rejecting Invalid Credentials

**User Story:** As the founder, I want wrong passwords rejected server-side, so that only people with a valid account password can enter the dashboard.

#### Acceptance Criteria

1. IF a submitted Login_Password validates against no predefined Auth_Service account, THEN THE Dashboard_App SHALL establish no Active_Session, SHALL retain the Login_Screen, and SHALL display an indication that the password was not accepted.
2. IF the submitted Login_Password is empty or consists only of whitespace characters, THEN THE Dashboard_App SHALL NOT send a validation request to the Auth_Service and SHALL display an indication that a password is required.
3. WHILE no Active_Session exists, THE Dashboard_App SHALL withhold all Content_Section content from display.
4. WHEN the Dashboard_App rejects a Login_Password, THE Login_Screen SHALL keep the rejection indication displayed until the User modifies the password input.
5. WHEN the Dashboard_App rejects a Login_Password, THE Login_Screen SHALL remain displayed and SHALL permit the User to submit a new Login_Password without imposing a client-side limit on the number of submission attempts.
6. IF the Auth_Service rejects a validation request because its rate limit has been exceeded, THEN THE Dashboard_App SHALL establish no Active_Session, SHALL retain the Login_Screen, and SHALL display an indication that too many attempts have occurred and that the User should retry later.
7. IF the Dashboard_App cannot obtain a validation result from the Auth_Service, THEN THE Dashboard_App SHALL establish no Active_Session, SHALL retain the Login_Screen, and SHALL display an indication that the password could not be verified.

### Requirement 3: Server-Side Role Representation

**User Story:** As the founder, I want each user's role stored and enforced on the server, so that authorization does not depend on anything the browser can alter.

#### Acceptance Criteria

1. THE Auth_Service SHALL define exactly two Roles: the Owner_Role and the Employee_Role, and SHALL reject any Role_Attribute value that is not one of these two Roles.
2. THE Content_Store SHALL represent each authenticated User's Role in a server-side Role_Attribute, persisted in the profiles table role column or the authenticated session token's app_metadata claim, that the Authorization_Layer references for every access decision.
3. WHEN an Active_Session is established, THE Authorization_Layer SHALL determine the session's Role from the server-side Role_Attribute associated with the authenticated account.
4. IF an authenticated account has no assigned Role_Attribute or holds a value that is neither the Owner_Role nor the Employee_Role, THEN THE Authorization_Layer SHALL deny access to all Content_Store rows that are not designated public.
5. THE Authorization_Layer SHALL derive access decisions solely from the server-side Role_Attribute and SHALL NOT derive access decisions from any value supplied by the browser other than the authenticated session token.
6. IF a request carries no valid Active_Session, THEN THE Authorization_Layer SHALL deny access to all Content_Store rows that are not designated public.

### Requirement 4: Content Migration to the Server

**User Story:** As the founder, I want the plan content stored in the database as the source of truth, so that the server controls what each browser receives instead of shipping all content in the bundle.

#### Acceptance Criteria

1. THE Content_Store SHALL hold the plan content that the Dashboard_App renders as the authoritative source of that content.
2. WHEN the Dashboard_App renders a Content_Section, THE Dashboard_App SHALL retrieve that Content_Section's data from the Content_Store over a request carrying the Active_Session token, and SHALL display the retrieved content within 2 seconds of receiving a successful response.
3. THE Content_Store SHALL associate each content record with the Role classification (Owner_Role or Employee_Role) that governs its visibility.
4. THE Deployed_Bundle SHALL NOT contain the Owner_Content plan content as bundled data in plaintext or in any reversibly-encoded form.
5. IF the Content_Store does not return a Content_Section's data within 10 seconds of the retrieval request, THEN THE Dashboard_App SHALL treat the Content_Store as unreachable, present an indication that the content is temporarily unavailable, retain the Active_Session, and leave any previously retrieved Content_Section content unmodified.
6. IF a retrieval request for a Content_Section returns an error response, THEN THE Dashboard_App SHALL present an indication that the content is temporarily unavailable, retain the Active_Session, and withhold no previously retrieved Content_Section content from display.

### Requirement 5: Server-Enforced Authorization

**User Story:** As the founder, I want the server to send each browser only the content its role may see, so that restricted content never reaches an unauthorized device.

#### Acceptance Criteria

1. WHEN a request authenticated as the Employee_Role retrieves content from the Content_Store, THE Authorization_Layer SHALL return only the rows the Employee_Role is permitted to access and SHALL exclude every Owner_Content row from the response.
2. WHEN a request authenticated as the Owner_Role retrieves content from the Content_Store, THE Authorization_Layer SHALL return all Permitted_Content for the Owner_Role.
3. IF a request authenticated as the Employee_Role attempts to retrieve any Owner_Content record, THEN THE Authorization_Layer SHALL exclude that record from the result set such that zero Owner_Content records are present in the response.
4. WHEN the Authorization_Layer returns a response to an Employee_Role session, THE Authorization_Layer SHALL ensure the response transmitted to the browser contains no Owner_Content in any representation, including full content, partial content, summary, and metadata.
5. THE Authorization_Layer SHALL evaluate and apply the role-based access decision on the server before any content is transmitted, such that Owner_Content withheld from an Employee_Role is never included in the transmitted payload and is not dependent on any browser-side filtering.
6. IF a request to retrieve content from the Content_Store is not authenticated or carries a role that is neither the Owner_Role nor the Employee_Role, THEN THE Authorization_Layer SHALL return zero content records and SHALL return a response indicating the request is not authorized, while leaving the Content_Store unchanged.

### Requirement 6: Employee Content Visibility

**User Story:** As an employee, I want to see only the professional planning content I need, so that I can do my work without accessing revenue figures, personal, or strategic content.

#### Acceptance Criteria

1. WHILE the Active_Session Role is the Employee_Role, THE Authorization_Layer SHALL make available exactly these 7 Content_Sections and no others: the 24-Month Roadmap, Monthly Plans, the weekly and monthly portions of the Daily/Weekly Rhythm, Focus Mode, Client Channels, Client Onboarding, and Operating Principles.
2. WHILE the Active_Session Role is the Employee_Role, THE Authorization_Layer SHALL withhold the personal daily routine portion of the Daily/Weekly Rhythm and SHALL return only the weekly and monthly portions.
3. WHILE the Active_Session Role is the Employee_Role, THE Navigation_Component SHALL present selectable entries only for the 7 Content_Sections within Employee_Content and SHALL omit navigation entries for all other Content_Sections.
4. WHILE the Active_Session Role is the Employee_Role, THE Dashboard_App SHALL NOT render the personal welcome overlay and SHALL NOT render the "Building to ₹5CR" badge.
5. WHEN the Employee_Role selects a Content_Section within Employee_Content, THE Dashboard_App SHALL render that Content_Section's content.
6. IF the Employee_Role requests a Content_Section outside Employee_Content, THEN THE Authorization_Layer SHALL deny the request, SHALL NOT return the requested content, and SHALL return a response indicating the section is not accessible.

### Requirement 7: Money-Figure Redaction for Employees

**User Story:** As the founder, I want revenue and money figures removed from the employee view of the roadmap and monthly plans, so that the team sees the plan without seeing the financial targets.

#### Acceptance Criteria

1. WHILE the Active_Session Role is the Employee_Role, THE Authorization_Layer SHALL exclude every Money_Figure — comprising every revenue range, revenue target, MRR value, monetary KPI, and team-size figure — from the 24-Month Roadmap data on the server before transmission to the browser.
2. WHILE the Active_Session Role is the Employee_Role, THE Authorization_Layer SHALL exclude every Money_Figure — comprising every revenue range, revenue target, MRR value, monetary KPI, and team-size figure — from the Monthly Plans data on the server before transmission to the browser.
3. WHEN the Authorization_Layer returns 24-Month Roadmap or Monthly Plans data to an Employee_Role session, THE Authorization_Layer SHALL ensure the response contains no revenue range, revenue target, MRR value, monetary KPI, or team-size figure, while retaining all non-Money_Figure content of those sections.
4. WHILE the Active_Session Role is the Owner_Role, THE Authorization_Layer SHALL include every Money_Figure in the 24-Month Roadmap and Monthly Plans data returned to the browser, applying no Money_Figure exclusion.
5. IF the Authorization_Layer cannot classify whether a field of the 24-Month Roadmap or Monthly Plans is a Money_Figure for an Employee_Role session, THEN THE Authorization_Layer SHALL withhold that field from the response rather than transmit it.

### Requirement 8: Owner Content Visibility

**User Story:** As the founder (Owner), I want to see everything, so that I retain full access to my personal, financial, and strategic content.

#### Acceptance Criteria

1. WHILE the Active_Session Role is the Owner_Role, THE Authorization_Layer SHALL make every Content_Section available for viewing without applying any role-based filtering or exclusion.
2. WHILE the Active_Session Role is the Owner_Role, THE Navigation_Component SHALL present a selectable entry for every Content_Section, with no Content_Section omitted from the presented set.
3. WHEN the Owner_Role selects a Content_Section entry in the Navigation_Component, THE Dashboard_App SHALL display the corresponding Content_Section content within 2 seconds of the selection.
4. WHILE the Active_Session Role is the Owner_Role, THE Dashboard_App SHALL render every monetary figure without redaction, masking, or omission of any digits.
5. WHILE the Active_Session Role is the Owner_Role, THE Dashboard_App SHALL render the personal welcome overlay and the "Building to ₹5CR" badge on initial authenticated load within 2 seconds.
6. WHILE the Active_Session Role is the Owner_Role, THE Authorization_Layer SHALL make available the Overview, Trackers, Goals/North Star, Income Streams, Pricing, Scripts & Templates, Institute Outreach, Brand Playbook, Content Plan, Properties, Dubai, Settle/Wealth, Partnerships, the personal daily routine, and all personal "Us/Kaira/Me" content, omitting none of these sections.
7. IF the Active_Session Role is not the Owner_Role, is undetermined, or is invalid, THEN THE Authorization_Layer SHALL withhold all Owner_Content from display, rendering no part of its content, and SHALL restrict the session to the least-privileged Permitted_Content.
8. IF retrieval of any Owner_Content item fails while the Active_Session Role is the Owner_Role, THEN THE Dashboard_App SHALL display an indication identifying the affected item as unavailable and SHALL keep all successfully retrieved items available for viewing.

### Requirement 9: Session Persistence

**User Story:** As a team member, I want to stay logged in when I reopen the dashboard, so that I do not re-enter my password on every visit.

#### Acceptance Criteria

1. WHEN an Active_Session is established, THE Auth_Service SHALL persist the session on the device using the configured persistent session storage under the designated storage key, retaining the access token and refresh token but excluding the Login_Password.
2. WHEN the Dashboard_App loads AND a valid unexpired Active_Session exists on the device, THE Dashboard_App SHALL restore that session and its associated Role and SHALL grant access to Content_Section content without displaying the Login_Screen and without requiring re-entry of the Login_Password.
3. WHILE an Active_Session is active, THE Auth_Service SHALL automatically attempt to refresh the session's access token before the access token expires so that the session remains valid without user re-authentication.
4. IF a persisted Active_Session is expired, or if an automatic token refresh attempt fails, THEN THE Dashboard_App SHALL present the Login_Screen and SHALL withhold all Content_Section content until a new Active_Session is established.
5. WHEN the Dashboard_App loads AND no valid Active_Session exists on the device, THE Dashboard_App SHALL present the Login_Screen and SHALL withhold all Content_Section content until a new Active_Session is established.
6. THE Dashboard_App SHALL NOT persist any Login_Password on the device in any storage location.

### Requirement 10: Logout

**User Story:** As a team member, I want to log out, so that I can hand the device over or end my session without clearing browser data.

#### Acceptance Criteria

1. WHILE an Active_Session exists, THE Dashboard_App SHALL display a logout control that is visible and selectable on every Content_Section.
2. WHEN the User activates the logout control, THE Auth_Service SHALL end the Active_Session and remove the persisted session from the device within 5 seconds.
3. WHEN the Active_Session is ended, THE Dashboard_App SHALL present the Login_Screen within 2 seconds and SHALL withhold all Content_Section content until a new Active_Session is established.
4. IF ending the Active_Session encounters an error, THEN THE Auth_Service SHALL remove the persisted session from the device, AND THE Dashboard_App SHALL present the Login_Screen within 2 seconds, withhold all Content_Section content, and display a message indicating that the session was ended locally.
5. WHILE no Active_Session exists, THE Dashboard_App SHALL withhold all Content_Section content and SHALL require a new Active_Session before any Content_Section is displayed.

### Requirement 11: No Secrets in the Client Bundle

**User Story:** As the founder, I want login passwords kept out of the deployed files, so that shipping the dashboard cannot expose any account password.

#### Acceptance Criteria

1. THE Deployed_Bundle SHALL NOT contain any Login_Password in plaintext or in any reversibly-encoded form, including base64, hexadecimal, or URL encoding.
2. THE Dashboard_App SHALL store each Login_Password only in the Auth_Service as a server-side hashed credential.
3. THE Dashboard_App SHALL restrict Public_Env_Var values to exactly the following non-secret values: the Supabase project URL, the Supabase anon key, and Account_Email addresses.
4. THE Dashboard_App SHALL NOT place any Login_Password value in any Public_Env_Var.
5. WHEN the Production_Build finishes producing artifacts, THE Production_Build SHALL scan every file in the Deployed_Bundle for each known Login_Password value in both plaintext and reversibly-encoded forms.
6. IF the post-build scan detects one or more Login_Password values in any file of the Deployed_Bundle, THEN THE Production_Build SHALL terminate with a failure status, SHALL block release of the Deployed_Bundle, and SHALL report each file in which a Login_Password value was detected.
7. WHEN the post-build scan completes with zero Login_Password values detected across all files of the Deployed_Bundle, THE Production_Build SHALL complete with a success status and permit release of the Deployed_Bundle.

### Requirement 12: Production Security Hardening

**User Story:** As the founder, I want the deployed dashboard to enforce transport and browser security controls, so that the application is protected in production on Vercel.

#### Acceptance Criteria

1. WHEN the Dashboard_App is served in production and a request is received over HTTP, THE Security_Headers_Config SHALL redirect the request to the equivalent HTTPS URL of the same host and path.
2. WHEN the Dashboard_App serves a response in production, THE Security_Headers_Config SHALL include a Content-Security-Policy response header that restricts resource loading to the application's own origin by default.
3. WHEN the Dashboard_App serves a response in production, THE Security_Headers_Config SHALL include a frame-ancestors directive or an X-Frame-Options response header that prevents the Dashboard_App from being framed by any origin other than its own.
4. WHEN the Dashboard_App serves a response in production, THE Security_Headers_Config SHALL include a Strict-Transport-Security response header with a max-age of at least 31536000 seconds.
5. WHEN the Dashboard_App serves a response in production, THE Security_Headers_Config SHALL include an X-Content-Type-Options response header with the value `nosniff`.
6. WHEN the Dashboard_App serves a response in production, THE Security_Headers_Config SHALL include a Referrer-Policy response header with a value that suppresses the referrer for cross-origin requests (`strict-origin-when-cross-origin` or stricter).
7. THE Security_Headers_Config SHALL declare the security headers through the Vercel configuration file (`vercel.json`) rather than through an Apache `.htaccess` file.

### Requirement 13: Login Attack Protection

**User Story:** As the founder, I want repeated wrong-password attempts to be throttled and the owner account to support stronger authentication, so that the accounts resist brute-force and unauthorized access.

#### Acceptance Criteria

1. WHEN the number of failed authentication attempts for the same account reaches 5 within a 15-minute window, THE Auth_Service SHALL reject subsequent authentication attempts for that account for a lockout period of at least 15 minutes.
2. WHERE multi-factor authentication is enabled for the Owner_Role account, WHEN valid primary credentials are submitted, THE Auth_Service SHALL require the additional authentication factor before establishing an Owner_Role Active_Session.
3. IF the Auth_Service rejects a login attempt due to rate limiting, THEN THE Dashboard_App SHALL present an indication that the User should retry after the lockout period elapses, AND SHALL NOT establish an Active_Session.
4. IF the additional authentication factor submitted for the Owner_Role account is invalid, THEN THE Auth_Service SHALL reject the login attempt, SHALL NOT establish an Active_Session, and THE Dashboard_App SHALL present an indication that the authentication factor was incorrect.

### Requirement 14: Tracker State Gated to the Owner

**User Story:** As the founder, I want the trackers restricted to the owner while keeping their existing cloud sync, so that per-user tracker state stays private and continues to work.

#### Acceptance Criteria

1. WHILE the Active_Session Role is the Employee_Role, THE Authorization_Layer SHALL exclude all Tracker content from every server response payload and SHALL NOT include any Tracker data, values, or metadata in data returned to the browser.
2. WHILE the Active_Session Role is the Owner_Role, THE Dashboard_App SHALL present the Trackers to the Owner_Role User within 2 seconds of Dashboard load.
3. WHEN an Owner_Role User creates, updates, or deletes Tracker state, THE Dashboard_App SHALL persist the changed per-user Tracker state through the existing cloud-sync mechanism within 5 seconds and SHALL preserve the existing Tracker behavior for that interaction.
4. IF the Active_Session Role is not the Owner_Role, THEN THE Authorization_Layer SHALL deny retrieval of Owner-scoped Tracker state, SHALL return a response indicating the request is not authorized, and SHALL NOT include any Owner-scoped Tracker data in the response.
5. IF the cloud-sync persistence of Owner-scoped Tracker state fails, THEN THE Dashboard_App SHALL retain the last successfully persisted Tracker state, SHALL surface an indication to the Owner_Role User that the sync did not complete, and SHALL retry persistence up to 3 attempts.

### Requirement 15: Migration and Coexistence with Client-Side Encryption

**User Story:** As the founder, I want the new server-side model to replace the old client-side encryption for content, so that content is no longer shipped to every browser.

#### Acceptance Criteria

1. WHEN the Dashboard_App retrieves and renders any Content_Section from the Content_Store under the Authorization_Layer, THE Dashboard_App SHALL obtain that Content_Section's data solely from the authenticated Content_Store response and SHALL NOT execute any client-side decryption of an encrypted content payload defined in the `team-dashboard-access` spec.
2. THE Deployed_Bundle SHALL NOT contain the encrypted content payload defined in the `team-dashboard-access` spec in plaintext, encrypted, or any other encoded form.
3. THE Dashboard_App SHALL determine which Content_Sections and content records are visible for the Active_Session Role solely from the responses returned by the Authorization_Layer and SHALL NOT derive Role visibility from client-side decryption of tiered content.
4. WHERE the Content_Store has not yet been populated with a requested Content_Section's data, THE Dashboard_App SHALL present an indication that the content is unavailable, SHALL retain the Active_Session, and SHALL NOT render or attempt to decrypt any bundled encrypted content as a fallback.
5. WHEN the Production_Build finishes producing artifacts, THE Production_Build SHALL scan the Deployed_Bundle for the encrypted content payload defined in the `team-dashboard-access` spec.
6. IF the post-build scan detects the encrypted content payload in the Deployed_Bundle, THEN THE Production_Build SHALL fail and SHALL block release of the Deployed_Bundle.

### Requirement 16: Extensibility for Individual Accounts

**User Story:** As the founder, I want the option to add individual employee accounts later, so that we can move from a shared employee login to per-person logins without redesigning access control.

#### Acceptance Criteria

1. THE Authorization_Layer SHALL derive every access decision from the value of the Role_Attribute rather than from a specific Account_Email, such that any account whose Role_Attribute equals Employee_Role is granted identical access.
2. WHEN an additional account is added to the Auth_Service with its Role_Attribute set to Employee_Role, THE Authorization_Layer SHALL grant that account access to the Employee_Content without any modification to the existing authorization policies.
3. THE Content_Store SHALL allow between 1 and 50 accounts holding the Employee_Role to be authenticated and to access the Employee_Content concurrently.
4. IF an account's Role_Attribute is changed so that it no longer equals Employee_Role, THEN THE Authorization_Layer SHALL deny that account subsequent access to the Employee_Content while leaving access for all remaining Employee_Role accounts unchanged.
