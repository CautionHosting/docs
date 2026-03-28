---
icon: lucide/info
---

# What is Caution?

Caution is a generalized verifiable compute platform for managing the lifecycle of confidential workloads that can be independently verified.

!!! warning "Alpha software"
    Caution is in alpha and not production ready. APIs, workflows, and features may change without notice.

Caution extends traditional confidential compute by providing complete verifiability of the software running in production and hardware-backed, end-to-end encryption of application data:

- **Verifiable deployments** - Real-time verification that code running in production matches the intended source, all the way down to the kernel.

- **End-to-end encryption** - Application data remains encrypted and is never exposed to untrusted environments, including infrastructure operators.

Together, these guarantees enable verification of software provenance and stronger confidentiality assurances than isolation alone.

Caution is free and open source software. It supports [multiple deployment options](./reference/deployments.md#deployment-options) including fully managed, managed on-premises, and self-hosted.

[Get started](./quickstart.md) or learn more about Caution:

<div class="grid cards" markdown>

- :lucide-shield-check: **Verifiability**

    ---

    Learn how Caution [ensures code integrity](./concepts/verifiability.md) from source to production.

- :lucide-rocket: **Deployment options**

    ---

    Choose from [fully managed, on-premises, or self-hosted](./reference/deployments.md#deployment-options) deployments.

- :lucide-fingerprint: **Attestations**

    ---

    Prove workload integrity with [hardware-backed cryptographic proofs](./concepts/attestation.md).

- :lucide-lock: **Encryption**

    ---

    Protect data all the way into the enclave with [end-to-end encryption](./concepts/encryption.md).

</div>