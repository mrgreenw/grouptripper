# Features and boundaries

GroupTripper generalizes the planning flow of a private group trip without distributing its guests, private history, deployment credentials, pictures, destination portraits, or private renderer credentials and runtime configuration.

## Included

- Hosted new-trip starters for family reunions, golf, girls’/boys’ weekends, bachelor/bachelorette parties, birthdays, and a custom trip. Theme options prefill editable settings only. Dates and destination categories are examples to review, not bookings or researched recommendations. Custom trips use the organizer’s dates and first place.

- Browser-isolated fictional example with six sample guests, sample choices, plans, a message and a shared house-deposit expense. Visitors add a fictional nickname; no account or personal contact information is required for the tour.
- Organizer intake, JSON import/export, configurable trip types, date ranges, destinations, activities, budget choices, room preferences and enabled tools.
- Guided RSVP → Dates → Places → Accommodations → My ballot. Calendar availability toggles and date preference rankings; theme-aware activity sliders and automatic top-five destination suggestions; drag/touch, arrow and manual-number ranking controls; reset actions, room/budget fit warnings, and guest voting status. Sliders sort all nominated places and never filter them out. Guests can nominate places directly from Places.
- Leading date/destination summaries, a calendar shaded by availability and preference, and destination/activity/budget/room bar charts. Both ballots unlock group results; other guests’ vote/preferences fields are also redacted from the guest API until then. RSVP and submission status stay visible to all members. Guests RSVP'd Out are excluded; unanswered is different from unavailable.
- Travel notes, meals, groceries, itinerary and messages. Plans can be marked done by their author or the organizer.
- Shared USD expenses split equally among everyone or selected people. Saved participant lists stay fixed. Exact integer cents, individual share breakdowns, net balances, and a suggested who-pays-whom plan. Expense removal is reversible. Submitters and the organizer may edit.
- A real shared-mode backend with D1 storage, scrypt password hashes, hashed random session tokens, HttpOnly/SameSite cookies, same-origin mutations, auth rate limiting, and revision checks to reject stale updates.
- A full public source template, migrations, automated tests and setup instructions. A donation is optional, never an access requirement.

## Deliberate limits

- Shared hosted mode supports separate groups, up to 50 guests per trip and five trips per account. The trip creator is its organizer. Membership checks gate every shared read/write, including shirt assets. Legacy live mode remains one trip per deployment.
- Up to 12 date choices and 12 destination choices; 500 expenses, 300 plans and 300 messages per trip. These are bounded small-group tools.
- USD and equal splits only. No currency conversion, payment collection, payment requests sent automatically, or recording completed repayments. Don't enter a reimbursement as a new expense: that double-counts costs.
- Refresh the shared trip to see other users' changes. Conflicting writes are rejected rather than overwriting newer data. Save drafts before leaving the page.
- Date ranges and destination choices are configurable. Destination fit is a weighted match using illustrative starter profiles or ratings supplied by the organizer/nominee, not researched city assessments. Unrated places remain visible and eligible for voting. No live travel search, flight availability, bookings, weather lookup, crime rankings or maps. Shirt Studio is included with a separately paired renderer; it is not an online image-generation service bundled with every copied deployment.
- No email/SMS notifications, guest contact collection, file uploads or automated recovery messages. Hosted-demo recovery uses a verified site-owner-issued link after the owner confirms the person’s identity. Organizers should maintain appropriate backups through their hosting provider and agree on guest-account support before inviting a group.
- Guest responses, names, plans and expenses are visible to signed-in trip members and, in the hosted demo, its verified site owner through a separate admin dashboard. Do not use it for sensitive financial records; record shared trip costs only. The hosted demo saves real test accounts and trip records in its own database. Browser-only demo mode remains separate and local.
- The organizer display name in intake is a label. It grants no access. Legacy live organizer authorization comes only from the configured, verified ChatGPT identity. In hosted mode, the account that creates a trip receives that trip’s organizer membership; editing the display label cannot grant that role.

## Demo behavior

Demo state is stored under `grouptripper-demo-v1` in localStorage. Each browser has its own copy. Reset tour removes that browser's changes and restores fictional data. Clear browser storage to remove the local tour. If storage is unavailable, changes last only while the page is open. No real guest credentials are bundled with the public example.

## Donations

Suggested contribution: $20, optional. Venmo: https://venmo.com/u/Mark-Greenwood-14. PayPal and Apple Cash have no configured destination; they remain explicitly unlinked until the project owner supplies public details. Donation links open the provider; the app does not process payments or receive payment credentials. Replicas may update the donation section in `app/grouptripper.tsx`.

## Shirt Studio

Each trip has a private gallery of generated artwork and shirt mockups. All eight trip themes also have an AI-generated concept mockup and two editable prompt starters. The trip’s type selects its initial idea; unknown/custom types use the custom starter. Users can browse other themes, load an idea, or start blank. Samples were created with the built-in image-generation tool and are labeled as concepts; actual Shirt Studio renderer output varies. Optimized WebP files live in `public/shirt-samples`, with exact generation prompts in `docs/shirt-sample-prompts.json`. Browsing and loading starters never submits a render or uses quota. `/shirt-examples` exposes only the bundled fictional examples and prompts, with no account required. The server allows 2 submissions per account / rolling 24 hours across all trips, 10 submissions total / rolling 24 hours across the deployment, and 1 pending design per account. New accounts cannot bypass the deployment-wide cap. Separate accounts cannot be reliably identified as the same human; the global cap is the backstop. Canceling, hiding and failed generation do not refund quota. Refresh updates designs and allowances without losing the draft.

Adult designs are flagged by their submitter and concealed until explicitly revealed. This is not automatic content classification. Generation uses an owner-operated worker and may wait while the renderer is unavailable. Images are preview assets, not guaranteed print-ready files. The worker credential only accesses its queue and leased uploads; the coordinator credential only accesses queue counts and worker health. It cannot access trip records.

## Sharing and demo guardrails

Organizers can share their trip using the phone share sheet or copy a direct invitation link. Invitation links prefill the trip code and preserve it through sign-in; joining still requires an account and a deliberate form submission. Codes live in URL fragments and are removed from the address bar after opening. Organizers can pause invites or replace the link/code; previous members keep access. A separate public `/#create` link opens the template chooser and carries no trip data. Only organizers receive their trip's invitation code from the server.

The verified site owner can edit capacity limits and pause new accounts, new trips, or new shirt submissions at `/admin`. Defaults: 10 trips and 100 new accounts per rolling 24 hours; 100 trips, 1,000 accounts, and 500 shirt submissions total. Existing users can still sign in and use their trips when admission is paused or full. Already queued shirts may finish while submissions are paused. Daily Shirt Studio guest limits remain 2 per account, 10 shared across guests, and 1 pending per account. Configured admin testing accounts have a separate allowance.

Database triggers enforce admissions atomically, including 50 members per trip and 5 memberships per account; a failed registration batch rolls back its account and trip. Server checks give friendly capacity errors before password hashing where possible. Auth retains 20 attempts per IP per 10 minutes. Existing accounts with unknown historical creation times count toward total capacity, not the rolling signup count. Expired sessions are pruned on successful sign-in. Gallery polling runs every 10 seconds with pending work, every 60 seconds when idle, and skips hidden tabs.

These limits bound admitted groups, accounts and shirt submissions. They are not a hosting bill cap, comprehensive bot prevention, or protection against all traffic spikes. Review hosting usage separately before expanding them.

## Account recovery

The site owner can inspect sign-in usernames for members of a selected demo trip and issue a 256-bit random reset link. Only the hash is stored, one outstanding link per account; new links replace older ones and expire after 30 minutes. Tokens travel in URL fragments and are removed from the page URL when opened. The reset endpoint requires same-origin JSON and the existing auth rate limit. A single atomic transaction changes the password, consumes the token, and revokes every session for that account. Trip memberships, votes, plans and designs are retained. Trip organizers, guest sessions and render workers cannot issue reset links. No password or hash is returned by the owner API. Legacy single-trip mode does not use this recovery path.

## Admin testing quotas

Private deployment configuration can give selected existing account IDs a separate Shirt Studio testing allowance. Defaults are 20 per account and 20 shared per rolling 24 hours in that pool; guests retain 2 each and 10 shared. One pending design, pause controls, and total storage caps still apply. The setting does not grant owner access or expose other trips. The owner dashboard and guest gallery display the applicable counts. See SHIRT_STUDIO.md for configuration and tests.

## Planner compatibility and scoring

Existing account/trip/guest data is preserved. The original `submitted` flag remains the fallback for older records; new saves record date and location submission separately. A submitted location ballot stays unchanged when sliders or lodging preferences are edited. Only submitting My ballot replaces that vote. New themed trips start with five editable trip-style ideas; existing trips keep their shortlist. With fewer than five places, a ballot includes all available choices and prompts the group to nominate more.

Activity scores are weighted by each 0–10 importance slider. Spending and accommodation-quality sliders compare the guest’s preference with each place profile. Missing ratings are omitted from the score; a completely unknown profile is labeled Unrated. Trip settings lets organizers add/edit ratings. Starter values describe fictional trip styles, not researched facts about named cities. The Budget Sensitive slider runs from Fixed income (low spending) to Baller (high spending).

Date preference points use the number of offered dates for first place, then one fewer per lower rank; unavailable dates get zero. Leading dates sort by available guests first, preference points second. Destination ballots use a fixed 5–1 scale, capped at five places. Budget/room colors are planning guidance based on the ordered budget bands and recognized room types, not prices or room allocations.
