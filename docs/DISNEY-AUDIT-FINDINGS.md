# Disney Campaign Manager - QA Audit Findings

**Date:** November 10, 2026  
**Auditor:** Iana Grytsenko, Senior SDET (Playwright, TypeScript, Java)  
**Scope:** Authenticated Disney Campaign Manager tool (`dcm.disneyadvertising.com`), read-only exploratory audit. Signed in as the advertiser account holder. No campaign, report, payment method, or setting was created, edited, launched, or paid for. No creative was uploaded. No money was spent.

**Account state during audit:** No campaigns, no reports, no payment methods, no billing transactions. Reporting, billing, and campaign-list behavior could only be checked in their empty states.

**Maintenance banner:** "Disney Campaign Manager will be unavailable from 9:00 PM ET Friday, 11/13, through 12:00 AM ET Monday, 11/16."

## Summary

15 findings: 2 High, 6 Medium, 7 Low. No broken links, dead buttons, or layout overflow were found on the pages checked. The substantive issues are the blocked targeting, the mislabelled search fields, and the slow or blank loads.

## High

### DCM-001 - Core targeting is blocked while help says it is available
**Location:** Campaign builder, `/campaigns/create` (behind the "Setup Campaign Name" dialog).  
**Steps:** Campaigns > Create Campaign. Open the Targeting section.  
**Expected:** The targeting categories described in help ("Selecting targeting options") are usable: locations, audiences, genres. Or a clear explanation of which industry restriction applies.  
**Actual:** Location (City/State/DMA), ZIP Code, Audiences, and Genre are all disabled with the message "This targeting type is not allowed for your industry." Only Gender, Age Groups, and Devices remain usable. The builder never states the account's industry, and the Profile page lists Industry as "Media / Entertainment" with no link or explanation of the restriction or how to change it. Help only mentions limits for "Special, Political, or Mature Ads Categories", which does not match this account.

### DCM-002 - Transient login error after code verification
**Location:** `/org-switcher`, immediately after the email verification code was accepted.  
**Steps:** Sign in with email and password, enter the emailed verification code.  
**Expected:** Proceed to the dashboard.  
**Actual:** The page briefly showed "Error: Something went wrong during login process. Please reload page or try later." Reloading as suggested resolved it and the Campaigns dashboard loaded. Observed once; not reproduced a second time.

## Medium

### DCM-003 - Search boxes are labelled "Search Brands" on the wrong pages
**Location:** Campaigns list (during list loading) and Account > Users (`/account/users`).  
**Steps:** Open the Campaigns list or Account > Users and inspect the search field.  
**Expected:** The accessible name matches the visible label.  
**Actual:** The search field's accessible name is "Search Brands" while its visible placeholder is "Search Campaigns" / "Search Users". "Search Brands" is correct only on the Brands page, so this looks like a copy-paste error.

### DCM-004 - Help Center and Contact Us load as a blank white page with no loading indicator
**Location:** Help Center (`help.dcm.disneyadvertising.com/dcmhub/s/`) and Contact Us (`/s/contactsupport`), and navigating between help articles.  
**Steps:** Open the Help Center or Contact Us.  
**Expected:** A spinner or skeleton, or faster render. A blank page looks broken.  
**Actual:** Each showed a blank white page for roughly 10 to 15 seconds before content appeared.

### DCM-005 - Account pages load as a bare spinner for 10+ seconds, and Payment Methods shows a contradictory state
**Location:** Account Management > Profile (`/account/profile`), Payment Methods (`/account/paymentMethods`), Billing (`/account/billing`).  
**Steps:** Open any of the three pages.  
**Expected:** A loading state that resolves to content, with no contradictory messages.  
**Actual:** Each showed only a spinning loader for about 10 seconds. On Payment Methods, "No Payment Methods Available" and "Billings: No billing information available" were already visible while the table spinner was still spinning.

### DCM-006 - Notifications bell shows a green unread dot while the panel says there are none
**Location:** Header bell, all tool pages.  
**Steps:** Look at the header bell, then open the notifications panel.  
**Expected:** No unread indicator when there are no new notifications.  
**Actual:** The bell carries a green dot, its accessible name is "Notifications: no new notifications", and the open panel says "You currently have no in-platform notifications."

### DCM-007 - Create Report drawer shows irrelevant scheduling controls
**Location:** Reports > Create New Report (`/reports/<id>/report/create`).  
**Steps:** Open Create New Report with Delivery set to "Prepare for download" (on-demand).  
**Expected:** Frequency options hidden or disabled for an on-demand report, or an explanation.  
**Actual:** The Daily/Weekly/Monthly frequency radios are still shown with "Daily" pre-selected, while "Select User(s)" is disabled. The Start/End Date pickers are also disabled with no explanation of what enables them.

### DCM-008 — Creative Studio Beta first-visit modal has no visible way to dismiss it
**Location:** `studio.disneyadvertising.com` (opened from "Creative Studio Beta").  
**Steps:** Open Creative Studio Beta for the first time.  
**Expected:** A close (X) button or another dismiss control.  
**Actual:** A "Welcome to Disney Ad Creative Studio" modal with a black/empty video area, a Terms of Use checkbox, and a disabled "Continue" button, and no visible dismiss control. Terms were not accepted, so the studio itself was not audited past this modal.

## Low

### DCM-009 - Empty lists still show search, "Show 10 entries", and pagination controls
**Location:** Payment Methods, Billing (Transactions and Invoices views), Reports.  
**Actual:** Those controls render for zero rows.

### DCM-010 — Two identical "edit" buttons on the Profile page
**Location:** Account Management > Profile.  
**Actual:** Both have the accessible name "edit" only, so a screen-reader user cannot tell which edits Ad Account info vs. Contact info.

### DCM-011 — Contact Us support form has an unlabeled message box
**Location:** Contact Us support form.  
**Actual:** The textarea's accessible name is the generic "Textarea field with a placeholder", there is no visible label, and the form asks for no subject, category, or contact details, only free text (0/3000 characters) and an optional file upload, with a "Send" button.

### DCM-012 - Footer year mismatch and generic image alt text in help
**Location:** Help / Contact Us footer and the "Selecting targeting options" help article.  
**Actual:** The Help/Contact Us footer says "© 2025 Disney Advertising Sales, LLC" while the tool footer says "© 2026". All 10 images in the "Selecting targeting options" article have the generic alt text "image.png".

### DCM-013 — Campaigns empty state is inconsistent
**Location:** Campaigns dashboard, first load.  
**Actual:** On first load the page briefly shows a search box, filters, and table headers (Campaign Name, Budget, Status, etc.), then settles to a card with only "Create your first campaign!" and no list controls.

### DCM-014 — Org/account switcher search box has no accessible label
**Location:** Organization/account switcher.  
**Actual:** The search box has a placeholder only ("Search") and no accessible label. It also offers search for a single account.

### DCM-015 - Near-duplicate help links on Contact Us
**Location:** Contact Us resources.  
**Actual:** "Viewing transaction summary with invoices" and "Viewing invoice summary with invoices" appear as separate resources.

## Pages checked

- Public homepage: `https://www.disneycampaignmanager.com/`
- Sign-in and Campaigns dashboard: `https://dcm.disneyadvertising.com/` and authenticated Campaigns route
- Campaign builder: `/campaigns/create` (inspected behind the name dialog only; name never entered)
- Reports list and Create Report drawer (cancelled)
- Ad Gallery (Home and Assets views; ad upload not tested)
- Creative Studio Beta welcome modal only; terms not accepted
- Account Management: Profile, Payment Methods, Billing, Users, Brands (view only; no payment method added; Autopayment Threshold shown as $500.00)
- Help Center home, campaign creation article, targeting article, Contact Us and support form (not submitted)

## Evidence and limitations

These are observations from the audit session. The account had no campaigns, reports, payment methods, or transactions, so populated-state behavior and actual billing calculations were not tested. DCM-002 was observed once and is not yet a reproducible defect. DCM-001 needs confirmation with Disney support or account eligibility documentation before concluding that the behavior is incorrect for this advertiser account.
