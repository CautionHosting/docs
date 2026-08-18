---
icon: lucide/lock
---

# End-to-end encryption

<p class="docs-home-intro">Learn how Caution protects data all the way into the enclave, why TLS alone is not enough, and how STEVE enables end-to-end encryption.</p>

## Why end-to-end encryption matters

The Caution platform is designed to deploy workloads that are end-to-end encrypted. Alternative solutions often fail to provide proper end-to-end encryption and expose data to untrusted environments. At Caution, we never compromise on security.

For proper end-to-end encryption, data must remain protected all the way into the enclave and be encrypted to a key that can only be accessed by the enclave. This means that terminating TLS outside the enclave, which many alternative solutions do, exposes data to untrusted environments and defeats the point of using confidential compute in the first place.

## STEVE

Caution uses [Secure Transport Encryption via Enclave (STEVE)](https://distrust.co/blog/steve.html){:target="_blank"}, a transparent proxy designed to work with existing applications.

STEVE v2 establishes a per-session encrypted channel between a client SDK and the STEVE proxy inside an AWS Nitro Enclave. The outer TLS connection terminates on the untrusted host, but protected application data remains encrypted until it reaches STEVE inside the enclave.

Each deployment pins one key-exchange suite. X25519 is the compatibility default. X-Wing draft-10 combines ML-KEM-768 and X25519. Clients must pin the same suite as the deployment; STEVE does not negotiate or fall back to another suite.

STEVE binds each session to fresh Nitro evidence. The browser SDK can enforce one or more pinned PCR profiles or durable browser TOFU; policy remains optional for backward compatibility. The native Rust SDK and its Swift UniFFI facade always require pinned profiles or application-owned durable TOFU.

STEVE deployments are fail-closed by default: an ordinary application request that does not use the E2P protocol is rejected without reaching the application. This protects the application HTTP route from plaintext downgrade, but it does not encrypt public browser bootstrap assets, platform health and attestation endpoints, or additional raw ingress ports configured by the application.

STEVE provides four client surfaces:

| Client | Purpose | Workload identity policy |
|--------|---------|--------------------------|
| Native Rust SDK | Integrate protected requests into a native application | Requires pinned PCR profiles or application-owned durable TOFU |
| Swift through UniFFI | Integrate the Rust SDK into an Apple application | Requires pinned PCR profiles or Swift-owned durable TOFU |
| STEVE CLI | Make one protected GET or POST request | Uses pinned PCR files or a durable TOFU store |
| Browser page API and service worker | Protect intercepted `fetch()` calls or send an explicit protected request through the worker | Optional pinned PCR profiles or durable browser TOFU; omission reports `not-checked` |

Pinned PCRs authenticate a reviewed deployment from the first connection only when the expected values arrive through an independently authenticated channel. TOFU verifies Nitro evidence before enrollment and provides continuity afterward, but it does not independently authenticate workload identity on first use. Losing the browser TOFU record or clearing all same-origin site data reopens enrollment. Losing only persisted policy configuration fails closed while its policy-required marker remains. Same-origin page, worker, or configuration replacement remains outside this guarantee.

To enable STEVE for your deployment, add an `e2e_encryption` block to your [`caution.hcl`](../reference/caution-hcl.md#encryption-modes) and integrate a supported client. See [Use STEVE clients](../guides/use-steve-clients.md) for browser, CLI, Rust, and Swift setup and trust-policy examples, and [Network connectivity](../reference/deployment-configuration.md#network-connectivity) for the deployment walkthrough, including `cors_origins` for browser-based clients calling the proxy from a different origin.

The [STEVE v2 protocol specification](https://git.distrust.co/public/steve/src/branch/main/docs/steve-v2-protocol.md){:target="_blank"} defines the exact wire limits and recovery rules. Current clients cap session, confirmation, and application protocol responses at 65,536, 4,096, and 33,619,968 bytes respectively; STEVE caps an upstream response body at 33,554,432 bytes. STEVE returns upstream redirects to the client instead of following them.

The browser, Rust, and Swift clients do not automatically retry a timed-out or otherwise ambiguous protected request because the application may already have executed it. Callers must apply their own idempotency policy before retrying. The Rust SDK and Swift facade preserve repeated response header fields; browser clients remain subject to Fetch restrictions such as `Set-Cookie` handling.

## Attested TLS compatibility mode

Attested TLS is Caution's end-to-end encryption compatibility mode for browsers and other clients that cannot integrate STEVE-specific code. It preserves the ordinary HTTPS client contract, terminates TLS inside the enclave, and attests the TLS certificate by placing the leaf certificate's SHA-256 fingerprint in authenticated Nitro `user_data`.

Attested TLS is not a replacement for STEVE or RA-TLS. Unlike STEVE, it does not provide application-layer encryption with an attestation-aware client. Unlike RA-TLS, it does not bind attestation evidence into TLS authentication for the client to verify during the handshake. Standard clients remain compatible because they perform normal WebPKI verification.

That compatibility deliberately leaves the client's expectations unchanged: the client verifies the normal WebPKI certificate, not Nitro evidence. An external verifier must therefore carefully enforce both the expected enclave PCRs and the live certificate binding on a regular schedule and after relevant deployment, DNS, or certificate changes. For a source-backed Attested TLS deployment (selected with `mode = "tls"` in `caution.hcl`), `caution verify` verifies the PCRs and attempts the live certificate binding. A raw-IP run with no DNS answer skips that binding and is PCR-only; it must not be treated as Attested TLS verification.

Where client integration is possible, prefer STEVE. It provides the stronger design by using STEVE-specific client code to establish an application-layer encrypted session bound to fresh Nitro evidence. This requires integrating STEVE's browser SDK and service worker, or a native STEVE client. See [Deployment configuration](../reference/deployment-configuration.md#attested-tls-compatibility-mode).

## TLS and STEVE

The data is additionally wrapped in TLS, which provides standard transport-layer guarantees such as domain trust. TLS is complementary to end-to-end encryption, not a replacement for it.

## See also

<div class="grid cards" markdown>

- :lucide-file-text: **STEVE**

    ---

    Learn more about STEVE in [this blog post](https://distrust.co/blog/steve.html){:target="_blank"} by our sister company, Distrust.

- :lucide-shield-check: **STEVE clients**

    ---

    Make attested encrypted requests with the [browser, CLI, Rust, or Swift client](../guides/use-steve-clients.md).

- :lucide-key-round: **Key Services**

    ---

    Manage [secrets inside enclaves](key-services.md) using Shamir secret sharing and quorum-based key recovery.

- :lucide-fingerprint: **Attestations**

    ---

    Prove workload integrity with [hardware-backed cryptographic proofs](attestation.md).

- :lucide-rocket: **Deployment configuration**

    ---

    Configure [source verification and networking](../reference/deployment-configuration.md) options.

</div>
