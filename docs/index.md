---
icon: lucide/home
---

# Documentation

<p class="docs-home-intro">Welcome to the documentation for Caution. Deploy sensitive workloads faster, with cryptographic proof that each enclave runs the intended source code.</p>

Caution is a verifiable confidential compute platform for deploying and managing sensitive workloads. It extends traditional confidential compute with independently verifiable deployments and support for hardware-backed, end-to-end encryption of application data.

Caution provides stronger software integrity and confidentiality assurances than isolation alone through two core security properties:

- [x] **Verifiable deployments**: Independently verify that the code running in production matches the source code, all the way down to the kernel.

- [x] **End-to-end encryption**: When enabled, application data remains encrypted all the way into the enclave and is not exposed to untrusted infrastructure operators.

Caution is fully open source, so teams can inspect, verify, and self-host the platform themselves. If you prefer to run the platform independently, see the [source code](https://codeberg.org/caution){:target="_blank"}.

[Get started](./quickstart/), or learn more about Caution:

<div class="grid cards" markdown>

- :lucide-zap: **Get started**

    ---

    Deploy your first application in a verifiable enclave. [Get started](./quickstart/)

- :lucide-compass: **What is Caution?**

    ---

    Understand the product, mental model, and core guarantees. [Learn more](./what-is-caution.md)

- :lucide-layers-3: **Deployment models**

    ---

    Compare [fully managed, bring your own cloud, and self-hosted](./reference/deployment-models/) options.

- :lucide-shield-check: **Verifiability**

    ---

    Learn how Caution [ensures code integrity](./concepts/verifiability.md) from source to production.

</div>
