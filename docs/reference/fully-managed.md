---
icon: lucide/book-marked
---

# Fully managed

<p class="docs-home-intro">Learn what fully managed includes, what Caution manages, and what you still control.</p>

## Overview

Fully managed deployments run on Caution's infrastructure. You push code, and Caution builds, deploys, and hosts your application in a secure enclave. It is best for teams that want:

- [x] Fastest path to production
- [x] Caution-hosted infrastructure
- [x] Minimal infrastructure setup before your first deployment

For a side-by-side comparison with other deployment options, see [deployment models](deployment-models/).

## Responsibility split

Fully managed means Caution manages the enclave lifecycle and underlying infrastructure, while you retain control over your application and its configuration.

<div class="two-column-list" markdown>
<div markdown>

**Caution handles:**

- Infrastructure and billing
- Application builds
- Enclave lifecycle management
- Network routing and public ingress

</div>
<div markdown>

**You control:**

- Your application source code
- Procfile configuration
- Custom domain (optional)

</div>
</div>

In this model, you keep control of your application code and configuration while Caution operates the deployment environment on your behalf.

## How it works

To deploy with fully managed, you'll need a [containerized application](containerizing.md), Docker with the [containerd image store enabled](https://docs.docker.com/engine/storage/containerd/){:target="_blank"}, and a Caution account.

You will also need a `Procfile` that tells Caution how to run your application. The examples below show a minimal configuration, plus an optional `app_sources` entry for source verification.

```yaml
# Minimal `Procfile`
run: /app/server

# Example with source verification enabled
run: /app/server
app_sources: https://codeberg.org/myorg/myapp
```

Once you have everything in place, the setup flow looks like this:

1. Create an account, install the CLI (Linux (x86_64) or macOS (arm64)), and register an SSH key.
2. Initialize your application with a `Procfile`, then push your code to Caution.
3. Caution builds the enclave image, provisions the deployment, and runs your application in a managed enclave environment.

!!! example "Setup guide"
    For the full step-by-step setup and deployment flow, see the [fully managed guide](../quickstart/fully-managed.md).

## See also

<div class="grid cards" markdown>

- :lucide-server: **Bring your own cloud**

    ---

    Run Caution enclaves in [your own AWS account](bring-your-own-cloud.md).

- :lucide-file-code: **Procfile**

    ---

    Configure how your application [builds, runs, and verifies](procfile.md).

- :lucide-globe: **Set up a custom domain**

    ---

    Use your own [domain name](../guides/set-up-a-custom-domain.md) for deployments.

- :lucide-rocket: **Deployment configuration**

    ---

    Configure [source verification and networking](deployment-configuration.md) options.

</div>
