---
icon: lucide/lock
---

# Encryption

The Caution platform is designed to deploy workloads that are end-to-end encrypted. Alternative solutions often fail to provide proper end-to-end encryption, and expose data to untrusted environments. At Caution we never compromise on security.

## Overview

For proper end-to-end encryption, data needs to be protected all the way to inside of the enclave, and encrypted to a key which can only be accessed by the enclave. This means that terminating TLS outside of the enclave, which is what many alternative solutions do, exposes data to untrusted environments, defeating the point of using confidential compute in the first place.

## End-to-end encryption

Caution leverages [Secure Transport Encryption via Enclave (STEVE)](https://distrust.co/blog/steve.html){:target="_blank"}, a system which is designed as a transparent proxy which is easy to use with existing solutions.

The way it works is that there is a proxy service inside of the enclave and a SDK that can be integrated into the user application. STEVE verifies the attested key from a confidential compute workload, and uses it to encrypt the data so that it's only exposed in the client, and inside of the enclave.

## TLS termination

The data is additionally wrapped in TLS, which ensures standard security guarantees for that technology such as domain trust.

## Learn more

- Our sister company [Distrust](https://distrust.co){:target="_blank"} published a [blog](https://distrust.co/blog/steve.html){:target="_blank"} about STEVE

## See also

<div class="grid cards" markdown>

- :lucide-key-round: **Key Services**

    ---

    Manage [secrets inside enclaves](key-services.md) using shamir secret sharing and quorum-based key recovery.

- :lucide-fingerprint: **Attestation**

    ---

    Prove workload integrity with [hardware-backed cryptographic proofs](attestation.md).

- :lucide-rocket: **Deployments**

    ---

    Configure [source verification and networking](../reference/deployments.md) options.

</div>
