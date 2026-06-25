---
icon: lucide/shield-alert
---

# Security assumptions and threat model

<p class="docs-home-intro">Understand what Caution is designed to prove, what it still trusts, and which attacks are outside the current security model.</p>

Caution is designed to reduce the amount of trust required in infrastructure operators, deployment systems, and private build pipelines. It does this by combining confidential compute isolation, hardware attestation, reproducible builds, and local verification.

This page describes the current security assumptions for Caution deployments. It is not a formal proof, and it does not replace a review of your application source code, deployment configuration, or operational environment.

## Security goals

Caution is designed to provide evidence for these claims:

- The workload is running inside a confidential compute enclave.
- The enclave reports hardware-backed measurements for the running image.
- The reported measurements can be reproduced from source code and build inputs.
- A verifier can compare the reproduced measurements with the running enclave.
- When end-to-end encryption is enabled, application data is encrypted all the way into the enclave.

These goals are strongest when the application source is available, the build is reproducible, the app runs outside debug mode, and end-to-end encryption is enabled for workloads that need to keep plaintext from the host.

## What Caution trusts today

Caution currently supports deployments on AWS Nitro Enclaves. That means current deployments rely on:

- AWS Nitro Enclaves for enclave isolation and memory protection
- The AWS Nitro Security Module for attestation documents
- The AWS Nitro certificate chain for proving attestations came from genuine Nitro hardware
- The verifier's local machine and tooling when running `caution verify`
- The reviewed source code, build inputs, and configuration selected by the verifier
- The application developer to avoid vulnerabilities in application code

Caution reduces trust in operators and deployment systems, but it does not remove every trust dependency. In particular, AWS Nitro is part of the trusted computing base for Caution deployments today.

## What Caution is designed to protect against

| Risk | How Caution addresses it |
|------|---------------------------|
| An operator claims to run one version of software but deploys another. | Verification compares the running enclave measurements with measurements reproduced from reviewed source and build inputs. |
| A deployment pipeline swaps or modifies the enclave image. | A PCR mismatch causes verification to fail. |
| A host operator tries to inspect enclave memory. | The workload runs inside a confidential compute enclave isolated from the host. |
| A host or proxy terminates normal TLS outside the enclave. | End-to-end encryption can keep application data encrypted until it reaches the enclave. |
| An old attestation document is replayed. | Verification uses a fresh nonce so old attestation documents cannot be reused. |
| A verifier needs evidence independent of Caution's infrastructure. | `caution verify` runs locally and reproduces expected measurements from source. |

## What Caution does not protect against

| Out of scope | Why |
|--------------|-----|
| Malicious or vulnerable source code | Verification proves that reviewed code and the running enclave match. It does not prove that the code is safe, bug-free, or appropriate for a use case. |
| Compromised source repositories, dependencies, or build inputs | If a verifier reviews and reproduces compromised inputs, Caution can prove those inputs produced the running enclave, but it cannot determine that the inputs are trustworthy. |
| A compromised verifier machine | If the machine running `caution verify` is compromised, its output can be tampered with. |
| Debug-mode deployments | AWS Nitro Enclaves zero out PCR values in debug mode, so production verification is not meaningful while debug mode is enabled. |
| Plaintext exposure when end-to-end encryption is disabled | Standard TLS may terminate outside the enclave. Use end-to-end encryption when plaintext must be hidden from the host. |
| Missing or unavailable source code | Without source access or known expected PCRs, a verifier cannot independently reproduce the build. |
| Non-reproducible application builds | If the application build is not reproducible, attestation can show that a deployment has not changed, but not that it matches specific source code. |
| Compromised Nitro hardware, firmware, or attestation roots | Current Caution deployments rely on AWS Nitro for hardware isolation and attestation. If that trust root lies or is compromised, Caution cannot independently prove Nitro's claims today. |

## Important deployment assumptions

For the strongest guarantees:

- Publish source locations with `app_sources` so third parties can reproduce the build from the attestation manifest.
- Keep production deployments outside debug mode.
- Make the application build reproducible, not just the Caution platform components.
- Enable end-to-end encryption when application data must remain hidden from the host or infrastructure operator.
- Verify from a machine and network environment you trust.
- Review the reproduced source and build artifacts before deciding whether to trust what the app does.

## Cloud provider and hardware trust

Caution is designed to reduce trust in cloud operators, but current AWS deployments still rely on AWS Nitro Enclaves as the hardware trust root.

If an infrastructure administrator controls the host but Nitro isolation and attestation are working correctly, Caution can still provide useful evidence about the enclave and the software running inside it. If AWS Nitro hardware, firmware, or the attestation certificate chain is malicious or compromised, that is outside Caution's current protection boundary.

Multi-hardware attestation is on the Caution roadmap. The goal is to reduce reliance on a single hardware root of trust by requiring multiple attestation technologies to agree on workload state. Today, Caution supports AWS Nitro Enclaves.

## Relationship to the Distrust Threat Model

Caution follows the [Distrust Threat Model](https://distrust.co/threatmodel.html){:target="_blank"}, an adversary framework designed by the same team behind Distrust and Caution. The model assumes systems may already be compromised at some level and encourages designs that reduce reliance on operators, infrastructure, and deployment pipelines.

Caution applies that approach by making enclave deployments locally verifiable from source instead of relying only on promises from operators or cloud infrastructure.

## See also

<div class="grid cards" markdown>

- :lucide-shield-check: **Verifiability**

    ---

    Learn how Caution [connects running enclaves back to source](verifiability.md).

- :lucide-fingerprint: **Attestations**

    ---

    Learn how Caution verifies [hardware-backed enclave measurements](attestation.md).

- :lucide-lock: **End-to-end encryption**

    ---

    Protect data [all the way into the enclave](encryption.md).

- :lucide-badge-check: **Verify an app**

    ---

    Use `caution verify` to [check a running app](../guides/verify-an-app.md).

</div>
