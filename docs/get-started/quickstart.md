---
icon: lucide/zap
---

# Get started

Caution is a verifiable compute platform for deploying applications with cryptographic proof of execution integrity. It's built on AWS Nitro Enclaves and reproducible builds, providing trust without relying on the infrastructure operator.

*You can learn more about how Caution works in the [Concepts](../concepts/index.md) section.*

## Installation

Caution is written in Rust and distributed as a single binary. We recommend using the install script for the simplest setup.

!!! info "Prerequisites"

    You need a FIDO2-compatible security key (like YubiKey) or platform authenticator (Touch ID, Windows Hello) for authentication. Caution uses passwordless authentication exclusively.

### Install with script

=== "macOS"

    Open a terminal and run the install script:

    ```bash
    curl -fsSL https://caution.co/install.sh | sh
    ```

=== "Linux"

    Open a terminal and run the install script:

    ```bash
    curl -fsSL https://caution.co/install.sh | sh
    ```

=== "Windows"

    Download the latest release from the [releases page](https://codeberg.org/caution/platform/releases) and add it to your PATH.

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

### Create an account

Register for a Caution account using your security key:

```bash
caution register
```

You'll be prompted for:

1. Your email address
2. A beta code (during early access)
3. Touch your security key to complete registration

### Add your SSH key

Add your SSH key for git-based deployments:

```bash
caution ssh-keys add ~/.ssh/id_ed25519.pub
```

## Deploy your first app

### Initialize a project

Navigate to your project directory and initialize it for Caution:

```bash
cd my-app
caution init
```

This creates:

- A `Procfile` defining how your app runs
- A `.caution/` directory for deployment metadata
- A `caution` git remote

### Configure the Procfile

Edit your `Procfile` to specify how your application runs:

```procfile
web: ./my-app --port $PORT
```

See the [Procfile reference](../reference/procfile.md) for all options.

### Deploy

Commit your changes and push to deploy:

```bash
git add .
git commit -m "Add Caution configuration"
git push caution main
```

Your application is now building and deploying to a Nitro Enclave.

### Verify the deployment

Once deployed, verify that the running code matches your source:

```bash
caution verify --reproduce <app-id>
```

This rebuilds the enclave locally and compares the cryptographic measurements (PCRs) with the running instance.

## Next steps

<div class="grid cards" markdown>

- :lucide-shield-check: **[Verifying Apps](verifying-apps.md)**

    Learn more about the verification process.

- :lucide-lightbulb: **[Concepts](../concepts/index.md)**

    Understand reproducibility, verifiability, and Nitro Enclaves.

- :lucide-terminal: **[CLI Reference](../cli/index.md)**

    Explore all available commands.

</div>
