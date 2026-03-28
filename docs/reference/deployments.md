---
icon: lucide/rocket
---

# Deployments

Deployment and configuration options that affect how your application runs and can be verified.

## Deployment options

Caution supports multiple ways to deploy your application. Both options provide the same verification and encryption guarantees.

<div class="grid cards" markdown>

- **[Fully managed](fully-managed.md)**

    Deploy using Caution's managed infrastructure.

- **[Managed on-premises](managed-on-premises.md)**

    Deploy to your own infrastructure, with Caution managing the enclave lifecycle.

</div>

Choose fully managed to get started quickly, or managed on-premises if you need control over your own infrastructure.

!!! info "Self-host Caution"
    Caution is fully open source. If you prefer to self-host and try the platform independently, see the [source code on Codeberg](https://codeberg.org/caution){:target="_blank"}.

## Source verification

To enable third-party verification and reproducibility of your deployment, you must specify the source repositories in your `Procfile`:

```
app_sources: https://codeberg.org/myorg/myapp
```

| Field | Description |
|-------|-------------|
| `app_sources` | Comma-separated git URLs for your application source code |

These URLs are embedded in the manifest field which is part of attestations, and is used to pull in all required source code to reproduce software.

Without source fields, third parties cannot independently reproduce and verify your deployment.

## Network connectivity

Caution supports two modes for exposing your application to the network.

### End-to-end encryption (recommended)

For full security, enable end-to-end encryption using [STEVE (Secure Transport Encryption via Enclave)](https://git.distrust.co/public/steve){:target="_blank"}:

```
e2e: true
```

Run the app on port 8083, that's the port STEVE uses to establish a proxy connection.

This requires:

1. **Procfile configuration**: Set `e2e: true` and specify your application port
2. **SDK integration**: Integrate the [STEVE SDK](https://git.distrust.co/public/steve#usage){:target="_blank"} into your client application

With e2e enabled, data is encrypted on the client and only decrypted inside the enclave. The STEVE proxy runs on port 8080 inside the enclave and forwards decrypted traffic to your application.

See the [Encryption](../concepts/encryption.md) concepts page for details on how STEVE works.

### Direct port exposure (not recommended)

If you cannot use end-to-end encryption, you can expose ports directly:

```
run: /app/server --port 8080
ports: 8080
```

When a single port is specified, it is automatically reverse-proxied through Caddy with TLS termination on port 443. For multiple ports, use `http_port` to specify which one Caddy should proxy — the rest are exposed as raw TCP (useful for P2P or binary protocols).

This establishes a connection from the enclave to the host without STEVE encryption. Traffic is still protected by TLS, but the encryption terminates outside the enclave rather than inside it.

Use this only when e2e encryption is not feasible for your use case.

## Reproducibility requirements

For full verifiability benefits, your application must be reproducible. A reproducible build produces bit-for-bit identical outputs from the same inputs, allowing anyone to verify that your deployed binary matches your source code.

Without reproducibility, attestation can only prove that the deployment hasn't changed—not that it matches specific source code.

### Making your application reproducible

To build reproducible applications, use [StageX](https://stagex.tools){:target="_blank"}, a Linux distribution designed for full-source bootstrapping and deterministic builds. While other Linux distributions can be used, StageX is recommended as it was designed as a security first distribution.

See [Verifiability](../concepts/verifiability.md) for more on why reproducibility matters for confidential compute.

## See also

<div class="grid cards" markdown>

- :lucide-box: **Containerizing your app**

    ---

    Follow a [practical guide](containerizing.md) to building reproducible containers with StageX.

- :lucide-globe: **Custom domains**

    ---

    Use your own [domain name](custom-domains.md) for deployments.

- :lucide-file-code: **Procfile reference**

    ---

    Configure how your application [builds and runs](procfile.md).

- :lucide-shield-check: **Verifiability**

    ---

    Learn why [reproducibility matters](../concepts/verifiability.md) for code integrity in confidential compute.

</div>
