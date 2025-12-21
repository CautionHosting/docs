---
icon: lucide/list-checks
---

# Requirements

What you need to use Caution.

## System requirements

### Supported platforms

The Caution CLI runs on:

- **Linux** (x86_64, aarch64)
- **macOS** (Apple Silicon, Intel)
- **Windows** (x86_64)

### Dependencies

- **Git** - Required for deploying via `git push`
- **FIDO2 authenticator** - Required for passwordless authentication

## Authentication

Caution uses passwordless authentication with FIDO2/WebAuthn. You'll need one of:

- **Hardware security key** (YubiKey, SoloKey, etc.)
- **Platform authenticator** (Touch ID, Face ID, Windows Hello)

## Application requirements

### Supported languages

Caution can deploy any application that:

1. Can be compiled to a Linux binary, or
2. Runs in a supported runtime environment

### Determinism

For full verifiability, applications should be [deterministic](../guides/deterministic-apps.md). This means:

- No timestamps in build artifacts
- Reproducible dependency resolution
- Consistent build environment

## Network requirements

Your application must:

- Listen on the port specified by the `$PORT` environment variable
- Accept incoming TCP connections

Outbound connections are supported through Caution's networking layer. See [Networking](../concepts/networking.md) for details.
