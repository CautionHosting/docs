---
icon: lucide/help-circle
---

# FAQ


Frequently asked questions about Caution.

## General

### What is Caution?

Caution is a generalized verifiable compute platform for deploying, proving, and scaling confidential workloads anywhere.

### How is Caution different from other cloud platforms?

Caution provides cryptographic verification of your deployments, ensuring the code running in production matches what was built. See [Verifiability](concepts/verifiability.md) for details.

## Reproducibility

### What is reproducibility?

Reproducible builds ensure that given the same source code and build environment, you always get identical output. This is foundational to Caution's trust model.

[Learn more about reproducibility](concepts/reproducibility.md)

### How do I make my app reproducible?

See our guide on [making your application deterministic](reference/deterministic-apps.md).

## Verification

### How do I verify a deployed application?

Use the Caution CLI:

```bash
caution verify <app-id>
```

See the [Deployments reference](reference/deployments.md) for more on verification.

### What gets verified?

- Source code hash
- Build artifacts
- Runtime environment

## Security

### How is Caution different from traditional secure enclaves?

Traditional TEEs rely on hardware attestation and trust in CPU manufacturers. Caution uses reproducible builds and cryptographic proofs for verification.

[Learn more about verifiability](concepts/verifiability.md)

### How does networking work?

All traffic is end-to-end encrypted. See [Encryption](concepts/encryption.md) for details.

## Deployment

### What is a Procfile?

A Procfile defines how your application runs. See the [Procfile reference](reference/procfile.md).

### Can I deploy on-premises?

Yes! See [Managed on-premises](reference/managed-on-premises.md).
