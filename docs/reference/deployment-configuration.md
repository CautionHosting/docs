---
icon: lucide/settings-2
---

# Deployment configuration

<p class="docs-home-intro">Configure shared deployment settings that control how your application runs, is verified, and is exposed across deployment models.</p>

## Source verification

To enable third-party verification and reproducibility of your deployment, you must specify the source repositories in your [`caution.hcl`](caution-hcl.md):

```hcl
enclave "main" {
  build {
    app_sources = ["https://codeberg.org/myorg/myapp"]
  }
}
```

| Field | Description |
|-------|-------------|
| `app_sources` | List of git URLs for your application source code |

These URLs are embedded in the attestation manifest and used to pull all required source code for reproducibility.

Without `app_sources`, third parties cannot independently reproduce and verify your deployment.

## Network connectivity

Caution supports two modes for exposing your application to the network.

### End-to-end encryption (recommended)

For full security, enable end-to-end encryption using [STEVE (Secure Transport Encryption via Enclave)](https://git.distrust.co/public/steve){:target="_blank"}. Add an `e2e_encryption` block inside `http`:

```hcl
network {
  ingress {
    cidr_ipv4 = "0.0.0.0/0"
    port      = 3000
  }
  http {
    domain = "your-domain.xyz"
    port   = 3000
    e2e_encryption {
      enabled = true
    }
  }
}
```

Run the app on any unreserved port. The reserved app-facing range is `49500`-`49600`; STEVE uses port `49500` for the `/e2p/*` proxy path.

This requires:

1. **`caution.hcl` configuration**: Set `e2e_encryption { enabled = true }` and front the application port with `http`
2. **SDK integration**: Integrate the [STEVE SDK](https://git.distrust.co/public/steve#usage){:target="_blank"} into your client application

With e2e enabled, data is encrypted on the client and only decrypted inside the enclave. The STEVE proxy uses reserved port `49500` inside the enclave and forwards decrypted traffic to your application.

See the [Encryption](../concepts/encryption.md) concepts page for details on how STEVE works.

### Direct port exposure

If you cannot use end-to-end encryption, you can expose ports directly. This example uses port `3000` only as a placeholder:

```hcl
network {
  ingress {
    cidr_ipv4 = "0.0.0.0/0"
    port      = 3000
  }
  http {
    domain = "your-domain.xyz"
    port   = 3000
  }
}
```

Use the port your application listens on. Do not declare ports in Caution's reserved `49500`-`49600` range.

Each port your app exposes needs an `ingress` rule. The port named in `http` is reverse-proxied through Caddy with TLS termination on port 443; any other `ingress` ports are exposed as raw TCP (useful for P2P or binary protocols).

This establishes a connection from the enclave to the host without STEVE encryption. Traffic is still protected by TLS, but the encryption terminates outside the enclave rather than inside it.

Use this only when e2e encryption is not feasible for your use case.

## Reproducibility requirements

For full verifiability benefits, your application must be reproducible. A reproducible build produces bit-for-bit identical outputs from the same inputs, allowing anyone to verify that your deployed binary matches your source code.

Without reproducibility, attestation can only prove that the deployment hasn't changed. It cannot prove that it matches specific source code.

### Container build inputs

Caution uses the same Docker build shape for deployment and verification:

```bash
docker build -f <containerfile> .
```

The build context is the repository root, and extra Docker build arguments are not part of the Caution workflow. Values that affect the build output must be visible in the Containerfile, default `ARG` values, `ENV` instructions, or files copied into the image. This keeps the build inputs reviewable and reproducible. Use [Locksmith](../concepts/key-services.md) instead of image-baked values for secrets.

### Making your application reproducible

To build reproducible applications, use [StageX](https://stagex.tools){:target="_blank"}, a Linux distribution designed for full-source bootstrapping and deterministic builds. While other Linux distributions can be used, StageX is recommended because it was designed as a security-first distribution.

See [Verifiability](../concepts/verifiability.md) for more on why reproducibility matters for confidential compute.

## See also

<div class="grid cards" markdown>

- :lucide-box: **Containerize an application**

    ---

    Follow a [practical guide](../guides/containerize-an-application.md) to building reproducible containers with StageX.

- :lucide-globe: **Set up a custom domain**

    ---

    Use your own [domain name](../guides/set-up-a-custom-domain.md) for deployments.

- :lucide-file-code: **caution.hcl**

    ---

    Configure how your application [runs and verifies](caution-hcl.md).

- :lucide-shield-check: **Verifiability**

    ---

    Learn how Caution [ensures code integrity](../concepts/verifiability.md) from source to production.

</div>
