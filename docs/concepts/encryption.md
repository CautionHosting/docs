---
icon: lucide/lock
---

# End-to-end encryption

<p class="docs-home-intro">Learn how Caution protects data all the way into the enclave, why TLS alone is not enough, and how STEVE enables end-to-end encryption.</p>

## Why end-to-end encryption matters

The Caution platform is designed to deploy workloads that are end-to-end encrypted. Alternative solutions often fail to provide proper end-to-end encryption and expose data to untrusted environments. At Caution, we never compromise on security.

For proper end-to-end encryption, data must remain protected all the way into the enclave and be encrypted to a key that can only be accessed by the enclave. This means that terminating TLS outside the enclave, which many alternative solutions do, exposes data to untrusted environments and defeats the point of using confidential compute in the first place.

## How Caution implements it (STEVE)

Caution leverages [Secure Transport Encryption via Enclave (STEVE)](https://distrust.co/blog/steve.html){:target="_blank"}, a system which is designed as a transparent proxy which is easy to use with existing solutions.

STEVE works through a proxy service inside the enclave and an SDK integrated into the application. It verifies the attested key from a confidential compute workload and uses that key to encrypt data so it is exposed only in the client and inside the enclave.

## TLS and end-to-end encryption

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
