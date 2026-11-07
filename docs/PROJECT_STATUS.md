# Current status — November 7, 2026

- Existing public GroupTripper demo upgraded to hosted mode: independent shared trips, account-based trip organizers, invite codes, configurable choices, and switching between up to five trips per account. Maximum 50 guests per trip. No source-trip records or private assets copied.
- Added private per-trip Shirt Studio galleries, editable prompts and lettering, refresh, adult concealment, cancellation and hiding. Server-enforced caps: 2/account and 10/deployment per rolling 24 hours, 1 pending/account. Canceled/hidden/failed jobs still count. Caps are atomic and apply across trips.
- Schema migration 0001 adds memberships, trip spaces, session trip selection, shirt jobs/worker heartbeat. Existing migrations are unchanged. R2 BUCKET stores previews. Legacy demo/live modes remain available.
- The owner explicitly approved a separate Windows on-demand task, Mac coordinator and fresh queue-only credentials for the demo. Private installation/configuration stays outside Git. The existing golf-trip Site/database/configuration remains separate.
- Verified 14 existing unit/distribution tests, TypeScript, production build, disposable loopback API checks for tenant isolation and concurrent quotas, and desktop/mobile browser behavior. Published shared-mode entry and the separately paired renderer health endpoint both returned 200; the renderer reported ready/online. No test guests or designs were created in production.

## First release (historical)


GroupTripper is an independent public project, not a branch or history copy of the private golf trip.

- GitHub: https://github.com/mrgreenw/grouptripper (public, template enabled).
- New Site ID: appgprj_6ae790c9a88c81918db8ca16736757ea.
- Intended example URL: https://grouptripper.mrgreenw.chatgpt.site/.
- Fresh D1 binding DB; no R2. No production trip records or local runtime secrets copied.
- Default demo mode keeps fictional state in each browser and rejects backend mutations. Shared mode requires GROUPTRIPPER_MODE=live, ORGANIZER_EMAIL and TRIP_CODE_SHA256.
- The organizer intake configures arbitrary trip labels, date ranges, destinations, activities, budget/room choices and enabled tools. Export/import is settings-only. A live organizer cannot remove choices already used in guest responses.
- New guest demo entry, votes, individual date response details, destination rankings, travel/meals/groceries/itinerary, messages, equal USD expense splits and settlement are implemented.
- Optional $20 donation uses the user-supplied public Venmo URL. PayPal and Apple Cash await public recipient details.
- Native Windows verification: TypeScript, 14 unit/distribution tests, production build, and disposable local API checks for auth, private reads, self-only votes, organizer authorization, origin checks, conflict handling, expense ownership/restoration and logout.
- Browser automation is disabled in Work settings, so desktop/mobile visual QA has not been performed. The local preview uses port 5174; the separate golf app's 5173 preview remains untouched.
- No original destination portraits, guest contacts, source-trip history or AI rendering worker configuration are included. The shared expense math was reused from the author's app; the generic interface/backend are independent.

Read SETUP.md before publishing a copy. Preserve this project's identity only when maintaining the example itself; a new trip must create its own Site identity.
