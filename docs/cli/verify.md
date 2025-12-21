---
icon: lucide/shield-check
---

# caution verify

Verify a deployed application's integrity.

## Usage

```bash
caution verify [options] <app-id-or-url>
```

## Description

Verifies that a deployed application is running exactly the code you expect by checking its cryptographic attestation.

## Verification modes

### Reproduce mode (recommended)

Rebuilds the application locally and compares PCR values:

```bash
caution verify --reproduce <app-id>
```

This mode:

1. Clones the source repository
2. Builds an identical enclave locally
3. Extracts PCR values from your local build
4. Fetches the attestation document from the running enclave
5. Compares PCR values to verify integrity

### PCR file mode

Compares against known PCR values:

```bash
caution verify --pcrs <path-to-pcrs.json> <app-id>
```

Use this when you have pre-computed PCR values from a trusted build.

## What gets verified

| PCR | Measures |
|-----|----------|
| PCR0 | Enclave image (firmware, bootloader) |
| PCR1 | Linux kernel and boot ramdisk |
| PCR2 | Application code and configuration |

## Output

```bash
$ caution verify --reproduce my-api
Fetching attestation from https://my-api.caution.app:5000/attestation...
Building enclave locally...
Comparing PCR values...

PCR0: ✓ Match
PCR1: ✓ Match
PCR2: ✓ Match

✓ Verification successful
  The running enclave matches the source code.
```

## Troubleshooting

### PCR mismatch

If verification fails, possible causes:

- Non-deterministic build (timestamps, random UUIDs)
- Different build environment
- Code was modified after deployment

See [Deterministic Applications](../guides/deterministic-apps.md) for fixing build reproducibility.

### Debug mode detected

If PCR values indicate debug mode, the enclave is running in development mode and should not be trusted for production.

## See also

- [Verifiability concepts](../concepts/verifiability.md) - How verification works
- [PCR Values Explained](../reference/pcr-values.md) - Understanding PCRs
- [Attestation Document Format](../reference/attestation-format.md) - Technical details
