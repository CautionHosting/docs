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

STEVE binds each session to fresh Nitro evidence. The browser SDK verifies the Nitro evidence and session binding, but does not currently compare PCRs with an independently supplied expected-PCR policy. The native Rust SDK requires expected PCR0, PCR1, and PCR2 values.

To enable STEVE for your deployment, add an `e2e_encryption` block to your [`caution.hcl`](../reference/caution-hcl.md#encryption-modes) and integrate the [STEVE SDK](https://git.distrust.co/public/steve#usage){:target="_blank"} into your client. See [Network connectivity](../reference/deployment-configuration.md#network-connectivity) for the full walkthrough, including `cors_origins` for browser-based clients calling the proxy from a different origin.

## Attested TLS compatibility mode

Attested TLS is available for clients that cannot integrate STEVE. It uses ordinary HTTPS, terminates TLS inside the enclave, and attests the TLS certificate by placing the leaf certificate's SHA-256 fingerprint in authenticated Nitro `user_data`.

Attested TLS is not a replacement for STEVE or RA-TLS. Unlike STEVE, it does not provide application-layer encryption with an attestation-aware client. Unlike RA-TLS, it does not bind attestation evidence into TLS authentication for the client to verify during the handshake. Standard clients remain compatible because they perform normal WebPKI verification.

An external verifier must therefore periodically compare the live certificate fingerprint with the authenticated fingerprint while also enforcing the expected enclave PCRs. See [Deployment configuration](../reference/deployment-configuration.md#attested-tls-compatibility-mode) for the required check.

## TLS and STEVE

The data is additionally wrapped in TLS, which provides standard transport-layer guarantees such as domain trust. TLS is complementary to end-to-end encryption, not a replacement for it.

## See also

<div class="grid cards" markdown>

- :lucide-file-text: **STEVE**

    ---

    Learn more about STEVE in [this blog post](https://distrust.co/blog/steve.html){:target="_blank"} by our sister company, Distrust.

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
