---
icon: lucide/zap
---

# Get started

!!! warning "Alpha Software"
    Caution is in alpha. The software is not production ready. APIs, workflows, and features may change without notice.

Caution is a verifiable compute platform for deploying confidential workloads to secure enclaves. This guide walks you through creating an account, installing the CLI, and deploying your first application. It takes about 10 minutes to complete.

## Prerequisites

Before you begin, ensure you have the following:

| Requirement | Details |
|-------------|---------|
| Alpha access code | Request access at [info@caution.co](mailto:info@caution.co) |
| Smart card | YubiKey, NitroKey, or LibremKey |
| Operating system | Linux x86_64 |
| Git | For cloning and pushing repositories ([install](https://git-scm.com/){:target="_blank"}) |
| Docker | With [containerd image store enabled](https://docs.docker.com/engine/storage/containerd/){:target="_blank"} ([install](https://www.docker.com/){:target="_blank"}) |
| Containerized app | Your application must be [containerized](reference/containerizing.md) |


## Install the CLI

Follow the installation instructions in the [CLI README](https://codeberg.org/caution/platform){:target="_blank"}.

## Create an account

Account creation requires a valid alpha access code and a smart card. You can register via the browser or the CLI.

Your smart card will need to have a FIDO pin set on it.

=== "Browser"

    1. Go to [alpha.caution.co](https://alpha.caution.co/){:target="_blank"}
    2. Enter your alpha access code
    3. Insert your smart card / use another Passkey method
    4. Click **Continue**
    5. Approve Passkey interaction when prompted

=== "CLI"

    ```bash
    caution register --alpha-code <your_code>
    ```

If you do not have an alpha access code, request one at [info@caution.co](mailto:info@caution.co).

## Add an SSH key

Register your SSH key with Caution to authenticate deployments:

```bash
caution ssh-keys add --from-agent
```

You can also add an SSH key in the browser.

## Select an application

You can deploy your own containerized application or use one of the [Caution demo apps](https://codeberg.org/caution){:target="_blank"}. For this guide, we'll use the hello-world-enclave:

```bash
git clone https://codeberg.org/caution/demo-hello-world-enclave.git
cd demo-hello-world-enclave
```

## Initialize the application

Run `caution init` to capture the build environment and lock it for reproducible enclave builds:

```bash
caution init
```

This creates a `Procfile` that defines how to run your application and which ports to expose. If you're using one of Caution's demo apps, a `Procfile` is already included. If you're deploying your own application, you'll need to create one—see the [Procfile reference](reference/procfile.md).

## Deploy the application 

Push the code to Caution:

```bash
git push caution main
```

Caution builds a reproducible enclave image and provisions the TEE.

## Verify the deployment

Run `caution verify` to rebuild the image, compare hashes, and confirm exactly what the enclave is running:

```bash
caution verify
```

## Next steps

Your application is now running in a verified enclave. Here's what to explore next:

<div class="grid cards" markdown>

- :lucide-shield-check: **Verifiability**

    ---

    Learn how Caution [ensures code integrity](./concepts/verifiability.md) from source to production.

- :lucide-lock: **Encryption**

    ---

    Protect data all the way into the enclave with [end-to-end encryption](./concepts/encryption.md).

- :lucide-file-code: **Procfile**

    ---

    Configure how your application [builds and runs](reference/procfile.md).

</div>
