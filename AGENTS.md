# GroupTripper development

Read README.md, docs/SETUP.md, docs/FEATURES.md and docs/PROJECT_STATUS.md first. This is an independent public template and shared demo; fictional browser-only mode is also retained. Never connect to the original private trip or copy personal records, image assets, secrets, local worker configs, private Git history or runtime state into it.

The maintainer's origin is https://github.com/mrgreenw/grouptripper. Inspect the working tree and fetch before editing; preserve unfinished work. Commit/push completed authorized changes and report branch/commit. A fresh trip copied from this template MUST clear the template hosting identity using scripts/new-trip.mjs before creating its new Site. An established deployment must preserve its own Site ID.

Use native Windows on this PC and the installed Sites workflow for builds/source/publication. Code defaults to browser-only demo. The maintained public example deliberately uses GROUPTRIPPER_MODE=hosted with account-based trip organizers and isolated groups. Legacy live mode uses organizer email and trip-code hash. Never reuse demo renderer credentials in copied deployments. Keep .dev.vars, .wrangler, .sites-runtime, work, node_modules, credentials and real records out of Git. Test live behavior against disposable loopback storage only. Append schema migrations; don't modify applied migrations.

The public demo has no recipient configured for PayPal or Apple Cash. Do not invent these links or personal contact details. Preserve the supplied public Venmo link unless asked otherwise.
