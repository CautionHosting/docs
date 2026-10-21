# Blue-green deployments and quorum recovery

**Status: Upcoming.** These notes cover merged development changes from
[`d0f3ca9`](https://git.caution.co/public/platform/commit/d0f3ca9ba594705324caccc69a57f31c115041fa)
through [`1fad4127`](https://git.caution.co/public/platform/commit/1fad41270748eff75de9027b6469b5c4135b7acf),
not a production rollout announcement.

## Features and improvements

- Added opt-in blue-green deployments for managed and BYOC apps. Build and verify candidates before switching the app's stable address, with passkey-approved switching and rollback, deployment history, and dashboard controls.
- Added quorum creation from organization members using OpenPGP, passkeys, or both, plus native and browser share approval. Includes bundle inspection, upload/download, and explicit legacy V0 import.
- Added a public components page and CLI verification of hosted key services, with source/build information and attestation evidence.
- Enclave builds now reuse verified, digest-pinned components while preserving source reproduction of older enclaves. Build sources use the Caution forge with mirror fallback.
- Added configurable enclave service restart policies.
- Improved passkey handling, persistent last-used history, and support for credentials associated with multiple accounts.
- Added dashboard organization creation for accounts without a membership, and member-removal controls for organization owners and admins.

## Fixes

- Fixed ingress allowlist enforcement for application TCP/HTTPS, STEVE transport, and recovery traffic. Host firewall rules prevent broader AWS security groups from bypassing configured source restrictions; HTTP application routes check the connection's source address, not forwarded headers.
- Fixed enclave egress allowlist enforcement for IPv4 destinations, protocols, and ports, including DNS. Blocked enclave access to host services except DHCP and explicitly allowed DNS, blocked link-local/instance-metadata access and IPv6 bypasses, and made firewall installation fail closed before traffic proxies start.
- Improved deployment reliability with cleanup of abandoned deployments
- Corrected TAP/vsock framing and optimized networking.
- New accounts created outside an organization invitation now receive their organization during signup, avoiding first-request creation races. Concurrent first-time AWS provider-account setup is also idempotent.
- Fixed BYOC runners entering managed usage billing, organization credit purchases, and pricing-file permissions for metering.
- Reduced repeated CLI environment warnings and fixed unwanted secret-value quoting, OpenTofu output hangs, and terminal handling when cancelling native approval.
- Updated the S3 SDK to replace its vulnerable `lru 0.16.4` dependency with `0.18.2`.
- Enclave TLS mode now requires `network.http.domain` during configuration parsing, rather than failing later during deployment.

## Rollout notes

Update verification CLIs before deploying the new component builds: older clients cannot verify the standalone recipes. Install matching service units and apply the database migrations and component preparation.

Redeploy existing applications to replace their host and enclave and apply the firewall changes; restarting only the enclave does not update host firewall rules. Keep host and enclave TAP-framing versions paired when deploying or rolling back. Application ingress allowlists do not make port 80 platform management endpoints private.

Blue-green deployment flags default off and apply to new apps; existing apps remain on the legacy lifecycle. Once multiple deployment meters are running, rollback to the old schema is not safe.

Legacy V0 bundles need an explicit import and enclave rebuild. Hosted quorum features require separately deployed and independently verified key services.

