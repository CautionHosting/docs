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

To terminate TLS inside the enclave while remaining compatible with ordinary HTTPS clients, enable Attested TLS with `mode = "tls"`. This also requires outbound egress for certificate issuance:

```hcl
network {
  egress {
    cidr_ipv4 = "0.0.0.0/0"
  }
  http {
    domain = "api.yourdomain.com"
    port   = 8080
    e2e_encryption {
      mode = "tls"
    }
  }
}
```

For a gRPC service, also set `upstream_protocol = "h2c"` in the `http` block so the enclave TLS proxy uses cleartext HTTP/2 when forwarding to your application:

```hcl
http {
  domain            = "grpc.yourdomain.com"
  port              = 50051
  upstream_protocol = "h2c"
  e2e_encryption {
    mode = "tls"
  }
}
```

The application must serve plaintext gRPC (h2c) on the configured port. TLS terminates inside the enclave before Caddy forwards the request to the application.

!!! danger "Verify Attested TLS continuously"
    Ordinary HTTPS clients do not verify the Nitro attestation. Periodically run `caution verify` to enforce the expected PCRs and the authenticated live-certificate binding. See [Deployment configuration](../reference/deployment-configuration.md#attested-tls-compatibility-mode).

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
