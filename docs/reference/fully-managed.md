---
icon: lucide/cloud
---

# Fully managed

Deploy to Caution's infrastructure with zero setup. Caution handles everything from builds to hosting.

## Overview

Fully managed deployments run on Caution's infrastructure. You push code, and Caution builds, deploys, and hosts your application in a secure enclave.

**Caution handles:**

- Infrastructure and billing
- Building your application
- Deploying and hosting enclaves
- Network configuration and routing

**You control:**

- Your application source code
- Procfile configuration
- Custom domain (optional)

## Prerequisites

| Requirement | Details |
|-------------|---------|
| Alpha access code | Request access at [info@caution.co](mailto:info@caution.co) |
| Smart card | YubiKey, NitroKey, or LibremKey |
| Operating system | Linux x86_64 |
| Git | For cloning and pushing repositories |
| Docker | With [containerd image store enabled](https://docs.docker.com/engine/storage/containerd/){:target="_blank"} |
| Containerized app | Your application must be [containerized](containerizing.md) |

## Setup

### 1. Install the CLI

Follow the installation instructions in the [CLI README](https://codeberg.org/caution/platform/src/branch/main/src/cli/README.md){:target="_blank"}.

### 2. Create an account

Register with your alpha access code and smart card:

```bash
caution register --alpha-code <your_code>
```

Or register via the browser at [alpha.caution.co](https://alpha.caution.co/){:target="_blank"}.

### 3. Add an SSH key

Register your SSH key to authenticate deployments:

```bash
caution ssh-keys add --from-agent
```

You can also add an SSH key in the browser.

## Deploying an application

### 1. Initialize your application

From your application directory:

```bash
caution init
```

This creates a `Procfile` that defines how to build and run your application. See the [Procfile reference](procfile.md) for configuration options.

### 2. Configure your Procfile

At minimum, specify how to run your application:

```
run: /app/server
```

For source verification, add your repository URL:

```
run: /app/server
app_sources: https://codeberg.org/myorg/myapp
```

### 3. Deploy

Push your code to Caution:

```bash
git push caution main
```

Caution builds a reproducible enclave image and deploys it.

### 4. Verify the deployment

Confirm the running code matches your source:

```bash
caution verify
```

## When to use fully managed

Fully managed works well when:

- You want to get started quickly without infrastructure setup
- You don't have specific data residency requirements
- You prefer Caution to handle operational concerns

## When to consider managed on-premises

Consider [managed on-premises](managed-on-premises.md) if you need:

- Data to reside in your own AWS account
- Control over your AWS billing
- Specific network or compliance requirements

## See also

<div class="grid cards" markdown>

- :lucide-box: **Containerizing your app**

    ---

    Follow a [practical guide](containerizing.md) to building reproducible containers with StageX.

- :lucide-file-code: **Procfile reference**

    ---

    Configure how your application [builds and runs](procfile.md).

- :lucide-globe: **Custom domains**

    ---

    Use your own [domain name](custom-domains.md) for deployments.

- :lucide-rocket: **Deployments**

    ---

    Configure [source verification and networking](deployments.md) options.

</div>
