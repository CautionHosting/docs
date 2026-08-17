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

These URLs and the deployed commit are published in the attestation response manifest. By default, verifiers use a local checkout at that commit; `--app-source-url` selects an explicit Git source instead.

Without `app_sources`, third parties cannot independently reproduce and verify your deployment.

## Network connectivity

Caution supports three ways to expose your application to the network.

### STEVE end-to-end encryption (recommended)

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
      mode         = "steve"
      key_exchange = "x25519"
    }
  }
}
```

Run the app on any unreserved port. The reserved app-facing range is `49500`-`49600`; STEVE uses port `49500` for the `/e2p/*` proxy path.

This example pins the default X25519 suite explicitly. Browser clients on another origin also require an exact `cors_origins` entry; wildcard origins are rejected.

This requires:

1. **`caution.hcl` configuration**: Set `e2e_encryption { mode = "steve" }` and front the application port with `http`
2. **Client integration**: Use the native Rust SDK, STEVE CLI, or browser SDK and pin the deployment's key-exchange suite
3. **Workload policy**: Native clients must use independently verified pinned PCRs or explicitly chosen durable TOFU

Requests sent through an active, correctly configured STEVE v2 client are encrypted on the client and only decrypted inside the enclave. The STEVE proxy uses reserved port `49500` inside the enclave and forwards decrypted traffic to your application.

#### Key exchange

`key_exchange` fixes one suite for the deployment. X25519 is the default. To use X-Wing draft-10 instead:

```hcl
e2e_encryption {
  mode         = "steve"
  key_exchange = "xwing-draft10"
}
```

Configure the client with the matching identifier:

| `caution.hcl` | Browser SDK | Rust SDK |
|---------------|-------------|----------|
| `"x25519"` | `"X25519"` | `KeyExchangeSuite::X25519` |
| `"xwing-draft10"` | `"XWING-DRAFT10"` | `KeyExchangeSuite::XWingDraft10` |

A mismatch or key-exchange failure aborts the session. STEVE does not negotiate suites or fall back from X-Wing to X25519.

For X-Wing browser clients, deploy the complete matching SDK `dist/` tree, including `register.js`, `enclave-sw.js`, and `xwing/steve_xwing_wasm_bg.wasm`, and pin `expectedKeyExchange: "XWING-DRAFT10"`. The Platform configures the enclave suite but does not supply browser assets.

#### CORS

If a browser application calls STEVE from a different origin, list the browser application's exact origin in `cors_origins`:

```hcl
e2e_encryption {
  mode         = "steve"
  cors_origins = ["https://app.example.com"]
}
```

Origins include the scheme, host, and optional port. `http://localhost:3000` and `http://127.0.0.1:3000` are different origins and must be listed separately when both are used. Wildcard origins are rejected.

STEVE applies this policy only to `/e2p/v2/*`. Without `cors_origins`, STEVE sends no CORS headers and cross-origin browser requests to those endpoints fail.

For a separate browser origin, set the SDK's `enclaveOrigin` to the deployment origin as well as listing the browser origin in `cors_origins`.

#### Plaintext fallback

STEVE rejects ordinary plaintext application requests by default with `403 {"error":"e2e_required"}` and `Cache-Control: no-store`, without contacting the application. It still permits `GET /`, plus `GET` or `HEAD` requests for the fixed browser bootstrap assets (`enclave-sw.js`, `register.js`, `attestation-widget.js`, and the X-Wing WASM), so a default-scope service worker can start. The platform health endpoint at `/.well-known/caution/health` and `/attestation` also remain public. These narrow exceptions are not protected application routes; custom scopes or asset paths need equivalent narrow ingress routing.

For legacy applications that intentionally retain plaintext forwarding, opt in explicitly:

```hcl
e2e_encryption {
  mode                     = "steve"
  allow_plaintext_fallback = true
}
```

Requests that bypass the STEVE SDK are not end-to-end encrypted. Keep `allow_plaintext_fallback` disabled or omit it for protected deployments.

The configured application HTTP port remains an enclave-local upstream. Caution does not expose that port through a host HTTP VSOCK proxy or a separate enclave VSOCK port proxy in STEVE mode. Additional ingress ports are independent raw interfaces and are not protected by STEVE; do not send sensitive plaintext over them.

See [Use STEVE clients](../guides/use-steve-clients.md) for browser, CLI, and native integration, including pinned PCRs, upgrade allowlists, and TOFU. See [Encryption](../concepts/encryption.md) for the trust model.

### Attested TLS compatibility mode

Attested TLS is Caution's end-to-end encryption compatibility mode for browsers and other ordinary HTTPS clients that cannot integrate STEVE-specific code. It preserves the standard HTTPS client contract while terminating TLS inside the enclave. Caution attests the TLS certificate by placing the SHA-256 fingerprint of its DER-encoded leaf certificate in the authenticated Nitro `user_data.tls.certfp` field. The HCL selector and authenticated metadata use `mode = "tls"`.

Enable it with `mode = "tls"`:

```hcl
network {
  ingress {
    cidr_ipv4 = "0.0.0.0/0"
    port      = 3000
  }
  egress {
    cidr_ipv4 = "0.0.0.0/0"
  }
  http {
    domain = "app.example.com"
    port   = 3000
    e2e_encryption {
      mode = "tls"
    }
  }
}
```

The domain must resolve directly to the deployment, the application port must have an `ingress` rule, and outbound egress is required for certificate issuance. Do not place a CDN or other TLS-terminating proxy in front of the deployment.

#### gRPC services

Attested TLS can front a gRPC service. Set `upstream_protocol = "h2c"` so Caddy uses cleartext HTTP/2 for the enclave-local connection to the application:

```hcl
network {
  ingress {
    cidr_ipv4 = "0.0.0.0/0"
    port      = 50051
  }
  egress {
    cidr_ipv4 = "0.0.0.0/0"
  }
  http {
    domain            = "grpc.example.com"
    port              = 50051
    upstream_protocol = "h2c"
    e2e_encryption {
      mode = "tls"
    }
  }
}
```

The gRPC client connects to `grpc.example.com:443` using normal TLS and HTTP/2. Your application must listen for plaintext gRPC (h2c) on port `50051`; Caddy terminates TLS inside the enclave and forwards the HTTP/2 stream to that port. Omit `upstream_protocol`, or set it to `"http"`, for an HTTP/1.1 application.

!!! danger "Attested TLS requires periodic and ad hoc external verification"
    Attested TLS is a compatibility mode, not a replacement for STEVE or RA-TLS. It deliberately leaves the client's expectations unchanged: an ordinary client verifies only the usual WebPKI certificate, not Nitro evidence. STEVE provides the stronger client-aware design by using STEVE-specific client code for an application-layer encrypted session bound to fresh Nitro evidence. RA-TLS instead binds attestation evidence into TLS authentication so a compatible client verifies it during the handshake.

    To rely on Attested TLS, carefully verify fresh Nitro evidence against reviewed source and expected PCR0, PCR1, and PCR2 on a regular schedule and after relevant deployment, DNS, or certificate changes. A completed `caution verify` certificate binding requires authenticated `user_data.tls.mode = "tls"`, the configured domain, and a matching lowercase SHA-256 leaf fingerprint. Missing, malformed, or unequal values leave the endpoint unverified.

Run verification from the application repository:

```sh
caution verify --attestation-url "https://app.example.com/attestation"
```

For an HTTPS attestation URL on the configured domain, the CLI disables redirects and compares the authenticated fingerprint with the leaf from that same WebPKI-validated response. Alternatively, pass the raw deployment IP:

```sh
caution verify --attestation-url "http://192.0.2.10/attestation"
```

In the raw-IP flow, DNS must contain that IP. The CLI then makes a hostname-validated health request pinned to it. Empty or NXDOMAIN DNS skips TLS binding; wrong-IP DNS, transient resolver errors, redirects, HTTPS failures, malformed metadata, and fingerprint mismatch fail verification. On the no-DNS skip path, `caution verify` still reports attestation verification passed and writes PCR-only trusted state without a `tls` object. Do not treat that result as Attested TLS verification; configure DNS and rerun. Ordinary HTTPS that is not configured for Attested TLS remains PCR-only.

The certificate publisher checks for changes every 60 seconds, so remain fail-closed during a renewal mismatch and retry after the next update. Do not use `--pcrs` for this check: it intentionally verifies only PCRs and persists no TLS binding.

For continuous enforcement, [Caution Canary](https://codeberg.org/caution/canary){:target="_blank"} supports an Attested TLS profile configured with `--e2e-mode tls`. It enforces expected PCRs and compares the authenticated fingerprint with the leaf certificate observed on the same TLS connection carrying the `/attestation` response.

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

### Custom domain DNS

The `domain` value configures HTTP and TLS routing, but it does not create a
record in your DNS provider. After deployment, point a customer-owned CNAME at
the stable `DNS target` shown by the CLI or dashboard. Do not point an A record
directly at the current Elastic IP: the IP can change on redeployment while the
managed target remains stable. See [Set up a custom domain](../guides/set-up-a-custom-domain.md)
for the complete DNS and lifecycle behavior.

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
