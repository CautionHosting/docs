---
icon: lucide/globe
---

# Custom domains

Use your own domain name for Caution deployments.

## Overview

Caution allows you to point your own domain to your deployment. This involves two steps:

1. Configure the domain in your `Procfile`
2. Create a DNS A record pointing to your deployment's IP address

## Step 1: Configure your Procfile

Add the `domain` field to your `Procfile`:

```
domain: api.yourdomain.com
```

## Step 2: Get your deployment IP

After deploying your application, retrieve the IP address using either method:

### Using the CLI

```bash
caution apps get <app-name>
```

The output includes your deployment's IP address.

### Using the UI

Navigate to your application in the Caution dashboard. The deployment IP is displayed in the application details.

## Step 3: Create DNS A record

At your DNS provider, create an A record:

| Record type | Host | Value |
|-------------|------|-------|
| A | `api` | `<deployment-ip>` |

For a root domain:

| Record type | Host | Value |
|-------------|------|-------|
| A | `@` | `<deployment-ip>` |

DNS propagation typically takes a few minutes to a few hours depending on your provider and TTL settings.

## Notes

- TLS certificates are automatically provisioned for your custom domain
- Only one domain per deployment is currently supported
- The domain must be configured before deployment for TLS to work correctly
