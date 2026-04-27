---
icon: lucide/shield-check
---

# Verifiability

<p class="docs-home-intro">Learn how Caution lets you verify that the code running in confidential compute matches the exact source you intended to deploy, from your application down to the kernel.</p>

## What verifiability means

Today, most confidential compute solutions do not fully utilize the underlying technology because they do not leverage [reproducibility](../concepts/reproducibility.md).

By ensuring that the entire software stack, including the compiler and kernel, is reproducible and full-source bootstrapped, we can prove exactly what source code was used to deploy a workload into confidential compute using hardware-backed methods.

## Limits of the status quo

Most confidential compute solutions today provide what we call "last-mile" reproducibility, or no reproducibility at all. They can show that deployed software has not changed, but they cannot tie it back to the exact source code used to produce it. With last-mile reproducibility, they may verify the integrity of application code, but not dependencies or the kernel, leaving most of the stack impossible to verify.

## Caution's approach

Caution leverages full-source bootstrapping and reproducibility all the way down to the kernel through [StageX](https://stagex.tools){:target="_blank"} and [EnclaveOS](https://git.distrust.co/public/enclaveos){:target="_blank"}. This approach makes the entire software stack verifiable.

## See also

<div class="grid cards" markdown>

- :lucide-file-text: **StageX**

    ---

    Learn about full-source bootstrapping and reproducibility in the [StageX paper](https://codeberg.org/stagex/whitepapers/src/branch/main/out/stagex.pdf){:target="_blank"}.

- :lucide-file-text: **EnclaveOS**

    ---

    Learn about EnclaveOS in [this blog post](https://distrust.co/blog/enclaveos.html){:target="_blank"} by our sister company, Distrust.

- :lucide-refresh-cw: **Reproducibility**

    ---

    Enable independent verification with [deterministic builds](reproducibility.md).

- :lucide-fingerprint: **Attestations**

    ---

    Prove workload integrity with [hardware-backed cryptographic proofs](attestation.md).

</div>
