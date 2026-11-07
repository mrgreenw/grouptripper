# Shirt Studio in the shared demo

The demo has its own D1 queue and R2 previews. Each job belongs to a trip and account. Member gallery reads, cancel/hide actions and image URLs validate the session's current trip. A trip organizer cannot access another trip's records. There are no source-trip images or existing guest records in this project.

## Limits

- Two submissions per account across all its trips in any rolling 24 hours.
- Ten submissions across the entire deployment in any rolling 24 hours.
- One queued/rendering design per account.

Checks and insertion use one SQLite statement. Concurrent requests cannot overrun a cap. Retrying the same request ID does not create another job. Canceled, hidden and failed jobs retain their creation timestamp and count toward the daily limits. Hiding is recoverable at the storage level; it does not erase the quota record. No permanent-delete API bypasses the daily counts.

The interface displays remaining personal/global quotas and pending work. It refreshes every ten seconds and has a manual Refresh designs button. Draft input stays unchanged. NSFW is a submitter-controlled flag: hidden by default, requiring an explicit reveal for both ideas and assets. There is no automatic image classification.

## Renderer protocol

Generation is optional for self-hosted copies. Without `SHIRT_WORKER_TOKEN_SHA256`, submissions are disabled and drafts remain editable. To connect an owner-operated renderer, generate a fresh random 32-byte token, retain the raw hex only in the renderer's private config, and set its SHA-256 as a secret runtime environment variable. Deploy after changing runtime variables. Never copy the maintained demo's secrets.

A compatible worker polls `POST /api/shirts/worker` using `Authorization: Bearer <token>`. Actions are status (ready/busy/comfy-offline), claim, heartbeat, complete and fail. Claims return a validated prompt, job ID and lease. Heartbeat renews a five-minute lease. Only one active lease is issued per deployment; abandoned jobs fail visibly. No caller can provide arbitrary workflows, remote URLs, models, shell commands or local file paths.

Upload re-encoded WebP previews (max 8 MiB) using `PUT /api/shirts/<id>/artwork` and `/shirt`, the bearer credential and `X-Render-Lease`. Complete requires both assets. Metadata stripping belongs in the renderer before upload. Stale/deleted jobs reject late uploads and callbacks. Member image responses are authenticated and private/no-store.

An optional independent coordinator uses `SHIRT_COORDINATOR_TOKEN_SHA256` and `POST /api/shirts/coordinator` to report monitoring state and read queue counts plus renderer heartbeat. It cannot read prompts, claim jobs, upload images or read trip records.

## Maintained demo

The owner approved a separate on-demand renderer task and coordinator for GroupTripper. They use a new demo-only credential and separate runtime directories. Existing golf-trip secrets and settings remain untouched. The renderer shares the existing local ComfyUI installation, waits for other queued work, and uploads only the demo job's generated previews. No model or workflow files, computer addresses, personal paths or credentials are distributed through this public repository.

The coordinator can request the renderer to wake/start using the owner's existing private connection. Availability depends on that hardware and an existing Windows user session. Queued designs wait safely when it is unavailable; failed attempts are not automatically regenerated. Generated images and lettering should be reviewed before printing.
