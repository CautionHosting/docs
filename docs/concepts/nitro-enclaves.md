---
icon: lucide/lock
---

# Nitro Enclaves

Understanding the hardware security foundation of Caution.

## What are Nitro Enclaves?

AWS Nitro Enclaves are isolated compute environments that run on dedicated, hardened virtual machines. They provide cryptographic attestation that proves exactly what code is running inside.

## How Caution uses Nitro Enclaves

When you deploy to Caution, your application runs inside a Nitro Enclave:

```
┌─────────────────────────────────────────────┐
│  EC2 Instance (Parent)                      │
│  ┌───────────────────────────────────────┐  │
│  │  Nitro Enclave (Isolated)             │  │
│  │  ┌─────────────────────────────────┐  │  │
│  │  │  Your Application               │  │  │
│  │  │  + Attestation Service          │  │  │
│  │  │  + Init System                  │  │  │
│  │  └─────────────────────────────────┘  │  │
│  └───────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
```

The enclave is completely isolated from the parent instance. Not even AWS operators can access the enclave's memory.

## Enclave Image Format (EIF)

Your application is packaged into an EIF file containing:

- **Linux kernel** - Minimal, hardened kernel
- **Init ramdisk** - Boot filesystem with your app
- **Attestation service** - Provides cryptographic proofs
- **Your application** - The code you deployed

## Platform Configuration Registers (PCRs)

PCRs are cryptographic measurements of the enclave's contents:

| PCR | Measures | Purpose |
|-----|----------|---------|
| PCR0 | Enclave image file | Proves the exact EIF being run |
| PCR1 | Linux kernel + ramdisk | Proves the boot environment |
| PCR2 | Application + config | Proves your code and settings |
| PCR3 | IAM role (optional) | Proves AWS permissions |
| PCR4 | Instance ID (optional) | Proves specific hardware |

## Attestation flow

```
1. Client sends nonce ──────────────────────────────►  Enclave
2. Enclave generates attestation document  ◄─────────  NSM
3. Document signed by Nitro hardware       ◄─────────  NSM
4. Client verifies signature + PCRs        ◄──────────  Enclave
```

The attestation document contains:

- PCR values (measurements)
- Your nonce (prevents replay)
- Timestamp
- AWS signature chain

## Nitro Secure Module (NSM)

The NSM is dedicated hardware that:

- Generates cryptographic attestations
- Signs documents with AWS-rooted keys
- Cannot be accessed by software (including AWS)

This means attestations cannot be forged, even by the cloud provider.

## Security properties

### Isolation

- No SSH access into enclaves
- No persistent storage
- No network access except through VSock

### Attestation

- Hardware-signed proofs
- Tamper-evident measurements
- Verifiable by anyone

### Reproducibility

- Deterministic builds produce identical PCRs
- Independent verification possible
- No trust in deployment infrastructure required

## Learn more

- [Verifiability](verifiability.md) - How verification works
- [PCR Values Explained](../reference/pcr-values.md) - Deep dive into PCRs
- [AWS Nitro Enclaves documentation](https://docs.aws.amazon.com/enclaves/latest/user/nitro-enclave.html)
