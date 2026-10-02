---
icon: lucide/cloud
---

# Deploy on Caution-managed infrastructure

Deploy your first application on Caution's fully managed platform using AWS Nitro Enclaves. Your first deployment should take about 10 minutes.
{: .docs-home-intro }

## What is fully managed?

Fully managed is a deployment model where Caution hosts and operates the deployment environment end-to-end on Caution-managed infrastructure. For full details, see the [fully managed reference](../reference/fully-managed.md).

!!! info "AWS Nitro support today"
    Caution currently supports deployments on AWS Nitro Enclaves. We are actively working on support for Intel TDX, AMD SEV-SNP, and TPM 2.0 attestations.

## What you need

Before you begin, ensure you have the following:

<div class="quickstart-needs-table" markdown>

| What you'll need | Details |
|------------------|---------|
| Access code | Request access at [info@caution.co](mailto:info@caution.co) |
| Passkey | Browser or platform passkey, password manager passkey, or security key or smart card (YubiKey, NitroKey, or LibremKey) |
| CLI | Supported today on Linux (x86_64) or macOS (arm64) ([install](https://codeberg.org/caution/platform/src/branch/main/src/cli/README.md){:target="_blank"}) |
| Git | For cloning and pushing repositories ([install](https://git-scm.com/){:target="_blank"}) |
| Docker | With [containerd image store enabled](https://docs.docker.com/engine/storage/containerd/){:target="_blank"} ([install](https://www.docker.com/){:target="_blank"}) |
| Containerized app | Your application must be [containerized](../guides/containerize-an-application.md) |

</div>

## Install the CLI

Clone the platform repository and run the automatic installer:

```bash
git clone https://codeberg.org/caution/platform
cd platform
make install-cli
```

On every supported platform (Linux/x86_64 and macOS/arm64) this builds the CLI
with your local host toolchain, after a one-time acknowledgement that the build
is not reproducibility-verified. To build the reproducible StageX CLI instead,
run `make install-cli-stagex` (Linux/x86_64 only). See the [CLI README](https://codeberg.org/caution/platform/src/branch/main/src/cli/README.md){:target="_blank"}
for explicit build targets and verification options.

## Create an account

To create an account, you'll need a valid access code and a passkey. You can register in the browser or with the CLI.

If you do not have an access code, request one at [info@caution.co](mailto:info@caution.co).

=== "CLI"

    ```bash
    caution register --alpha-code <your_code>
    ```

=== "Browser"

    1. Go to [dashboard.caution.co](https://dashboard.caution.co/){:target="_blank"}
    2. Enter your access code
    3. Use your passkey method
    4. Click **Continue**
    5. Approve Passkey interaction when prompted

## Add an SSH key

Add an SSH key so you can authenticate your Caution deployments:

=== "CLI"

    ```bash
    caution ssh-keys add --from-agent
    ```

=== "Browser"

    Add an SSH key from the [browser dashboard](https://dashboard.caution.co/){:target="_blank"}.

## Select an application

Deploy your own [containerized application](../guides/containerize-an-application.md), or start with one of the [Caution demo apps](https://codeberg.org/caution){:target="_blank"}. For this guide, use hello-world-enclave:

```bash
git clone https://codeberg.org/caution/demo-hello-world-enclave.git
cd demo-hello-world-enclave
```

## Initialize the application

From your application directory, run the following command to create a `caution.hcl` and other data required for the application:

```bash
caution init
```

`caution.hcl` defines how to run your application and which ports to expose. If you're using one of Caution's demo apps, a `caution.hcl` is already included. `caution init` generates a template if none exists; customize it for your application. See the [caution.hcl reference](../reference/caution-hcl.md).

Commit the generated `caution.hcl` and `.caution/deployment.json` to your repository. The deployment file stores the Caution app resource ID so CLI commands can infer the target app from the repository.

For your own app, make sure the container builds from the repository root with the standard Docker form:

```bash
docker build -f Containerfile .
```

If you use another file, set `containerfile` in the `build` block and replace `Containerfile` with that path. Caution uses this build shape and does not pass extra build arguments, so public build-time values need to be part of the image inputs. Use [Locksmith](../concepts/key-services.md) for secrets.

At minimum, your `caution.hcl` should specify how to run your application:

```hcl
enclave "main" {
  unit "default" {
    command = "/app/server"
  }
}
```

For source verification, add your repository URL:

```hcl
enclave "main" {
  build {
    app_sources = ["https://codeberg.org/myorg/myapp"]
  }
  unit "default" {
    command = "/app/server"
  }
}
```

## Choose HTTP protection before deploying

The generated template leaves `http` commented out: its ingress port is raw TCP, with no platform-provided TLS. Existing demo configurations may select a different mode; check their `http` and `e2e_encryption` blocks.

For a basic HTTPS demo, add this `network` block inside your existing `enclave` block, replacing any existing `network` block. Use your application's listening port and your own domain:

```hcl
network {
  ingress {
    cidr_ipv4 = "0.0.0.0/0"
    port      = 8080
  }
  http {
    domain = "app.example.com"
    port   = 8080
    # Host TLS termination: e2e_encryption is intentionally omitted.
  }
}
```

!!! warning "This example selects host TLS, not end-to-end encryption"
    TLS terminates on the host, which can read application requests and responses. Do not use this mode for traffic that must remain confidential from the host. Deployment verification does not change this transport boundary.

Choose a protected mode before sending sensitive traffic:

- **[STEVE (recommended)](../reference/deployment-configuration.md#steve-end-to-end-encryption-recommended):** add `e2e_encryption { mode = "steve" }` inside `http` and integrate a [STEVE client](../guides/use-steve-clients.md). Keep plaintext fallback disabled. Requests without STEVE are rejected except for the [documented bootstrap/public endpoints](../reference/deployment-configuration.md#plaintext-fallback).
- **[Attested TLS](../reference/deployment-configuration.md#attested-tls-compatibility-mode):** use `e2e_encryption { mode = "tls" }` for ordinary HTTPS clients. Follow its DNS/egress requirements and periodically verify the live attested certificate binding; ordinary HTTPS clients do not verify Nitro evidence themselves.

Configure [domain DNS](../guides/set-up-a-custom-domain.md) after deployment. Other ingress ports remain raw interfaces and are not protected by the selected HTTP mode.

## Add environment variables

For public runtime values, use string literals in `unit.env` in `caution.hcl`; no key service or quorum setup is needed. See [Public environment variables](../concepts/key-services.md#non-encrypted-environment-variables) for an example and how runtime settings differ from build-time inputs.

For secrets, follow [Key services](../concepts/key-services.md) before deploying: create a quorum bundle, encrypt the values, package the bundle and ciphertext, and reference them with `env::vault`.

Skip this step if your application does not need environment variables.

## Deploy the application

From your application directory, push the code to Caution:

```bash
git push caution main
```

Caution builds a reproducible enclave image with the standard Docker build and deploys it into the enclave.

Deployment output includes a stable `DNS target` for the app. If you configured
a custom domain in `caution.hcl`, create a CNAME from that subdomain to the DNS
target rather than an A record to the current IP. See [Set up a custom
domain](../guides/set-up-a-custom-domain.md).

## Verify the deployment

From your application directory, reproduce the image and verify that the running enclave matches its expected PCRs:

```bash
caution verify
```

Successful verification saves the verified PCR values to `.caution/trusted_hashes.json`. This file is required before sending locksmith shards and can be used by native STEVE clients — commit it alongside your other `.caution/` files.

## Next steps

Your application is now running in a verified enclave. Here's what to explore next:

<div class="grid cards" markdown>

- :lucide-settings-2: **Deployment configuration**

    ---

    Configure [source verification and networking](../reference/deployment-configuration.md) options.

- :lucide-globe: **Set up a custom domain**

    ---

    Use your own [domain name](../guides/set-up-a-custom-domain.md) for deployments.

- :lucide-shield-check: **Verifiability**

    ---

    Learn how Caution [ensures code integrity](../concepts/verifiability.md) from source to production.

- :lucide-file-code: **caution.hcl**

    ---

    Configure how your application [runs and verifies](../reference/caution-hcl.md).

</div>
