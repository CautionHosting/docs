---
icon: lucide/compass
---

# What is Caution?

<p class="docs-home-intro">Understand what Caution is, why it exists, and how it changes the trust model for sensitive workloads.</p>

## What Caution is

Caution is a general-purpose, [verifiable](concepts/verifiability.md) confidential compute platform for deploying sensitive applications in secure enclaves. It currently supports deployments on AWS Nitro Enclaves, with additional attestation backends in active development.

It combines enclave isolation, [hardware attestation](concepts/attestation.md), [reproducible builds](concepts/reproducibility.md), and support for [end-to-end encryption](concepts/encryption.md). Together, these let users connect reviewed source code and build inputs to the running enclave and, when end-to-end encryption is enabled, keep application data encrypted all the way into it.

## Why it exists

Caution exists to move sensitive cloud services from "trust us" to "verify it yourself." Instead of relying only on operator promises or opaque build systems, verifiers can inspect source code and build inputs, reproduce the enclave image, and compare the expected measurements with the running enclave.

## The problem it solves

Cloud applications often require users to trust infrastructure operators, deployment pipelines, cloud providers, and private build systems. Confidential compute improves this by isolating workloads from the host and using hardware attestation to report enclave measurements.

That is an important baseline, but it does not fully answer what code is running inside the enclave. Without a source-to-enclave link, an enclave can prove it is isolated without proving that it is running the code the verifier reviewed or expected.

Caution is designed to close that gap. It gives organizations, their customers, auditors, and downstream services integrity guarantees that connect the intended source code, build inputs, and configuration to what is actually running inside an enclave. It also makes enclave deployments simpler by wrapping deployment and verification in familiar Git-based and CLI workflows.

| Problem | How Caution solves it |
|---------|------------------------|
| You can attest an enclave, but still not know what source code produced it. | Caution connects enclave measurements back to [reviewed source code, build inputs, and configuration](concepts/verifiability.md). |
| Verifiers need a practical way to check a running enclave themselves. | Verification with [`caution verify`](guides/verify-an-app.md) validates the attestation, reproduces expected measurements from source, and compares them with the running enclave. |
| Enclave deployments often require custom infrastructure and specialized security expertise. | Caution's [Git-based and CLI workflows](quickstart/) handle deployment, attestation, and verification, making confidential compute easier to adopt. |
| Teams need different levels of infrastructure control. | Caution supports [fully managed](reference/fully-managed.md), [bring your own cloud](reference/bring-your-own-cloud.md), and self-hosted deployment models. |
| Most enclave deployments depend on a single hardware root of trust. | Caution supports AWS Nitro Enclaves today and has [multi-hardware attestation](concepts/attestation.md#multi-hardware-attestation) support on the 2026 roadmap. |

## Who it is for

Caution is for teams building services where ordinary cloud trust is not enough. As a general-purpose platform, Caution is not tied to one industry or application type; any workload that benefits from independently verifiable code integrity and enclave-protected data can use the model.

Example workloads that benefit from source-to-enclave verification include AI inference, oracles and data feeds, key management and signing systems, and nodes or staking infrastructure.

Caution is a fit when:

- Your customers or downstream services need to verify the software they interact with
- You want to reduce how much trust customers place in infrastructure administrators
- You need stronger guarantees for code integrity, data confidentiality, or secret delivery
- You need deployment options that match your infrastructure, data residency, or control requirements

## What makes it different

Most confidential compute systems can prove that a workload is running in a protected environment and that the deployed image has not changed since launch.

Caution is designed to prove the full chain of evidence:

- What source code and build inputs were used
- What enclave image was produced from those inputs
- What measurements the running enclave reports
- Whether those measurements match the reproduced build

This gives verifiers a source-to-enclave chain of evidence instead of only a binary-level attestation.

Caution is [fully open source](https://codeberg.org/caution){:target="_blank"}, so teams can inspect the platform, understand the verification path, and self-host it if they want to operate deployments independently.

Caution turns verification into a developer workflow: teams deploy with familiar Git-based workflows, expose an attestation endpoint, and let verifiers reproduce the enclave image locally.

## Security model

Caution's security model is designed to reduce trust in operators, infrastructure, and deployment pipelines by combining four capabilities:

- **Isolation**: Workloads run inside confidential compute enclaves isolated from the host environment.
- **[Verifiability](concepts/verifiability.md)**: `caution verify` checks that the running enclave matches the expected source and build inputs.
- **[Reproducibility](concepts/reproducibility.md)**: Deterministic, source-bootstrapped tooling lets enclave images be rebuilt and compared from the application down to the kernel.
- **[End-to-end encryption](concepts/encryption.md)**: When enabled, application data is encrypted all the way into the enclave, so infrastructure operators do not see plaintext.

These capabilities are strongest when the application source is available, the build is reproducible, the app runs outside debug mode, and end-to-end encryption is enabled for workloads that need to keep plaintext from the host.

This security model is grounded in the [Distrust Threat Model](https://distrust.co/threatmodel.html){:target="_blank"}, an adversary framework designed by the same team behind Distrust and Caution. The threat model assumes systems may already be compromised at some level. Caution applies that assumption by reducing reliance on operators, infrastructure, and deployment pipelines.

## What Caution does not prove

Caution does not determine whether source code is safe, bug-free, or appropriate for a given use case. Verification proves that the reviewed code and the running enclave match. Users and auditors still need to inspect the code and decide whether they trust what it does.

## Next steps

<div class="grid cards" markdown>

- :lucide-zap: **Get started**

    ---

    Deploy your first application with the [quickstart](quickstart/).

- :lucide-layers-3: **Deployment models**

    ---

    Understand where Caution can run and how much [infrastructure you manage](reference/deployment-models/).

</div>
