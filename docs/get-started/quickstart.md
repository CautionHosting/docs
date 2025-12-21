---
icon: lucide/zap
---

# Get started


Caution is a verifiable compute platform for deploying applications with cryptographic proof of execution integrity. Lorem ipsum dolor sit amet, consectetur adipiscing elit.

_You can learn more about how Caution works in the [Concepts](../concepts/index.md) section._

## Installation

Lorem ipsum dolor sit amet, consectetur adipiscing elit.

!!! info "Prerequisites"

    You need a FIDO2-compatible security key (like YubiKey) or platform authenticator (Touch ID, Windows Hello) for authentication. Caution uses passwordless authentication exclusively.

### Install with script

=== ":fontawesome-brands-linux: Linux"

    Open a terminal and run the install script:

    ```bash
    curl -fsSL https://caution.co/install.sh | sh
    ```

=== ":fontawesome-brands-windows: Windows"

    Download the latest release from the [releases page](https://codeberg.org/caution/platform/releases) and add it to your PATH.

=== ":fontawesome-brands-apple: macOS"

    Coming soon.

### Install from source

If you prefer to build from source:

```bash
git clone https://codeberg.org/caution/platform.git
cd platform
cargo build --release -p caution-cli
```

The binary will be at `target/release/caution`.

### Verify installation

```bash
caution --version
```

## Setup

Lorem ipsum dolor sit amet, consectetur adipiscing elit.

### Create an account

Lorem ipsum dolor sit amet, consectetur adipiscing elit.

### Add your SSH key

Lorem ipsum dolor sit amet, consectetur adipiscing elit.

## Deploy your first app

Lorem ipsum dolor sit amet, consectetur adipiscing elit.

### Initialize a project

Lorem ipsum dolor sit amet, consectetur adipiscing elit.

### Configure the Procfile

Lorem ipsum dolor sit amet, consectetur adipiscing elit.

### Deploy

Lorem ipsum dolor sit amet, consectetur adipiscing elit.

### Verify the deployment

Lorem ipsum dolor sit amet, consectetur adipiscing elit.

## Next steps

<div class="grid cards" markdown>

- :lucide-shield-check: **[Verifying apps](verifying-apps.md)**

  Learn more about the verification process.

- :lucide-lightbulb: **[Concepts](../concepts/index.md)**

  Understand reproducibility, verifiability, and secure enclaves.

- :lucide-terminal: **[CLI reference](../cli/overview.md)**

  Explore all available commands.

</div>
