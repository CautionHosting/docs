---
icon: lucide/refresh-cw
---

# Reproducibility

Reproducibility is a relatively recent concept that provides stronger security guarantees for software supply chains.

## What is reproducibility? 

Reproducibility means that for a fixed set of inputs, software always produces the same bit-for-bit identical outputs. 

While this may sound like the default behavior, most software today is not reproducible. Build outputs often vary due to factors such as timestamps, environment differences, non-deterministic tooling, or external dependencies.

## Why it matters

Reproducibility allows both software creators and users to verify the integrity of a build.

If software is reproducible, rebuilding it should always produce the same result. [Hash functions](https://en.wikipedia.org/wiki/Hash_function){:target="_blank"} can then be used to verify that the output has not changed.

In practice, this enables multiple independent parties to build the same software on different systems and verify that the results are identical.

Without reproducibility, major supply-chain compromises like [SolarWinds](https://en.wikipedia.org/wiki/2020_United_States_federal_government_data_breach){:target="_blank"} can go undetected.

## Bootstrapping

Bootstrapping is a related concept that strengthens the security of the foundational software a system depends on.

Full-source bootstrapping refers to eliminating opaque artifacts from build processes and ensuring that software is built exclusively from source code. This makes the entire build chain auditable.

This creates a challenge: how does one build a compiler, the fundamental “software building machine” required to build other software, without relying on an existing compiler that may itself be opaque and difficult to verify?

To address this, compilers can be bootstrapped starting from a small, human-readable bytecode interpreter (a primitive compiler) and iteratively built through transparent steps, creating a fully auditable chain that leads to a modern compiler.

The security engineers behind Caution developed the [StageX](https://stagex.tools){:target="_blank"} Linux distribution to support this approach.


## How Caution leverages reproducibility

Reproducibility is a foundational requirement for all software built and used by Caution.

The Caution platform and  [EnclaveOS](https://git.distrust.co/public/enclaveos){:target="_blank"} are built using [StageX](https://stagex.tools){:target="_blank"} to ensure the entire software stack is:

- Fully source-bootstrapped

- Deterministic

- Auditable


For EnclaveOS, this means that the images deployed into confidential compute environments can be verified down to the kernel.

!!! quote "Further reading"
    To learn more about reproducible builds and bootstrapping, refer to Ken Thompson's paper [Reflections on Trusting Trust](https://www.cl.cam.ac.uk/teaching/2324/R209/Reflections-Trusting-Trust.pdf){:target="_blank"}, and the [StageX paper](https://codeberg.org/stagex/whitepapers/src/branch/main/out/stagex.pdf){:target="_blank"}.

## See also

<div class="grid cards" markdown>

- :lucide-box: **Containerizing your app**

    ---

    Follow a [practical guide](../reference/containerizing.md) to building reproducible containers with StageX.

- :lucide-shield-check: **Verifiability**

    ---

    Learn how Caution [ensures code integrity](verifiability.md) from source to production.

</div>
