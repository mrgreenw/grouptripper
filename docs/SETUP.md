# Run your own GroupTripper

## Use the shared demo — no deployment needed

Visit https://grouptripper.mrgreenw.chatgpt.site/ and choose a trip theme or Build a custom trip. Themed starters include editable example weekends and destination ideas; custom trips ask for your own first date range and destination. Enter your trip name, display name, username and an 8-character-or-longer password. No special characters or ChatGPT account required. Configure the date and destination choices, then Copy invite. Friends choose Join a trip and enter that code. My trips lets an existing account create or join another group. Trip settings are editable only by that trip's creator.

The shared demo includes Shirt Studio with 2/account/day, 10/deployment/day, and 1 pending/account. Daily means a rolling 24 hours. Rendering is provided by the demo owner's separately paired worker. There is no password recovery flow; keep your sign-in details.

## Host your own copy (optional)

The following instructions describe an independent deployment. Use `GROUPTRIPPER_MODE=demo` for a fictional browser-only tour, `live` for the legacy single-trip setup below, or `hosted` for multiple independent groups. Hosted mode uses account-based organizers and generated trip codes; it does not require ORGANIZER_EMAIL or TRIP_CODE_SHA256. Set the Site audience deliberately so invited guests can reach it. Copies never inherit the author's renderer credentials.

Each independent deployment gets its own project, Site, database and secrets. You do not need a donation to use the template.

## 1. Copy the source

Use **Use this template** on https://github.com/mrgreenw/grouptripper to create a repository you own. A private repository is appropriate for your real trip. Clone YOUR repository, not the author's development repository. GitHub, a current Node.js version >=22.13 (24 recommended), and ChatGPT/Codex with the Sites plugin are needed for the supported hosting path. The Node package dependencies are installed separately on Windows and Mac.

```text
git clone https://github.com/YOUR-ACCOUNT/YOUR-TRIP.git
cd YOUR-TRIP
node scripts/new-trip.mjs --confirm-new-site
npm install
node scripts/local-settings.mjs
npm run dev -- --port 5174
```

On Windows, use `npm.cmd` if PowerShell blocks `npm.ps1`. Native Windows is supported; WSL is not required. `scripts/start-local.ps1` also launches port 5174 and can discover the author's optional workspace-local Node installation. Mac users can use the same npm commands directly.

**Run `new-trip.mjs` before publishing.** It clears the template's tracked Site ID in your new checkout. It does not touch any hosted Site. Do not run it in an established trip checkout. Never reuse the example's Site ID or database. Do not copy `.dev.vars`, `.wrangler`, `.sites-runtime`, `node_modules`, or local databases between projects.

The example `.openai/hosting.json` contains the demo's public deployment identity so its maintainer can update it. The new-trip step removes it from your copy. Sites publication requires a new identity, even if your GitHub repository has a different name.

## 2. Customize using the intake

Open http://127.0.0.1:5174/ and choose **Make it yours**. Configure the trip name/type, organizer display name, welcome, up to 12 date ranges, up to 12 destination choices, activities, budget bands, room preferences, and optional tools. Dates can span any number of days in 2000–2099; they are not golf-specific or restricted to weekends.

Download the settings JSON. This file contains public-facing trip settings, not secrets or accounts. Applying intake in demo mode starts a fresh fictional workspace in that browser after confirmation. It cannot change another visitor's demo. Reset tour restores the original fictional example.

## 3. Create a NEW hosted Site

Ask Codex, with the Sites plugin enabled:

> Publish my new GroupTripper copy from this repository as a NEW Site. Read AGENTS.md and docs/SETUP.md first. Confirm the template Site ID was cleared. Create a new Site and fresh D1 DB binding, keep the existing schema migrations, use the installed Sites build/source helpers, and never access or modify the original example Site. Initially publish in demo mode. Give me the new Site URL and its settings location.

The Sites helper creates the new identity and stores it in `.openai/hosting.json`, builds the Worker, and applies schema-only migrations. D1 `DB` stores trips, accounts and the shirt queue; R2 `BUCKET` stores generated previews. Do not manually create tables from request handlers. The author does not receive access to your database. Hosting access, service limits and any fees are controlled by your hosting account.

Legacy live mode uses Sites' ChatGPT organizer identity. Hosted mode uses account-based trip organizer memberships. Bare static hosting will only serve assets, not a working shared trip. A direct Cloudflare deployment needs an equivalent trusted identity integration; do not trust client-supplied identity headers on an unprotected Worker.

## 4. Enable your private shared trip

In YOUR new Site's **Environment variables**, set:

| Variable | Value |
| --- | --- |
| `GROUPTRIPPER_MODE` | `live` (any other value keeps the browser-only demo) |
| `ORGANIZER_EMAIL` | The email of your verified ChatGPT organizer identity |
| `TRIP_CODE_SHA256` | Lowercase SHA-256 hex of a long random invite code, trimmed and lowercased before hashing |

Keep the invite code private. Store its hash with **Secret** enabled. Do not paste secrets into chat, source, intake JSON, issues or commits. Use a password manager to generate and share a strong random trip code. Hash it locally with Node's `crypto.createHash('sha256')` or a trusted local tool; do not send it to an online hash website. The code protects registration; existing accounts still require their individual passwords.

Save the settings and deploy a new version to apply them. No fictional records are seeded into live storage. Open the site and use **Organizer sign-in with ChatGPT**, then **Make it yours → Import settings → Save trip settings**. If the organizer email is not configured, no organizer is authorized. A public Site audience lets ordinary guests reach the registration screen without ChatGPT accounts; the app still requires guest authentication before returning shared trip records. Set the Site's audience deliberately in your hosting account.

Register your own guest account if you want to vote or pay as a participant. Organizer-only access does not create a guest vote. Share the new Site URL and trip code privately with your group. Guests create a username, a password of at least 12 characters, and a display name. No guest email or phone number is collected.

## 5. Verify before inviting people

- Register two disposable accounts on your own test environment; submit different dates and rankings.
- Confirm group results list available, unavailable and unanswered guests correctly.
- Add a test expense split across selected people, review individual shares, and use Settle up.
- Verify another guest cannot edit your expense and an organizer can remove/restore it.
- Check desktop and phone layout, then verify persistence by signing in from a second browser.
- Review privacy and limitations in FEATURES.md. There is no automated password recovery, bookings, payment processing or repayment tracking.

## Local shared-mode development

For a fresh checkout, run `node scripts/local-settings.mjs --live` instead of the demo setup. It creates ignored `.dev.vars` with the local simulated organizer `seedy@sites.test` and prints a disposable local invite code. The script refuses to overwrite existing settings. For switching an existing local preview, edit `.dev.vars` deliberately and restart the process.

Build and initialize a NEW disposable local database once:

```text
npm run build
node --import ./scripts/sites-env.mjs node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_plain_forge.sql
npm run dev -- --port 5174
```

Do not reapply that initial migration to an initialized database. Future schema changes require additional Drizzle migrations. Hosted and local storage are separate. A demo preview does not require local tables; shared-mode API tests do.

Run checks:

```text
node node_modules/typescript/bin/tsc --noEmit
node --test tests/*.test.ts
npm run build
```

`tests/api-smoke.mjs` requires `GROUPTRIPPER_TEST_CODE` for your disposable loopback live-mode database. It creates fake accounts and expenses there and refuses remote URLs. No production records are copied into the tests.

## Move between Windows and Mac

Commit and push your own repository after changes. On the other computer, inspect the working tree and pull without discarding unfinished work. Install dependencies locally. Keep the SAME Site ID for that established trip, but never copy runtime secrets or local database state through Git. GitHub pushes alone do not deploy Sites; use the Sites source/build/publication workflow, then push any publication commits to GitHub too.

## Shared-demo development and renderer pairing

For hosted-mode local checks, use ignored `.dev.vars` with `GROUPTRIPPER_MODE=hosted`. Apply all schema migrations in order, including `0001_glamorous_proudstar.sql`. Run `node tests/hosted-api-smoke.mjs` against disposable loopback storage with a worker hash for the test-only token specified in that script. It verifies group isolation, organizer boundaries, worker leases and concurrent quotas, and removes the records it creates. Never use its test token in production.

See [SHIRT_STUDIO.md](SHIRT_STUDIO.md) for the optional worker protocol and runtime secrets. Do not copy an existing worker's secrets or source-trip data into a public template.

## Hosted demo owner dashboard

Set `ORGANIZER_EMAIL` to the verified ChatGPT email of this deployment’s owner, then deploy. `/admin` provides read-only oversight of all demo groups and their shirt designs. Guest accounts and trip organizers cannot access it. Optionally set `PRIVATE_TRIP_ADMIN_URL` to an HTTPS admin link for your separate private trip. The link is returned only after owner authorization; no credentials or trip data cross sites. The public app discloses that the site owner can review shared trip content. Replicas must configure their own owner identity and storage.
