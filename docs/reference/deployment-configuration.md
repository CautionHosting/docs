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

### Attested TLS compatibility mode

Attested TLS terminates standard TLS inside the enclave and works with ordinary HTTPS clients without an attestation-aware SDK. Caution attests the TLS certificate by placing the SHA-256 fingerprint of its DER-encoded leaf certificate in the authenticated Nitro `user_data.tls.certfp` field. The HCL selector is `mode = "tls"`; the authenticated metadata currently identifies the Caddy implementation with `user_data.tls.mode = "caddy"`.

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

!!! danger "Attested TLS requires periodic external verification"
    Attested TLS is a compatibility mode, not a replacement for STEVE or RA-TLS. STEVE provides application-layer encryption with an attestation-aware client. RA-TLS binds attestation evidence into TLS authentication so a compatible client verifies it during the handshake. Attested TLS does neither: an ordinary client verifies only the usual WebPKI certificate.

    To rely on Attested TLS, regularly verify fresh Nitro evidence against reviewed source or expected PCR0, PCR1, and PCR2. Require `user_data.tls.mode` to be `caddy`, require `user_data.tls.domain` to match the requested hostname, and compare `user_data.tls.certfp` with the SHA-256 fingerprint of the leaf certificate presented by that endpoint. Missing, malformed, or unequal values leave the endpoint unverified.

Set the domain and print the SHA-256 digest of the live leaf certificate in DER form:

```sh
DOMAIN=app.example.com

openssl s_client -connect "${DOMAIN}:443" -servername "${DOMAIN}" \
  -verify_return_error -verify_hostname "${DOMAIN}" </dev/null 2>/dev/null |
  openssl x509 -outform DER |
  openssl dgst -sha256
```

Then verify the enclave:

```sh
caution verify --attestation-url "https://${DOMAIN}/attestation"
```

After verifying the AWS Nitro certificate chain, COSE signature, fresh nonce, and expected PCRs, `caution verify` prints the authenticated field:

```text
User data: {"tls":{"mode":"caddy","domain":"app.example.com","certfp":"..."}}
```

The final hexadecimal digest from OpenSSL must equal `certfp`. `caution verify` authenticates and prints `user_data`, but does not automatically compare it with the live TLS certificate. The certificate publisher checks for changes every 60 seconds, so remain fail-closed during a renewal mismatch and retry after the next update.

For continuous enforcement, [Caution Canary](https://codeberg.org/caution/canary){:target="_blank"} supports an Attested TLS profile configured with `--e2e-mode caddy`. It enforces expected PCRs and compares the authenticated fingerprint with the leaf certificate observed on the same TLS connection carrying the `/attestation` response.

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
