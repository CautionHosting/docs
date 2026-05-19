---
icon: lucide/home
---

# Documentation

<p class="docs-home-intro">Welcome to the documentation for Caution. Deploy sensitive workloads faster, with cryptographic proof that each enclave runs the intended source code.</p>

## What is Caution?

Caution is a verifiable confidential compute platform for deploying and managing sensitive workloads. It extends traditional confidential compute with independently verifiable deployments and hardware-backed, end-to-end encryption of application data.

Caution provides stronger software integrity and confidentiality assurances than isolation alone through two core security properties:

- [x] **Verifiable deployments**: Independently verify that the code running in production matches the source code, all the way down to the kernel.

- [x] **End-to-end encryption**: Application data remains encrypted and is never exposed to untrusted environments, including infrastructure operators.

Caution is fully open source, so teams can inspect, verify, and self-host the platform themselves. If you prefer to run the platform independently, see the [source code](https://codeberg.org/caution){:target="_blank"}.

[Learn what Caution is](./what-is-caution.md), [get started](./quickstart/), or explore the topics below:

<div class="grid cards" markdown>

- :lucide-circle-help: **What is Caution?**

    ---

    Understand the product, mental model, and core guarantees. [Learn more](./what-is-caution.md)

- :lucide-zap: **Get started**

    ---

    Deploy your first application in a verifiable enclave. [Get started](./quickstart/)

- :lucide-layers-3: **Deployment models**

    ---

    Learn about [fully managed, BYOC, and self-host](./reference/deployment-models/).

- :lucide-shield-check: **Verifiability**

    ---

    Learn how Caution [ensures code integrity](./concepts/verifiability.md) from source to production.

- :lucide-lock: **Encryption**

    ---

    Protect data all the way into the enclave with [end-to-end encryption](./concepts/encryption.md).

</div>
