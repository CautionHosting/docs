---
icon: lucide/check-circle
---

# Verifying a Deployed App

Learn how to verify that a deployed application is running the exact code you expect.

## Overview

Caution enables cryptographic verification of deployed applications. This ensures that the code running in production matches what was built and deployed.

## Verification steps

```bash
# Verify a deployed application
caution verify <app-id>
```

## What gets verified

- Source code hash
- Build artifacts
- Runtime environment

## Learn more

- [What is verifiability?](../concepts/verifiability.md)
- [Reproducibility & bootstrapping](../concepts/reproducibility.md)
