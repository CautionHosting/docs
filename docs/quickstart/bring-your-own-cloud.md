---
icon: lucide/server
---

# Get started with bring your own cloud

Deploy Caution enclaves in your own AWS infrastructure while Caution handles the build and deployment orchestration.
{: .docs-home-intro }

## What is bring your own cloud?

Bring your own cloud (BYOC) lets you run confidential enclaves in your own AWS account. A one-time setup script creates isolated AWS infrastructure and a role that can only interact with resources tagged for Caution, then Caution manages deployments within that environment. For full details, see the [bring your own cloud reference](../reference/bring-your-own-cloud.md).

!!! info "Current platform support"
    Caution currently supports deployments on AWS Nitro Enclaves. We are actively working on support for Intel TDX, AMD SEV-SNP, and TPM 2.0 attestations.

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
| AWS credentials | For the AWS account where Caution will provision tagged resources |

AWS credentials should use a least-privilege IAM role when possible. See [bring-your-own-cloud-setup](https://codeberg.org/caution/bring-your-own-cloud-setup) for guidance. Admin credentials can be used as an alternative.

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

## Set up your AWS environment

Choose how you want to provision the AWS environment for bring your own cloud deployments. Both paths continue through the Caution CLI for app registration, Git-based deployment, and verification.

### CLI-guided provisioning (recommended)

Use this path if you want Caution to provision AWS infrastructure and register deployment credentials automatically.

From your application directory, run:

```bash
caution init --managed-on-prem
```

This command detects your AWS credentials, provisions the required AWS infrastructure, creates your app on Caution, and registers the deployment credentials automatically.

### Manual provisioning

Use this path if you want more control over the AWS infrastructure setup before registering the deployment configuration with Caution.

From a working directory, run:

```bash
git clone https://codeberg.org/caution/bring-your-own-cloud-setup.git
cd bring-your-own-cloud-setup

cp .env.example .env
# Edit .env with your AWS credentials

docker build -t caution-provisioner-setup .

docker run --rm \
  --env-file .env \
  -v "$(pwd)/out:/out" \
  caution-provisioner-setup
```

This provisions the required AWS infrastructure and writes `credentials.json.gpg` to the `out/` directory.

!!! note "Use an existing VPC (Optional)"
    If you want Caution to provision resources in an existing VPC (Virtual Private Cloud) instead of creating a new one, set `VPC_ID=vpc-xxxxxxxx` in your `.env` file before running the Docker command.

To use the generated encrypted credentials, return to your application directory and run:

```bash
caution init --managed-on-prem --config /path/to/credentials.json.gpg
```

## What the setup creates

The setup flow creates an isolated environment for running enclaves in your AWS account:

<div class="byoc-setup-creates-table" markdown>

| Resource | Purpose |
|----------|---------|
| **VPC** | Dedicated `/16` VPC with public subnets across multiple availability zones, internet gateway, and routing |
| **S3 Bucket** | Stores enclave image files (EIFs). Named `caution-<deployment-id>-images` |
| **EC2 Instance Role** | Allows enclave instances to read EIFs from the S3 bucket |
| **Launch Template** | Preconfigured template for enclave instances |
| **Auto Scaling Group** | Manages enclave instances (starts at 0, Caution scales as needed) |
| **Scoped IAM User** | Credentials for Caution, scoped to only these resources |

</div>

## Deploy the application

From your application directory, push the code to Caution:

```bash
git push caution main
```

Caution builds a reproducible enclave image and deploys it into the AWS environment you provisioned.

## Verify the deployment

From your application directory, run the following command to rebuild the image, compare hashes, and confirm exactly what the enclave is running:

```bash
caution verify
```

## Cleanup

To remove the AWS resources created by setup, see the cleanup instructions in the [BYOC repository](https://codeberg.org/caution/bring-your-own-cloud-setup){:target="_blank"}.

## Next steps

Your application is now running in a verified enclave in your own AWS account. Here's what to explore next:

<div class="grid cards" markdown>

- :lucide-server: **BYOC overview**

    ---

    See what stays in your AWS account and what Caution manages in [BYOC](../reference/bring-your-own-cloud.md).

- :lucide-rocket: **Deployment configuration**

    ---

    Review [source verification and networking](../reference/deployment-configuration.md) options.

- :lucide-file-code: **Procfile**

    ---

    Configure how your application [builds, runs, and verifies](../reference/procfile.md).

- :lucide-shield-check: **Verifiability**

    ---

    Learn how Caution [ensures code integrity](../concepts/verifiability.md) from source to production.

</div>
