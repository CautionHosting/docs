---
icon: lucide/shield-check
---

# Verifiability

Verifiability is the property of a system, process, or output that allows any independent party to confirm it matches a specific, auditable reference, such as source code, without relying on trust alone.

In verifiable compute, this means cryptographically proving which exact software and build are running inside a confidential execution environment through reproducible system images and attestation hash matching.

Most confidential compute platforms focus on isolating workloads and ensuring they have not been tampered with after deployment. However, they typically do not provide strong guarantees about the provenance of the software being executed.  
This is largely due to the lack of reproducible build processes across the full software stack. See [Reproducibility](../concepts/reproducibility.md) for details.

By combining reproducibility, full-source bootstrapping, and hardware-backed attestation, it becomes possible to verify the source code that produced a running workload, not just that the workload has remained unchanged.


## The status quo

Most confidential compute systems today provide what can be described as *post-deployment integrity*.

They can verify that a deployed workload has not been modified, but they usually cannot prove:

- Which source code was used to build the software

- Whether all dependencies were built from source

- Whether the compiler and kernel were themselves reproducible

- Whether the entire software stack is auditable

Some platforms offer limited or “last-mile” reproducibility. This typically applies only to application code, not to the full dependency chain or the underlying system components. As a result, large parts of the software stack remain opaque and difficult to verify.

This limits the ability to independently confirm what is actually running in production.

## Caution's approach

Caution uses full-source bootstrapping and reproducible builds across the entire software stack, including the compiler and the kernel. 

- The platform relies on:

- Reproducible build processes

- Full-source bootstrapped toolchains

- Hardware-backed attestation

- Deterministic system images

These properties are provided through [StageX](https://stagex.tools) and [EnclaveOS](https://git.distrust.co/enclaveos). 

By ensuring that all components are built reproducibly from auditable source code, Caution makes it possible to verify the software stack used in confidential compute workloads, not just the final application layer.

This enables verification of software provenance from source code to deployed system.

