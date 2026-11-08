# Current status — November 8, 2026

## Weekend option numbering — November 8, 2026

- Removing a date option immediately renumbers the remaining default “Weekend option N” labels. Existing gaps are corrected when opening the organizer intake and on settings validation/save/import/export. Custom labels, date IDs, and saved votes are preserved; dates used by guests remain protected from removal.
- Verified 37 unit tests and TypeScript. Browser QA on a disposable local hosted trip confirmed deleting the middle option leaves options 1 and 2 with the original first/third dates, and that the correction persists after saving and reloading. No production records or renderer behavior changed.

## Full planning experience — November 7, 2026

- Replaced the simplified guest form with RSVP, calendar dates and date rankings, preference sliders, live destination scoring, accommodations, explicit top-five ballot submission, visual group results and a guest voting checklist. Existing records remain compatible through optional JSON fields; no schema or account reset.
- Calendar options support arbitrary configured date ranges, including overlapping ranges and cross-month trips. Date and location rankings support dragging/touch handles, arrows, numeric rank/apply, and resets. Both budgets and rooms are visible together with fit colors and mismatch warnings. Saving accommodations advances to My ballot.
- Every nominated place remains visible regardless of fit. New themed trips have five generic, editable ideas; existing shortlists stay unchanged. Guest nominations live within Places. Organizer-editable profiles and clearly labeled illustrative starter profiles power fit scoring; unknown places are unscored and still eligible for voting.
- Separate date/place submission states preserve submitted votes when sliders change. Both submitted ballots unlock results; RSVP/status remains visible, and other ballots/preferences are redacted server-side until the viewer has voted. Group results include availability/preference shading, leading date/destination, and bar charts.
- No original-trip records, photographs, private images, or private Git history were imported. Shirt Studio, its gallery and quotas remain intact; rendering was not changed. The original golf deployment is untouched.
- Verified 36 unit tests, TypeScript, local API regression, and browser checks. Regression coverage for migration compatibility, scoring/sorting, partial and final saves, edits after submission, validation, redaction, trip isolation and stale updates. Browser QA covered the guest flow, manual date ranks, drag order, low-budget suite warning, all-place override, and mobile width (390px) with no horizontal overflow.


- Added a private, account-ID-based Shirt Studio testing pool with 20 designs/account and 20 shared per rolling 24 hours, independent of the normal 2/account and 10 shared guest allowance. Both pools retain one pending design and global pause/storage controls. The gallery and owner dashboard display live caps and separate usage. No owner privileges or cross-trip access are granted. Account assignments remain private deployment settings.

- Added hosted-demo account recovery: owner-only username lookup and 30-minute, single-use reset links; password visibility controls and direct `/#signin` entry. Migration 0003 adds only a reset-token table. Reset tokens are hashed and atomically consumed with password replacement and session revocation; trips and designs are retained. Verified registration/sign-out/sign-in and dedicated local recovery regression tests, including owner authorization, CSRF, expiry, replacement, races, and isolation.

- Shirt Studio theme starters: eight realistic AI-generated shirt concept mockups with optimized WebP assets and recorded generation prompts, two editable prompts per theme, matching default draft, alternate theme selection, blank idea, and protection before replacing edited drafts. Public `/shirt-examples` lets visitors browse/copy ideas without registration or rendering. No API/schema/renderer changes. Verified 25 unit tests, TypeScript, all theme selectors, desktop/mobile previews, and local draft loading without shirt submissions.

- Added direct trip invitations and a separate start-your-own-trip share link. Mobile native share and clipboard fallback, preserved invitations through sign-in, organizer pause/resume/replace controls, and 96-bit codes for new invitations.
- Added owner-only demo capacity controls: 10 trips/100 accounts per rolling 24 hours; 100 trips/1,000 accounts/500 shirt submissions total, adjustable by the owner. Database triggers enforce caps and atomic registration rollback. Pauses leave existing trips and gallery access available. Migration 0002 appends these controls without changing prior migrations. Gallery polling slows when idle and stops fetching in hidden tabs. Verified 22 unit tests, TypeScript, local API regression and concurrent-cap tests, plus phone-width invite sign-in/join and copy-link controls.

- New-trip template chooser: Family reunion, Golf trip, Girls’ weekend, Boys’ weekend, Bachelor party, Bachelorette party, Birthday weekend, and Custom. Hosted creation uses server-validated template configs, tailored activities/lodging/budget/destination ideas and three future example weekends. Custom requires the organizer’s first dates and destination. Settings remain editable; choosing a template never copies participants, plans, messages, or shirt jobs. Existing groups and the separate golf Site are unchanged. Verified 19 unit tests, TypeScript, disposable API creation/join/reload checks, and desktop/mobile template and custom-form behavior.

- Owner-only `/admin` reviews demo trips, RSVP/preferences, plans/messages, and per-trip Shirt Studio (including hidden designs). Requires the configured verified ChatGPT identity on every API/image request; trip creators do not receive platform-owner rights. Read-only review does not join or modify a trip. `PRIVATE_TRIP_ADMIN_URL` is an optional owner-only navigation link; no cross-site data access.
- Data separation: independent Sites, D1, R2, sessions, worker/coordinator credentials and queues. The trusted local Windows GPU/ComfyUI process remains shared compute, so this is data/access isolation, not physical or OS-level isolation.

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
