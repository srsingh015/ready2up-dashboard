# Requirements Document

## Introduction

The Team Dashboard Access feature adds role-based access to the existing Ready2UP Growth Plan dashboard (see the `ready2up-growth-plan` spec). Today the dashboard is a private, single-user React + Vite + Tailwind + Recharts application that is a static, client-side-only build (localStorage persistence, no backend) protected by a single build-time password gate.

This feature extends that gate into three distinct roles, each with its own login password, so that a small team can use the same dashboard while the founder's personal content stays private. The three roles are Owner (the founder, who sees everything), Head of Product (who sees all company and operational content but not personal finances or personal goals), and Employee (who sees only the work-focused company content). Login routes each role to the content it is permitted to see, and content the role is not permitted to see is not presented.

Because the application ships as a static, client-side-only bundle, a password check runs entirely in the browser. This makes the role system a content-visibility gate rather than hardened, server-enforced security. To keep the founder's private content genuinely protected in the deployed bundle, this feature preserves and extends the existing build-time encryption approach: content is encrypted at build time, only ciphertext ships, and no plaintext password enters the deployed bundle. Content that a role is not permitted to see is not decryptable with that role's password. This feature integrates with the existing dashboard sections and trackers rather than replacing them.

## Glossary

- **Dashboard_App**: The existing Ready2UP Growth Plan React + Vite + Tailwind CSS application that this feature extends.
- **Access_Control_System**: The set of components added by this feature that authenticate a role, establish a session, and gate content visibility by role.
- **Login_Screen**: The UI presented before any content that collects a password and initiates role authentication.
- **Role**: A named access level. The defined roles are the Owner_Role, the Head_Role, and the Employee_Role.
- **Owner_Role**: The founder's role, authenticated by the password `kairaBaby@015`, permitted to view all content.
- **Head_Role**: The Head of Product / Tech Lead role, authenticated by the password `Head@Ready2UP`, permitted to view all Company_Content but not any Personal_Content.
- **Employee_Role**: The employee role, authenticated by the password `Ready2UP`, permitted to view only Work_Content.
- **Role_Password**: The password associated with a specific Role and used to authenticate as that Role.
- **Active_Session**: The persisted record of the currently authenticated Role on the device.
- **Content_Section**: A distinct, addressable area of dashboard content, as defined in the Ready2UP Growth Plan spec (for example: Goals, Income Streams, Roadmap, Monthly Milestones, Weekly Plans, Daily Routines, Client Acquisition, Outreach Scripts, Pricing, Smart Spending, Team & Hiring, Motivation, and the trackers).
- **Personal_Content**: The Content_Sections visible only to the Owner_Role: Goals/North Star, Income Tracker, Smart Spending, Daily Routines, and Motivation.
- **Company_Restricted_Content**: The Content_Sections visible to the Owner_Role and the Head_Role but not the Employee_Role: Pricing, Team & Hiring, and Income Streams strategy.
- **Work_Content**: The Content_Sections visible to all three Roles: Roadmap, Monthly Milestones, Weekly Plans, Client Acquisition, Outreach Scripts, and the task/checklist trackers.
- **Company_Content**: The union of Work_Content and Company_Restricted_Content; all content visible to the Head_Role.
- **Permitted_Content**: For a given Role, the set of Content_Sections that Role is allowed to view.
- **Navigation_Component**: The existing UI element that lists Content_Sections and lets the User move between them.
- **Persistence_Service**: The existing module that reads and writes state to the browser's localStorage.
- **Production_Build**: The static asset output produced by the Vite build process.
- **Deployed_Bundle**: The static assets served to the browser by the Production_Build.
- **Build_Time_Encryption**: The existing build step that encrypts content with AES-256-GCM using a key derived from a password, so that only ciphertext ships in the Deployed_Bundle.
- **User**: A person using the Dashboard_App who authenticates as one of the defined Roles.

## Requirements

### Requirement 1: Defined Roles and Credentials

**User Story:** As the founder, I want three named roles each with its own password, so that my team and I can log in at the access level appropriate to each person.

#### Acceptance Criteria

1. THE Access_Control_System SHALL define exactly three Roles: the Owner_Role, the Head_Role, and the Employee_Role.
2. WHEN a password is submitted that equals `kairaBaby@015`, THE Access_Control_System SHALL authenticate the session as the Owner_Role and grant Owner_Role access.
3. WHEN a password is submitted that equals `Head@Ready2UP`, THE Access_Control_System SHALL authenticate the session as the Head_Role and grant Head_Role access.
4. WHEN a password is submitted that equals `Ready2UP`, THE Access_Control_System SHALL authenticate the session as the Employee_Role and grant Employee_Role access.
5. THE Access_Control_System SHALL treat each Role_Password as case-sensitive and match the submitted password against it character-for-character with no trimming, whitespace removal, or other normalization applied.
6. IF a submitted password matches none of the three defined Role_Passwords exactly, THEN THE Access_Control_System SHALL reject the login attempt, retain no authenticated Role, grant no access, and display an error indication that the password is invalid.
7. IF the submitted password is empty (zero characters), THEN THE Access_Control_System SHALL reject the login attempt, grant no access, and display an error indication that a password is required.

### Requirement 2: Login and Role Resolution

**User Story:** As a team member, I want to enter a password and be taken to the right view, so that I can access the content I am allowed to see.

#### Acceptance Criteria

1. WHILE no Active_Session exists, THE Access_Control_System SHALL present the Login_Screen with a single password input that accepts 1 to 128 characters, and SHALL NOT present any Content_Section.
2. WHEN the User submits a password that exactly matches (case-sensitive) exactly one Role_Password, THE Access_Control_System SHALL establish an Active_Session for the matching Role within 1 second of submission.
3. IF the User submits a password that does not match any Role_Password, THEN THE Access_Control_System SHALL NOT establish an Active_Session, SHALL retain the Login_Screen, and SHALL present an error indication that the password is not recognized.
4. IF the User submits an empty password (0 characters), THEN THE Access_Control_System SHALL NOT attempt Role resolution and SHALL present an error indication that a password is required.
5. WHEN an Active_Session is established, THE Dashboard_App SHALL display only the Permitted_Content for the session's Role and SHALL NOT render or make navigable any Content_Section outside that Role's Permitted_Content.
6. WHEN an Active_Session is established, THE Dashboard_App SHALL display an initial Content_Section that is within the session Role's Permitted_Content.

### Requirement 3: Rejecting Invalid Credentials

**User Story:** As the founder, I want wrong passwords rejected, so that only people with a valid role password can enter the dashboard.

#### Acceptance Criteria

1. IF the User submits a password that matches no Role_Password, THEN THE Access_Control_System SHALL reject the attempt within 1 second and SHALL NOT establish an Active_Session.
2. IF the User submits a password that matches no Role_Password, THEN THE Login_Screen SHALL display, within 1 second of the rejection, a visible message indicating that the password was not accepted, and SHALL keep this message displayed until the User modifies the password input.
3. IF the User submits a password consisting of zero characters or only whitespace characters (spaces, tabs), THEN THE Access_Control_System SHALL treat it as an empty password, reject the attempt within 1 second, and SHALL NOT establish an Active_Session.
4. WHILE no Active_Session exists, THE Access_Control_System SHALL keep all Content_Section content withheld from display.
5. IF the User submits a password of more than 256 characters, THEN THE Access_Control_System SHALL reject the attempt within 1 second and SHALL NOT establish an Active_Session.
6. WHEN the Access_Control_System rejects an invalid or empty password, THE Login_Screen SHALL remain displayed and SHALL permit the User to submit a new password without limit on the number of attempts.

### Requirement 4: Owner Visibility

**User Story:** As the founder (Owner), I want to see everything, so that I retain full access to my personal and company content.

#### Acceptance Criteria

1. WHILE the Active_Session Role is the Owner_Role, THE Dashboard_App SHALL make every item in Personal_Content available for viewing without applying any role-based filtering or exclusion.
2. WHILE the Active_Session Role is the Owner_Role, THE Dashboard_App SHALL make every item in Company_Content available for viewing without applying any role-based filtering or exclusion.
3. WHILE the Active_Session Role is the Owner_Role, THE Navigation_Component SHALL present a selectable entry for every Content_Section, with no Content_Section omitted from the presented set.
4. WHEN the Owner_Role selects a Content_Section entry in the Navigation_Component, THE Dashboard_App SHALL display the corresponding Content_Section content within 2 seconds.
5. IF retrieval of any Personal_Content or Company_Content item fails while the Active_Session Role is the Owner_Role, THEN THE Dashboard_App SHALL display an indication identifying the affected item as unavailable and SHALL keep all successfully retrieved items available for viewing.
6. IF the Active_Session Role cannot be confirmed as the Owner_Role, THEN THE Dashboard_App SHALL withhold Personal_Content and Company_Content from viewing.

### Requirement 5: Head of Product Visibility

**User Story:** As the Head of Product, I want to see all company and operational content, so that I can run product and delivery without seeing the founder's personal information.

#### Acceptance Criteria

1. WHILE the Active_Session Role is the Head_Role, THE Dashboard_App SHALL make every Content_Section within Company_Content available for viewing — comprising all Work_Content (Roadmap, Monthly Milestones, Weekly Plans, Client Acquisition, Outreach Scripts, and the task/checklist trackers) and all Company_Restricted_Content (Pricing, Team & Hiring, and Income Streams strategy) — and SHALL render that Content_Section's content when it is selected.
2. WHILE the Active_Session Role is the Head_Role, THE Dashboard_App SHALL withhold all Personal_Content — comprising Goals/North Star, Income Tracker, Smart Spending, Daily Routines, and Motivation — from display, rendering no part of its content.
3. WHILE the Active_Session Role is the Head_Role, THE Navigation_Component SHALL present selectable entries only for Content_Sections within the Head_Role Permitted_Content and SHALL NOT present a selectable entry for any Personal_Content Content_Section.

### Requirement 6: Employee Visibility

**User Story:** As an employee, I want to see only the work-focused content I need, so that I can do my tasks without accessing pricing, hiring, income strategy, or personal information.

#### Acceptance Criteria

1. WHILE the Active_Session Role is the Employee_Role, THE Dashboard_App SHALL make all Work_Content available for viewing, comprising Roadmap, Monthly Milestones, Weekly Plans, Client Acquisition, Outreach Scripts, and the task/checklist trackers.
2. WHILE the Active_Session Role is the Employee_Role, THE Dashboard_App SHALL neither render nor make retrievable any Personal_Content, excluding it from all rendered views and from any data returned to the client.
3. WHILE the Active_Session Role is the Employee_Role, THE Dashboard_App SHALL neither render nor make retrievable any Company_Restricted_Content, comprising Pricing, Team & Hiring, and Income Streams strategy, excluding it from all rendered views and from any data returned to the client.
4. WHILE the Active_Session Role is the Employee_Role, THE Navigation_Component SHALL present selectable entries only for Content_Sections within the Employee_Role Permitted_Content, and SHALL omit navigation entries for all non-permitted Content_Sections.
5. IF a request is made under the Employee_Role to directly or deep-link access a Content_Section outside the Employee_Role Permitted_Content, THEN THE Dashboard_App SHALL deny the request, withhold the requested content, and return a response indicating the section is not accessible to the current role.

### Requirement 7: Role-to-Section Visibility Mapping

**User Story:** As the founder, I want a single authoritative mapping of which role sees which section, so that visibility rules stay consistent across the whole dashboard.

#### Acceptance Criteria

1. THE Access_Control_System SHALL classify Goals/North Star, Income Tracker, Smart Spending, Daily Routines, and Motivation as Personal_Content, and SHALL assign each of these sections to exactly one category.
2. THE Access_Control_System SHALL classify Pricing, Team & Hiring, and Income Streams strategy as Company_Restricted_Content, and SHALL assign each of these sections to exactly one category.
3. THE Access_Control_System SHALL classify Roadmap, Monthly Milestones, Weekly Plans, Client Acquisition, Outreach Scripts, and the task/checklist trackers as Work_Content, and SHALL assign each of these sections to exactly one category.
4. THE Access_Control_System SHALL define the Owner_Role Permitted_Content as all Personal_Content, all Company_Restricted_Content, and all Work_Content.
5. THE Access_Control_System SHALL define the Head_Role Permitted_Content as all Company_Restricted_Content and all Work_Content, and SHALL exclude all Personal_Content from the Head_Role Permitted_Content.
6. THE Access_Control_System SHALL define the Employee_Role Permitted_Content as all Work_Content, and SHALL exclude all Personal_Content and all Company_Restricted_Content from the Employee_Role Permitted_Content.
7. WHEN a role requests a Content_Section that is within that role's Permitted_Content, THE Access_Control_System SHALL grant access to the requested Content_Section.
8. IF a role requests a Content_Section that is not within that role's Permitted_Content, THEN THE Access_Control_System SHALL deny access to the requested Content_Section, return a response indicating the request is not permitted, and leave the Content_Section unmodified.
9. IF a requested Content_Section is not classified into any category, THEN THE Access_Control_System SHALL grant access only to the Owner_Role and deny access to all other roles.

### Requirement 8: Enforcement Against Unauthorized Access

**User Story:** As the founder, I want lower-privilege roles unable to reach content above their level, so that personal and restricted content stays private even if someone tries to navigate around the interface.

#### Acceptance Criteria

1. IF a Content_Section is outside the Active_Session Role's Permitted_Content, THEN THE Dashboard_App SHALL NOT render that Content_Section in any form, including full content, partial content, summary, or metadata.
2. WHEN a request or navigation action targets a Content_Section outside the Active_Session Role's Permitted_Content, THE Dashboard_App SHALL display the default Content_Section within the Role's Permitted_Content within 2 seconds of the action.
3. WHEN a request or navigation action targets a Content_Section outside the Active_Session Role's Permitted_Content, THE Dashboard_App SHALL present a visible indication to the user that the targeted content is inaccessible.
4. THE Access_Control_System SHALL exclude Personal_Content from every data payload delivered to a session whose Role is the Head_Role or the Employee_Role.
5. THE Access_Control_System SHALL exclude Company_Restricted_Content from every data payload delivered to a session whose Role is the Employee_Role.
6. IF the Active_Session Role is undetermined or invalid, THEN THE Access_Control_System SHALL restrict the session to the least-privileged Permitted_Content.

### Requirement 9: Session Persistence

**User Story:** As a team member, I want to stay logged in when I reopen the dashboard, so that I do not re-enter my password on every visit.

#### Acceptance Criteria

1. WHEN an Active_Session is established, THE Persistence_Service SHALL save the authenticated Role and a session-created timestamp to localStorage on the device within 1 second of authentication.
2. WHEN the Dashboard_App loads AND a saved Active_Session exists AND the elapsed time since the session-created timestamp is 30 days or less, THE Access_Control_System SHALL restore that Role and display its Permitted_Content without requiring re-entry of the Role_Password.
3. IF a saved Active_Session cannot be read, is malformed, or does not identify a defined Role, THEN THE Access_Control_System SHALL present the Login_Screen and remove the unreadable saved Active_Session from localStorage.
4. IF the elapsed time since the session-created timestamp exceeds 30 days, THEN THE Access_Control_System SHALL present the Login_Screen and remove the expired Active_Session from localStorage.
5. THE Persistence_Service SHALL store the Active_Session Role without storing any Role_Password on the device.

### Requirement 10: Logout and Role Switching

**User Story:** As a team member, I want to log out or switch roles, so that I can hand the device over or change access level without clearing browser data.

#### Acceptance Criteria

1. WHILE an Active_Session exists, THE Dashboard_App SHALL present a logout control on every Content_Section view.
2. WHEN the User activates the logout control, THE Access_Control_System SHALL end the Active_Session and remove the saved Role from localStorage within 1 second, while preserving all other browser-stored data.
3. WHEN the Active_Session is ended, THE Access_Control_System SHALL present the Login_Screen within 1 second and SHALL withhold all Content_Section content from display until a new Active_Session is established.
4. WHEN the User submits a Role_Password that matches a defined Role after logging out, THE Access_Control_System SHALL establish an Active_Session for the matched Role.
5. IF the User submits a Role_Password that matches no defined Role, THEN THE Access_Control_System SHALL reject the submission, present an error indication stating the password is not recognized, and retain the Login_Screen without establishing an Active_Session.
6. IF removal of the saved Role from localStorage fails during logout, THEN THE Access_Control_System SHALL still end the Active_Session, withhold all Content_Section content, and present the Login_Screen.

### Requirement 11: Build-Time Credential Handling

**User Story:** As the founder, I want role passwords kept out of the deployed files, so that shipping the dashboard does not expose the passwords or the protected content.

#### Acceptance Criteria

1. THE Deployed_Bundle SHALL NOT contain any Role_Password as plaintext or in any reversibly-encoded form that is recoverable without the encryption key.
2. WHEN the Production_Build runs, THE Production_Build SHALL apply Build_Time_Encryption so that Personal_Content is recoverable only with the Owner_Role credential.
3. WHEN the Production_Build runs, THE Production_Build SHALL apply Build_Time_Encryption so that Company_Restricted_Content is recoverable only with the Owner_Role credential or the Head_Role credential.
4. WHEN the Production_Build runs, THE Access_Control_System SHALL read Role_Passwords from a build-time source that is excluded from version control and from the Deployed_Bundle.
5. IF a required Role_Password is missing, empty, or unreadable at build time, THEN THE Production_Build SHALL fail before producing a Deployed_Bundle and SHALL emit an error indicating which Role_Password caused the failure.
6. WHEN the Production_Build finishes producing artifacts, THE Production_Build SHALL scan the Deployed_Bundle for any Role_Password value.
7. IF the post-build scan detects any Role_Password value in the Deployed_Bundle, THEN THE Production_Build SHALL fail and SHALL discard or block release of the Deployed_Bundle.

### Requirement 12: Security Limitation Acknowledgement

**User Story:** As the founder, I want to understand the limits of client-side gating, so that I share passwords appropriately and do not treat this as hardened security.

#### Acceptance Criteria

1. THE Access_Control_System SHALL perform Role authentication entirely within the browser without any backend server, without transmitting the Role_Password to a remote server, and without server-side validation.
2. THE Access_Control_System SHALL treat Role gating as content-visibility control only, such that Permitted_Content is present in the client and is hidden or shown rather than withheld by a server.
3. WHEN a User submits a Role_Password that exactly matches a defined Role's configured value, THE Access_Control_System SHALL grant that User access to that Role's Permitted_Content.
4. IF a User submits a Role_Password that does not match any defined Role's configured value, THEN THE Access_Control_System SHALL deny access to all Permitted_Content, retain the current gated state, and display an indication that the entered password was not accepted.
5. THE spec documentation SHALL state that any person who obtains a Role_Password can view that Role's Permitted_Content, that the Permitted_Content is retrievable from client-side source by a technically capable person regardless of the password, and that Role_Passwords are therefore to be shared only with intended recipients.

### Requirement 13: Integration with the Existing Dashboard

**User Story:** As the founder, I want role access added to my existing dashboard, so that all current sections, trackers, and styling keep working.

#### Acceptance Criteria

1. THE Access_Control_System SHALL reuse the existing Content_Sections and trackers of the Dashboard_App without adding any new Content_Section, and without removing or replacing any existing Content_Section or tracker definition.
2. WHEN the Dashboard_App displays a Content_Section within the Active_Session Role's Permitted_Content, THE Dashboard_App SHALL render that Content_Section using the same dark theme, Navigation_Component, and chart components present in the current build, with no visual or behavioral change from the current build.
3. WHILE the Active_Session Role permits a tracker, THE Persistence_Service SHALL persist that tracker's state as defined in the Ready2UP Growth Plan spec, retaining every previously stored state field for that tracker without loss.
4. WHILE the Active_Session Role is the Owner_Role, THE Dashboard_App SHALL present every Content_Section, tracker, theme, navigation entry, and chart that is present in the current build.
5. WHEN the User interacts with a tracker within the Active_Session Role's Permitted_Content, THE Dashboard_App SHALL provide the same tracker behavior defined for that tracker in the Ready2UP Growth Plan spec.
6. IF a Content_Section or tracker is outside the Active_Session Role's Permitted_Content, THEN THE Persistence_Service SHALL preserve any previously stored state for that Content_Section or tracker so that the state remains available when a Role permitted to view it authenticates.
