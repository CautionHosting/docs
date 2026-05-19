---
icon: lucide/circle-help
---

# What is Caution?

<p class="docs-home-intro">Understand what Caution is, why it exists, and how it changes the trust model for sensitive workloads.</p>

## What Caution is

Caution is a verifiable confidential compute platform for deploying sensitive applications in secure enclaves.

It combines enclave isolation, hardware attestation, reproducible builds, and end-to-end encryption so users can verify what code is running before trusting an application with data.

## Why it exists

Sensitive services often require users to trust infrastructure operators, deployment pipelines, cloud providers, and private build systems. Confidential compute improves this by isolating workloads from the host environment, but most systems stop at proving that a deployed binary has not changed.

Caution goes further. It connects the running enclave image back to the source code and build inputs used to produce it. That means a verifier can inspect source code, reproduce the build, and compare the expected measurements with the running enclave.

## The problem it solves

Caution is designed for applications where users, customers, or other services need proof before sending sensitive data.

Examples include:

- AI inference services that should prove what model and inference code are running
- VPNs, proxies, and relays that should prove they are not running modified code
- Internal services that should verify each other before exchanging sensitive data
- Key management or signing systems that should only receive secrets after attestation succeeds

## Who it is for

Caution is for teams building services where ordinary cloud trust is not enough.

It is useful when:

- Users need to verify the software they are interacting with
- Operators want to reduce how much trust users place in infrastructure administrators
- Teams need stronger guarantees around code integrity, data confidentiality, or secret delivery
- Organizations want the option to run workloads on Caution-managed infrastructure, in their own AWS account, or by self-hosting the open source platform

## What makes it different

Most confidential compute systems can prove that a workload is running in a protected environment and that the deployed image has not changed since launch.

Caution is designed to prove more:

1. What source code and build inputs were used
2. What enclave image was produced from those inputs
3. What measurements the running enclave reports
4. Whether those measurements match the reproduced build

This gives verifiers a source-to-enclave chain of evidence instead of only a binary-level attestation.

## Core guarantees

Caution is built around four core guarantees:

- **Isolation**: Applications run inside confidential compute enclaves that are isolated from the host environment.
- **Verifiability**: Verifiers can use `caution verify` to check that the running enclave matches the expected source and build inputs.
- **Reproducibility**: Caution uses deterministic, source-bootstrapped tooling so enclave images can be rebuilt and compared.
- **End-to-end encryption**: Application data can be encrypted all the way into the enclave, so it is not exposed to infrastructure operators.

These guarantees are strongest when the application source is available, the build is reproducible, and the app runs outside debug mode.

## What Caution does not prove

Caution does not decide whether source code is safe, bug-free, or appropriate for a given use case. Verification proves that the reviewed code and the running enclave match. Users and auditors still need to inspect the code and decide whether they trust what it does.

## Next steps

<div class="grid cards" markdown>

- :lucide-zap: **Get started**

    ---

    Deploy your first application with the [quickstart](quickstart/).

- :lucide-shield-check: **Verifiability**

    ---

    Learn how Caution [connects source code to running enclaves](concepts/verifiability.md).

- :lucide-fingerprint: **Attestations**

    ---

    Understand how [hardware-backed proofs](concepts/attestation.md) work.

- :lucide-layers-3: **Deployment models**

    ---

    Compare [fully managed, bring your own cloud, and self-host](reference/deployment-models/).

</div>
