---
icon: lucide/settings-2
---

# Deployment configuration

<p class="docs-home-intro">Configure shared deployment settings that control how your application runs, is verified, and is exposed across deployment models.</p>

## Source verification

To enable third-party verification and reproducibility of your deployment, you must specify the source repositories in your `Procfile`:

```yaml
app_sources: https://codeberg.org/myorg/myapp
```

| Field | Description |
|-------|-------------|
| `app_sources` | Comma-separated git URLs for your application source code |

These URLs are embedded in the attestation manifest and used to pull all required source code for reproducibility.

Without `app_sources`, third parties cannot independently reproduce and verify your deployment.

## Network connectivity

Caution supports two modes for exposing your application to the network.

### End-to-end encryption (recommended)

For full security, enable end-to-end encryption using [STEVE (Secure Transport Encryption via Enclave)](https://git.distrust.co/public/steve){:target="_blank"}:

```yaml
e2e: true
```

Run the app on port 8083; that is the port STEVE uses to establish a proxy connection.

This requires:

1. **Procfile configuration**: Set `e2e: true` and specify your application port
2. **SDK integration**: Integrate the [STEVE SDK](https://git.distrust.co/public/steve#usage){:target="_blank"} into your client application

With e2e enabled, data is encrypted on the client and only decrypted inside the enclave. The STEVE proxy runs on port 8080 inside the enclave and forwards decrypted traffic to your application.

See the [Encryption](../concepts/encryption.md) concepts page for details on how STEVE works.

### Direct port exposure

If you cannot use end-to-end encryption, you can expose ports directly:

```yaml
run: /app/server --port 8080
ports: 8080
```

When a single port is specified, it is automatically reverse-proxied through Caddy with TLS termination on port 443. For multiple ports, use `http_port` to specify which one Caddy should proxy. The rest are exposed as raw TCP (useful for P2P or binary protocols).

This establishes a connection from the enclave to the host without STEVE encryption. Traffic is still protected by TLS, but the encryption terminates outside the enclave rather than inside it.

Use this only when e2e encryption is not feasible for your use case.

## Reproducibility requirements

For full verifiability benefits, your application must be reproducible. A reproducible build produces bit-for-bit identical outputs from the same inputs, allowing anyone to verify that your deployed binary matches your source code.

Without reproducibility, attestation can only prove that the deployment hasn't changed. It cannot prove that it matches specific source code.

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

- :lucide-file-code: **Procfile**

    ---

    Configure how your application [builds, runs, and verifies](procfile.md).

- :lucide-shield-check: **Verifiability**

    ---

    Learn how Caution [ensures code integrity](../concepts/verifiability.md) from source to production.

</div>
