---
icon: lucide/download
---

# Installation

Install the Caution CLI to start deploying verifiable applications.

## Quick install

```bash
curl -fsSL https://caution.co/install.sh | sh
```

## Manual installation

### From releases

Download the latest release for your platform from the [releases page](https://codeberg.org/caution/platform/releases).

### From source

```bash
git clone https://codeberg.org/caution/platform.git
cd platform
cargo build --release -p caution-cli
```

The binary will be at `target/release/caution`.

## Verify installation

```bash
caution --version
```

## Requirements

- A FIDO2-compatible security key or platform authenticator (Touch ID, Windows Hello)
- Git (for deployment via `git push`)

## Next steps

- [Register an account](../cli/register.md)
- [Deploy your first app](quickstart.md)
