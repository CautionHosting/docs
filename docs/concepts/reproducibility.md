---
icon: lucide/refresh-cw
---

# Reproducibility

Reproducibility is a relatively recent concept which provides a means to provide more robust security guarantees around software supply chains.

## What is reproducibility?

The general definition of reproducibility is software which for a fixed set of inputs, always produces the exact same bit-for-bit identical outputs. While this may sound like the default behavior for all software, it is not. In fact most software today is not reproducible.

## Why it matters

The ability to reproduce software allows both the creators of the software and the end users to verify its integrity. If the software is reproducible, it means that any time it is build, the result is expected to be identical. To quickly verify that the output of a build has not changed we rely on [*hash functions*](https://en.wikipedia.org/wiki/Hash_function). In practice, this allows multiple parties to build the same software on different systems, and ensure that the software yields identical results across them. Some of the most severe cybersecurity breaches in history, like the Solar Winds incident (TODO add link).

## Bootstrapping

Bootstrapping is a related concept which is essential in ensuring the supply chain security of the foundation software is built upon. Full-source bootstrapping refers to the process of eliminating opaque artifacts from software build processes, and always building exclusively from source code, to ensure full auditability of the code. To achieve this, there is a chicken and egg issue that emerges. How does one build a compiler, the fundamental "software building machine" required to build other software, without using an existing compiler? If one was to use an existing compiler, it is an opaque component which we can not fully verify. Compiler themselves can be bootstrapped, by starting from a small human readable byte code which is a primitive compiler, and iteratively building up a more fully featured compiler through transparent steps to ensure a fully transparent chain all the way to a fully functioning modern compiler. To this end, the team behind Caution built a Linux distribution [StageX](https://stagex.tools)


## How Caution leverages reproducibility

Reproducibility is a fundamental concept which is a starting point for all software built and used by Caution. The platform itself, as well as [EnclaveOS](https://git.distrust.co/enclaveos) are built using StageX to ensure that the entire software stack is full-source bootstrapped and deterministic. In the case of EnclaveOS, what this means is that the software images that are deployed into confidential compute workloads can be verified all the way down to the kernel.

## Further reading

For those who are interested to learn more, refer to Ken Thompson's paper Reflections on Trusting Trust (TODO add link), and the StageX paper (TODO add link).