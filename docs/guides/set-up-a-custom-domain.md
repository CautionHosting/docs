---
icon: lucide/globe
---

# Set up a custom domain

<p class="docs-home-intro">Point your own domain to a Caution deployment.</p>

## Overview

Caution allows you to point your own domain to your deployment. This involves two steps:

1. Configure the domain in your `caution.hcl`
2. Create a DNS A record pointing to your deployment's IP address

## Step 1: Configure your caution.hcl

Set `domain` in the `http` block, fronting the port your app listens on:

```hcl
network {
  ingress {
    cidr_ipv4 = "0.0.0.0/0"
    port      = 8080
  }
  http {
    domain = "api.yourdomain.com"
    port   = 8080
  }
}
```

To terminate TLS inside the enclave while remaining compatible with ordinary HTTPS clients, enable Attested TLS with the current `mode = "caddy"` configuration value. This also requires outbound egress for certificate issuance:

```hcl
network {
  egress {
    cidr_ipv4 = "0.0.0.0/0"
  }
  http {
    domain = "api.yourdomain.com"
    port   = 8080
    e2e_encryption {
      mode = "caddy"
    }
  }
}
```

!!! danger "Verify Attested TLS continuously"
    Ordinary HTTPS clients do not verify the Nitro attestation. Periodically compare the live leaf certificate's SHA-256 fingerprint with authenticated `user_data.tls.certfp`, together with expected-PCR verification. See [Deployment configuration](../reference/deployment-configuration.md#attested-tls-compatibility-mode) for the required procedure.

## Step 2: Get your deployment IP

After deploying your application, retrieve the IP address using either method:

### Using the CLI

```bash
# From your app directory (uses .caution/deployment)
caution apps get

# Or specify an app ID directly
caution apps get <app-id>
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
- For Attested TLS, point DNS directly to the deployment and disable any CDN or proxy TLS termination
