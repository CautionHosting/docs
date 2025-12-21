---
icon: lucide/shield-check
---

# Verifiability

How Caution's approach to verifiable compute differs from traditional secure enclaves.

## Traditional secure enclaves

Traditional TEEs (Trusted Execution Environments) like Intel SGX or AMD SEV rely on:

- Hardware attestation
- Trust in the CPU manufacturer
- Proprietary verification chains

## Caution's approach

Caution takes a different approach to verifiability:

<!-- TODO: Explain Caution's verifiability model -->

## Comparison

| Aspect | Traditional TEEs | Caution |
|--------|------------------|---------|
| Trust anchor | Hardware manufacturer | Reproducible builds |
| Verification | Hardware attestation | Cryptographic proofs |
| Transparency | Proprietary | Open & auditable |

## Learn more

- [Reproducibility & bootstrapping](reproducibility.md)
- [Verifying a deployed app](../get-started/verifying-apps.md)
