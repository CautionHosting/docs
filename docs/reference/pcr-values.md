---
icon: lucide/hash
---

# PCR Values Explained

Understanding Platform Configuration Registers.

## What are PCRs?

Platform Configuration Registers (PCRs) are cryptographic hashes that measure the contents of a Nitro Enclave. They're computed by secure hardware and cannot be forged.

## PCR indices

### PCR0 - Enclave image

Measures the entire Enclave Image File (EIF):

- Kernel
- Initramfs
- Application code
- All embedded files

**Changes when:** Any file in the enclave changes.

### PCR1 - Linux kernel and ramdisk

Measures the boot components:

- Linux kernel image
- Kernel command line
- Ramdisk contents

**Changes when:** Kernel version or boot config changes.

### PCR2 - Application

Measures application-specific data:

- User application hash
- Configuration files
- Environment setup

**Changes when:** Your code or config changes.

### PCR3 - IAM role (optional)

Measures the IAM role ARN assigned to the parent instance.

**Use case:** Ensuring enclaves only run with specific AWS permissions.

### PCR4 - Instance ID (optional)

Measures the parent EC2 instance ID.

**Use case:** Binding enclaves to specific hardware.

### PCR8 - Enclave signing certificate (optional)

Measures the certificate used to sign the enclave image.

**Use case:** Ensuring enclaves are signed by a specific authority.

## PCR format

PCRs are 48-byte SHA-384 hashes, typically represented as:

- Hex: `abc123def456...` (96 characters)
- Base64: `q7Ej3vRW...` (64 characters)

## PCR files

Caution generates a `.pcrs` file when building enclaves:

```json
{
  "PCR0": "Wf3tuI8+Zq...",
  "PCR1": "Kj8nMp2+Xr...",
  "PCR2": "Qr5tYu1+As..."
}
```

## Verification

### Reproduce and compare

The most reliable verification:

```bash
# Build locally
caution build

# Compare PCRs with running enclave
caution verify --reproduce <app-id>
```

### Known PCR comparison

If you have trusted PCR values:

```bash
caution verify --pcrs trusted-pcrs.json <app-id>
```

## Why PCRs matter

### Integrity proof

PCRs cryptographically prove:

- Exact code version running
- No modifications since build
- Consistent build environment

### Reproducibility verification

If two builds produce identical PCRs:

- Same source code
- Same build environment
- No hidden modifications

### Supply chain security

You can:

1. Build locally
2. Deploy to Caution
3. Verify running PCRs match local build
4. Trust the deployed code

## Debug mode

Debug enclaves have zeroed PCRs:

```
PCR0: 000000000000000000000000000000000000000000000000
PCR1: 000000000000000000000000000000000000000000000000
PCR2: 000000000000000000000000000000000000000000000000
```

!!! danger "Never trust debug enclaves"
    Debug mode allows memory inspection. Any attestation with zeroed PCRs should be rejected in production.

## Common issues

### PCR mismatch

**Cause:** Non-reproducible builds

**Solutions:**

- Fix timestamps (`SOURCE_DATE_EPOCH=1`)
- Remove random UUIDs
- Pin dependencies
- Use deterministic file ordering

See [Deterministic Applications](../guides/deterministic-apps.md).

### PCR0 differs, PCR1-2 match

**Cause:** Different enclave tooling version

**Solution:** Ensure same eif_build version

### All PCRs differ

**Cause:** Completely different build

**Solution:** Verify you're building the same commit

## Learn more

- [Attestation Document Format](attestation-format.md) - Full document structure
- [Nitro Enclaves](../concepts/nitro-enclaves.md) - Architecture overview
- [Deterministic Applications](../guides/deterministic-apps.md) - Achieving reproducibility
