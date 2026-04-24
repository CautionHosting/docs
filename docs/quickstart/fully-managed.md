---
icon: lucide/cloud
---

# Get started with fully managed

Deploy your first application on Caution's fully managed platform using AWS Nitro Enclaves. Your first deployment should take about 10 minutes.
{: .docs-home-intro }

## What is fully managed?

Fully managed is a deployment model where Caution hosts and operates the deployment environment end to end on Caution-managed infrastructure. For full details, see the [fully managed reference](../reference/fully-managed.md).

## What you need

Before you begin, ensure you have the following:

| Requirement | Details |
|-------------|---------|
| Access code | Request access at [info@caution.co](mailto:info@caution.co) |
| Smart card | YubiKey, NitroKey, or LibremKey |
| Operating system | Linux x86_64 |
| Git | For cloning and pushing repositories ([install](https://git-scm.com/){:target="_blank"}) |
| Docker | With [containerd image store enabled](https://docs.docker.com/engine/storage/containerd/){:target="_blank"} ([install](https://www.docker.com/){:target="_blank"}) |
| Containerized app | Your application must be [containerized](../reference/containerizing.md) |

## Install the CLI

Follow the installation instructions in the [CLI README](https://codeberg.org/caution/platform/src/branch/main/src/cli/README.md){:target="_blank"}.

## Create an account

To create an account, you'll need a valid access code and a smart card with a FIDO PIN configured. You can register in the browser or with the CLI.

If you do not have an access code, request one at [info@caution.co](mailto:info@caution.co).

=== "CLI"

    ```bash
    caution register --alpha-code <your_code>
    ```

=== "Browser"

    1. Go to [dashboard.caution.co](https://dashboard.caution.co/){:target="_blank"}
    2. Enter your access code
    3. Insert your smart card / use another Passkey method
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

Deploy your own [containerized application](../reference/containerizing.md), or start with one of the [Caution demo apps](https://codeberg.org/caution){:target="_blank"}. For this guide, use hello-world-enclave:

```bash
git clone https://codeberg.org/caution/demo-hello-world-enclave.git
cd demo-hello-world-enclave
```

## Initialize the application

From your application directory, run the following command to create a `Procfile` and other data required for the application:

```bash
caution init
```

A `Procfile` defines how to run your application and which ports to expose. If you're using one of Caution's demo apps, a `Procfile` is already included. If you're deploying your own application, you'll need to create one. See the [Procfile reference](../reference/procfile.md).

At minimum, your `Procfile` should specify how to run your application:

```yaml
run: /app/server
```

For source verification, add your repository URL:

```yaml
run: /app/server
app_sources: https://codeberg.org/myorg/myapp
```

## Deploy the application

From your application directory, push the code to Caution:

```bash
git push caution main
```

Caution builds a reproducible enclave image and deploys it into the enclave.

## Verify the deployment

From your application directory, run the following command to rebuild the image, compare hashes, and confirm exactly what the enclave is running:

```bash
caution verify
```

## Next steps

Your application is now running in a verified enclave. Here's what to explore next:

<div class="grid cards" markdown>

- :lucide-settings-2: **Deployment configuration**

    ---

    Configure [source verification and networking](../reference/deployment-configuration.md) options.

- :lucide-globe: **Custom domains**

    ---

    Use your own [domain name](../reference/custom-domains.md) for deployments.

- :lucide-shield-check: **Verifiability**

    ---

    Learn how Caution [ensures code integrity](../concepts/verifiability.md) from source to production.

- :lucide-file-code: **Procfile**

    ---

    Configure how your application [builds, runs, and verifies](../reference/procfile.md).

</div>
