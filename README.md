# GroupTripper

**Good trips start together.** A configurable group-trip planner with a fictional guest tour, organizer intake, and a complete reusable source project.

- Example site: https://grouptripper.mrgreenw.chatgpt.site/
- Public template: https://github.com/mrgreenw/grouptripper
- [Create your own trip](docs/SETUP.md)
- [Features, privacy and limits](docs/FEATURES.md)

Plan a family reunion, friends getaway, outdoor adventure, retreat, city break or any other group trip. Organizers configure dates, destinations, activities, budget bands, room choices and optional planning tabs through an intake form. Guests RSVP, vote, rank destinations, coordinate travel/meals/groceries/itinerary, chat and split expenses.

## Try the demo

The default mode is a fictional example with six sample guests. Choose **Guest tour**, enter a made-up nickname, and participate as a new guest. Your changes stay in your browser. Other visitors get their own copy; reset whenever you like. No private source-trip data, personal pictures, passwords, phone numbers or emails are included.

Choose **Make it yours** to fill the organizer intake, apply it to a fresh browser-only example, and download settings. The **Get the template** page walks through copying and hosting your own trip.

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

See SETUP.md for disposable shared-mode API checks. Browser demo and shared mode use the same validated trip operations. Live records use D1, revision checks, guest credentials and secure sessions. The supported hosted organizer login uses the Sites ChatGPT identity integration. This is not a multi-tenant service: each real trip needs its own deployment.

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

No email/SMS, bookings, automated password recovery, payment processing, currency conversion or AI shirt generation is included. See FEATURES.md before running a real trip. The first release passed automated checks; visual browser QA was unavailable in the development session.

## Optional thank-you

Free to use, modify and share under the MIT license. If it helps your group, a suggested **$20 donation** is appreciated, never required.

[Venmo: Mark Greenwood](https://venmo.com/u/Mark-Greenwood-14)

PayPal and Apple Cash details have not been supplied and are not linked. Third-party dependencies and framework tooling retain their own licenses.
