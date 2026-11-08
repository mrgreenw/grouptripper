# GroupTripper

**Good trips start together.** A configurable group-trip planner with a fictional guest tour, organizer intake, and a complete reusable source project.

- Example site: https://grouptripper.mrgreenw.chatgpt.site/
- Public template: https://github.com/mrgreenw/grouptripper
- [Create your own trip](docs/SETUP.md)
- [Features, privacy and limits](docs/FEATURES.md)

Plan a family reunion, friends getaway, outdoor adventure, retreat, city break or any other group trip. Organizers configure dates, destinations, activities, budget bands, room choices and optional planning tabs through an intake form. Guests RSVP, select dates on a calendar, set activity sliders, review a top-five destination ballot, and coordinate travel/meals/groceries/itinerary, chat and split expenses.

## Try the shared demo

Open the [demo site](https://grouptripper.mrgreenw.chatgpt.site/), choose a themed starter or **Build a custom trip**, and make an account. Family reunion, Golf trip, Girls’ weekend, Boys’ weekend, Bachelor party, Bachelorette party, and Birthday weekend starters prefill editable activities, budget/room choices, destination ideas, and example weekends. Custom trips start with your own occasion, dates, and first destination. The planner includes calendar voting, theme-specific sliders, live matches, editable rankings, budget/room guidance, and visual group results. Customize your dates, place profiles, and planning tools, then use **Copy invite** to send friends the site and your trip code. They choose **Join a trip** and create their own accounts. No ChatGPT account or separate hosting setup is needed.

Each trip's records and Shirt Studio gallery are restricted to its members. The trip creator is its organizer. Accounts can join up to five trips; each trip supports up to 50 guests. **My trips** switches between groups. This shared demo uses durable hosted storage, so changes follow you across devices.

Browse the [shirt examples](https://grouptripper.mrgreenw.chatgpt.site/shirt-examples) without an account: eight sample shirts and sixteen prompt ideas. Inside your trip, Shirt Studio starts with a matching theme idea; customize it or start blank. Browsing and editing examples uses no design allowance.

**Shirt Studio limits:** two submissions per account across all trips in a rolling 24 hours, ten across the entire demo in a rolling 24 hours, and one queued/rendering design per account. Canceled, hidden and failed designs still count. The interface shows remaining allowances, and atomic server checks prevent simultaneous submissions from exceeding them. Designs wait while the renderer is offline.

The original fictional browser-only tour is still available to self-hosted copies using `GROUPTRIPPER_MODE=demo`; it never creates shared records. `live` remains the legacy single-trip mode. The shared demo uses the new `hosted` mode. See [setup](docs/SETUP.md) and [Shirt Studio](docs/SHIRT_STUDIO.md).

## Quick local start

Requires Node.js >=22.13 (24 recommended). On Windows use native PowerShell; on Mac use your usual terminal.

```text
npm install
node scripts/local-settings.mjs
npm run dev -- --port 5174
```

Windows may require `npm.cmd`. Then open http://127.0.0.1:5174/.

**Before publishing a copied project**, run `node scripts/new-trip.mjs --confirm-new-site` in your NEW checkout to remove the demo's Site identity. Follow [the setup guide](docs/SETUP.md) to create your own Site/database, enable shared live mode, set organizer access and a private trip-code hash, and import intake settings. Do not publish a replica to the example Site or reuse its identity.

## Checks

```text
node node_modules/typescript/bin/tsc --noEmit
node --test tests/*.test.ts
npm run build
```

See SETUP.md for disposable shared-mode API checks. Browser demo and shared mode use the same validated trip operations. Live records use D1, revision checks, guest credentials and secure sessions. The supported hosted organizer login uses the Sites ChatGPT identity integration. Hosted mode isolates groups through membership-checked sessions and trip-scoped database operations. Self-hosting is optional.

## Layout

| Path | Purpose |
| --- | --- |
| `app/grouptripper.tsx` | Public landing, fictional guest entry, demo/live flow and donation links |
| `app/intake.tsx` | Organizer intake, settings import/export |
| `app/guest.tsx` | Guest planning tools and settlement UI |
| `app/lib/trip.ts` | Config validation, fictional fixtures, shared actions and results |
| `app/lib/expenses.ts` | Integer-cent shares and settlement calculation |
| `app/lib/backend.ts` | Shared storage, accounts, sessions, organizer authorization |
| `db/`, `drizzle/` | Schema and immutable migrations |
| `examples/grouptripper-config.json` | Non-secret example intake settings |
| `scripts/new-trip.mjs` | Detach a new copy from the example's hosting identity |

Password help is available through the site owner: an expiring, single-use reset link preserves saved trips. No email/SMS delivery, automated identity verification, bookings, payment processing or currency conversion is included. Shirt Studio requires an independently paired render worker; the public example has its own pairing. See FEATURES.md before running a real trip. The shared-demo update passed unit tests, TypeScript, local isolation/quota API checks and desktop/mobile browser checks.

## Optional thank-you

Free to use, modify and share under the MIT license. If it helps your group, a suggested **$20 donation** is appreciated, never required.

[Venmo: Mark Greenwood](https://venmo.com/u/Mark-Greenwood-14)

PayPal and Apple Cash details have not been supplied and are not linked. Third-party dependencies and framework tooling retain their own licenses.
