# Features and boundaries

GroupTripper generalizes the planning flow of a private group trip without distributing its guests, private history, deployment credentials, pictures, destination portraits, or local AI machinery.

## Included

- Browser-isolated fictional example with six sample guests, sample choices, plans, a message and a shared house-deposit expense. Visitors add a fictional nickname; no account or personal contact information is required for the tour.
- Organizer intake, JSON import/export, configurable trip types, date ranges, destinations, activities, budget choices, room preferences and enabled tools.
- Guest RSVP, availability for each date option, ordered destination ranking, budget, room and activity preferences.
- Group totals and names behind date/budget/room responses. Guests RSVP'd Out are excluded from voting aggregates; unanswered is different from unavailable.
- Travel notes, meals, groceries, itinerary and messages. Plans can be marked done by their author or the organizer.
- Shared USD expenses split equally among everyone or selected people. Saved participant lists stay fixed. Exact integer cents, individual share breakdowns, net balances, and a suggested who-pays-whom plan. Expense removal is reversible. Submitters and the organizer may edit.
- A real shared-mode backend with D1 storage, scrypt password hashes, hashed random session tokens, HttpOnly/SameSite cookies, same-origin mutations, auth rate limiting, and revision checks to reject stale updates.
- A full public source template, migrations, automated tests and setup instructions. A donation is optional, never an access requirement.

## Deliberate limits

- One trip per deployment, up to 50 guests. This is not a multi-tenant hosting service. Each organizer owns their own Site/database.
- Up to 12 date choices and 12 destination choices; 500 expenses, 300 plans and 300 messages per trip. These are bounded small-group tools.
- USD and equal splits only. No currency conversion, payment collection, payment requests sent automatically, or recording completed repayments. Don't enter a reimbursement as a new expense: that double-counts costs.
- Refresh the shared trip to see other users' changes. Conflicting writes are rejected rather than overwriting newer data. Save drafts before leaving the page.
- Date choices and destination rankings use configurable lists; no live travel search, flight availability, bookings, weather lookup, automatic destination scoring, crime rankings, maps or AI shirt generation. These source-trip-specific integrations are not distributed as working features in this independent version.
- No email/SMS notifications, guest contact collection, file uploads or automated password recovery. Organizers should maintain appropriate backups through their hosting provider and agree on guest-account support before inviting a group.
- Guest responses, names, plans and expenses are visible to signed-in trip members. Do not use it for sensitive financial records; record shared trip costs only. The public demo never writes shared accounts or records.
- The organizer display name in intake is a label. It grants no access. Live organizer authorization comes only from the configured, verified ChatGPT identity.

## Demo behavior

Demo state is stored under `grouptripper-demo-v1` in localStorage. Each browser has its own copy. Reset tour removes that browser's changes and restores fictional data. Clear browser storage to remove the local tour. If storage is unavailable, changes last only while the page is open. No real guest credentials are bundled with the public example.

## Donations

Suggested contribution: $20, optional. Venmo: https://venmo.com/u/Mark-Greenwood-14. PayPal and Apple Cash have no configured destination; they remain explicitly unlinked until the project owner supplies public details. Donation links open the provider; the app does not process payments or receive payment credentials. Replicas may update the donation section in `app/grouptripper.tsx`.
