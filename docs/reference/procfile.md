---
icon: lucide/file-clock
---

# Procfile reference (legacy)

<p class="docs-home-intro">Configure how your application runs on Caution.</p>

!!! warning "Legacy format"
    The Procfile is still supported as a fallback, but [`caution.hcl`](caution-hcl.md) is the current configuration format and what `caution init` generates. When both files are present, Caution uses `caution.hcl`. To convert an existing Procfile, run `caution apps migrate-procfile`.

## Overview

The `Procfile` is a simple key-value configuration file that tells Caution how to run your application, which container build recipe to use, and what metadata to publish for verification. Place it in the root of your repository.

```yaml
run: /app/server --port 3000
ports: 3000
http_port: 3000
domain: your-domain.xyz
app_sources: https://git.example.com/myorg/myapp
```

## Fields

Use these fields to control how Caution locates container inputs, deploys, runs, and verifies your application. Unless marked required, fields are optional.

### Container input configuration

Use `run` to select the startup command. The current deployment path includes the
full container filesystem; legacy `binary` and `oci_tarball` fields are ignored.

!!! warning "No `build` field or custom build command"
    Procfile does not support a `build` field. Caution builds the application container with `docker build -f <containerfile> .` from the repository root. It does not run a custom pre-build command or pass extra `--build-arg` values. Put required public build-time configuration in the Containerfile or in committed files copied into the image. Do not bake secrets into the image; use [Locksmith](../concepts/key-services.md) for secret values.

<div class="procfile-build-config-table" markdown>

| Field | Description |
|-------|-------------|
| `run` | **Required.** Command to execute your application. The full container filesystem is included in the EIF. |
| `containerfile` | Path to a Containerfile/Dockerfile for building your app. Caution builds it with `docker build -f <containerfile> .` using the repository root as the build context. |

</div>

### Source verification

<div class="procfile-source-verification-table" markdown>

| Field | Description |
|-------|-------------|
| `app_sources` | Comma-separated git URLs for app source verification. Embedded in the enclave manifest for attestation. |

</div>

### Resource allocation

Resource values are defaults if not specified.

| Field | Default | Description |
|-------|---------|-------------|
| `memory` | `512` | Memory allocation in MB. |
| `cpus` | `2` | Number of vCPUs. |

### Features

| Field | Default | Description |
|-------|---------|-------------|
| `domain` | - | Custom subdomain for the deployment. Point its customer-owned CNAME at the stable `DNS target`; see [Set up a custom domain](../guides/set-up-a-custom-domain.md). |
| `e2e` | `false` | Enable STEVE. Ordinary plaintext application routes are rejected by default. |
| `debug` | `false` | Enable [debug mode](debug-enclave/running.md). Allows reading enclave console output but disables attestation verification. |
| `no_cache` | `false` | Disable Docker build cache. |
| `ssh_keys` | - | OpenSSH public keys for [host SSH access](debug-enclave/running.md#add-ssh-access-to-the-host). Full key string, e.g. `ssh-ed25519 AAAA... user@host`. Opens port 22 on the instance. |
| `ports` | - | Comma-separated application ports. With `e2e: true`, the HTTP application port remains enclave-local instead of receiving a separate VSOCK proxy; other ports are exposed through VSOCK and security-group ingress. Do not include ports in the reserved `49500`-`49600` range. |
| `http_port` | - | Port to reverse proxy through Caddy (TLS termination on 443). Must be listed in `ports`. Defaults to the single port if only one is specified. |
| `managed_on_prem` | `false` | Enable bring-your-own-compute (BYOC) deployment settings in Procfile. Requires `platform` and provider-specific configuration. |
| `platform` | - | Compute platform for BYOC. Currently supported value: `aws`. Required when `managed_on_prem: true`. |
| `aws_region` | - | AWS region for BYOC (for example `us-east-1`). Required when `managed_on_prem: true` and `platform: aws`. |
| `aws_vpc_id` | - | Optional existing VPC ID for BYOC deployments. |
| `aws_subnet_id` | - | Optional existing subnet ID for BYOC deployments. |
| `aws_security_group_id` | - | Optional existing security group ID for BYOC deployments. |

Legacy `e2e: true` uses the default X25519 suite and cannot select X-Wing, configure CORS origins, or enable plaintext fallback. Use [`caution.hcl`](caution-hcl.md#encryption-modes) for these STEVE v2 options.

## Reserved ports

The reserved app-facing range is `49500`-`49600`. User apps should not declare ports in that range in `ports`, `http_port`, or application startup commands. Choose the port your app already uses, as long as it is outside the reserved range.

Current reserved/internal service ports:

| Port | Service |
|------|---------|
| `49500` | STEVE proxy for `/e2p/*` traffic (when `e2e: true`) |
| `49501` | Auxiliary internal proxy slot |
| `49502` | bootproofd internal attestation service, proxied to the public `/attestation` path |
| `49504` | Locksmith shard receiver (enabled through HCL `env::vault`, not the ignored Procfile `locksmith` field) |

The public attestation endpoint is the deployment's app URL plus `/attestation`; do not add `:49502` unless your operator explicitly exposes that internal port.

## Examples

Use these examples as starting points. Port `3000` is only a placeholder; adjust commands, ports, and domains to match your application.

### Basic application

```yaml
run: /app/server --port 3000
ports: 3000
http_port: 3000
domain: api.example.com
app_sources: https://git.example.com/example/api
```

### With a custom Containerfile

```yaml
run: /app/server
containerfile: deploy/Containerfile
```

Caution builds this with `docker build -f deploy/Containerfile .` from the repository root.

### With HTTP and TCP ports

```yaml
run: /app/server --rpc-port 8232 --p2p-port 8233
ports: 8232, 8233
http_port: 8232
domain: node.example.com
```

In this example, port 8232 (RPC) is reverse-proxied through Caddy with TLS on port 443. Port 8233 (P2P) gets a vsock proxy and security group rule but is accessed directly as raw TCP.

### With end-to-end encryption

```yaml
run: /app/server --port 3000
domain: secure.example.com
e2e: true
ports: 3000
app_sources: https://git.example.com/example/secure-app
```

Since only one port is specified, it is automatically used as the `http_port`.

The legacy Procfile format has no plaintext-compatibility setting. `e2e: true` therefore uses fail-closed STEVE routing. If a bounded migration requires `allow_plaintext_fallback`, first run `caution apps migrate-procfile` and configure it in `caution.hcl`; keep the option unset for normal deployments.

### Encrypted secrets and unsupported legacy fields

Migrate to `caution.hcl` before enabling encrypted secrets:

```sh
caution apps migrate-procfile
```

Then add `env::vault(...)` references and package the bundle, Keymaker policy and
encrypted values as described in [Add encrypted secrets](../guides/add-encrypted-secrets.md).
The current Procfile parser ignores `locksmith: true`; it does **not** enable
Locksmith or deliver secrets. Migration does not reconstruct these ignored settings
for you: add them explicitly and review the generated HCL before deploying.

The current parser also ignores `binary`, `oci_tarball`, `enclave_sources`, `metadata`
and `aws_instance_type`. Use the supported HCL fields for new deployments. Procfile
cannot express guest egress allowlists, recovery-source restrictions, or the newer
TLS and restart settings.

### Custom resources with multiple ports

```yaml
run: /app/ml-inference
memory: 4096
cpus: 4
ports: 3000, 9000
http_port: 3000
```

With multiple ports, `http_port` is required to specify which port Caddy should reverse proxy. Port 9000 is exposed as raw TCP.

### Bring your own compute (AWS)

```yaml
run: /app/server
managed_on_prem: true
platform: aws
aws_region: us-east-1
```
