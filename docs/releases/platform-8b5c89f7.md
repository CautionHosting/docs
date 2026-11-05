# 2026-11-06

These notes cover changes from
[`63d3fae4`](https://git.caution.co/public/platform/commit/63d3fae42f04c2327f147f58a60b0f041546562a)
through [`8b5c89f7`](https://git.caution.co/public/platform/commit/8b5c89f7e8728d08cb453f29cd1b033a6c962b2a).

## Features and improvements

- Added `caution apps sync --app-id <APP_ID>` to restore an existing app's local link and `caution` Git remote without changing `origin`. Run it from the repository root; inherited `caution` URLs are rejected rather than silently overridden.
- Added `caution apps build --lint` for offline configuration validation without login, Docker or a build. It reads `caution.hcl`, falling back to the legacy Procfile.
- Added dashboard app renaming alongside the existing `caution apps rename` command. Renaming leaves app IDs, managed hostnames and deployments unchanged.
- Added opt-in Device Bound Session Credentials (DBSC) for dashboard sessions in supported browsers, with short-lived cookies refreshed using device-key proofs.

## Fixes

- Email changes now retain the current address and its verification status until the new address is verified. Superseded verification links cannot approve a later change.
- Enforced organization passkey user-verification requirements on signed requests, and moved conflicting-passkey checks ahead of account creation and signup-code consumption.
- Restricted granting, changing or removing organization owners to owners, and prevented demoting or removing the last owner, including concurrent requests. Non-members now receive 403 rather than 500 from affected organization-scoped endpoints.
- Fixed app renaming touching another app's Git repository, and normalized app IDs before resolving Git-push repository paths.
- Builder cleanup now rechecks ownership and in-flight builds before terminating an apparently unowned instance, retaining it if the database check fails.
- Reduced sensitive data in server diagnostics by removing raw build status, payment-provider error bodies and QR polling tokens from affected logs, and scrubbing known sensitive fields and URLs in Sentry events. Failed application-build log tails go to the deploy stream rather than server diagnostics.
- Credit top-ups no longer restart apps suspended for unpaid invoices or reset their dunning state. Credit suspension and unpaid-invoice suspension remain separate.
- Updated SSH, TLS, runtime and cryptography dependencies, preserving the SHA-2 requirement for RSA-signed HTTP requests. The `crypto-bigint 0.5.5` timing-side-channel advisory (`RUSTSEC-2026-0387`) remains an audit exception, with residual exposure in affected client-side OpenPGP and key-derivation operations.
