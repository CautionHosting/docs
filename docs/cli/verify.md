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

Lorem ipsum dolor sit amet, consectetur adipiscing elit.

## Verification modes

### Reproduce mode (recommended)

Lorem ipsum dolor sit amet:

```bash
caution verify --reproduce <app-id>
```

Lorem ipsum dolor sit amet:

1. Lorem ipsum dolor sit amet
2. Lorem ipsum dolor sit amet
3. Lorem ipsum dolor sit amet
4. Lorem ipsum dolor sit amet
5. Lorem ipsum dolor sit amet

### PCR file mode

Lorem ipsum dolor sit amet:

```bash
caution verify --pcrs <path-to-pcrs.json> <app-id>
```

Lorem ipsum dolor sit amet.

## What gets verified

| PCR | Measures |
|-----|----------|
| PCR0 | Lorem ipsum dolor sit amet |
| PCR1 | Lorem ipsum dolor sit amet |
| PCR2 | Lorem ipsum dolor sit amet |

## Output

```bash
$ caution verify --reproduce my-api
Fetching attestation...
Building enclave locally...
Comparing PCR values...

PCR0: ✓ Match
PCR1: ✓ Match
PCR2: ✓ Match

✓ Verification successful
```

## Troubleshooting

### PCR mismatch

Lorem ipsum dolor sit amet:

- Lorem ipsum dolor sit amet
- Lorem ipsum dolor sit amet
- Lorem ipsum dolor sit amet

See [Deterministic applications](../guides/deterministic-apps.md).

### Debug mode detected

Lorem ipsum dolor sit amet.

## See also

- [Verifiability concepts](../concepts/verifiability.md)
- [PCR values explained](../reference/pcr-values.md)
- [Attestation document format](../reference/attestation-format.md)
