---
icon: lucide/shield-check
---

# Verifiability

Currently virtually all confidential compute solutions miss the opportunity to fully utilize the underlying technology. This is because of lack of utilizing [reproducibility](../concepts/reproducibility.md).

By ensuring that the entire software stack including the compiler and the kernel is reproducible and full-source bootstrapped, we can prove exactly what source code was used to deploy a workload into confidential compute, and prove it using hardware backed methods.

## The status quo

Most confidential compute solutions today provide what we refer to as "last-mile" reproducibility, or no reproducibility at all. What they offer is the ability to prove that the software that was deployed using confidential compute has not changed, but not tie it back to the exact source code that was used. For the last-mile reproducibility, they may offer the ability to verify that the application code integrity, but not the dependencies, or the kernel, leaving most of the software stack impossible to verify.

## Caution's approach

Caution leverages full-source bootstrapping and reproducibility all the way down to the kernel, via [StageX](https://stagex.tools) and [EnclaveOS](https://git.distrust.co/enclaveos). In this way Caution's approach provides the ability to verify the entire tech stack, all the way down.

