---
icon: lucide/file-code
---

# Procfile reference (legacy)

<p class="docs-home-intro">Configure how your application runs on Caution.</p>

!!! warning "Legacy format"
    The Procfile is still supported as a fallback, but [`caution.hcl`](caution-hcl.md) is the current configuration format and what `caution init` generates. When both files are present, Caution uses `caution.hcl`. To convert an existing Procfile, run `caution apps migrate-procfile`.

## Overview

The `Procfile` is a simple key-value configuration file that tells Caution how to run your application, which container build recipe to use, and what metadata to publish for verification. Place it in the root of your repository.

```yaml
run: /app/server
domain: your-domain.xyz
app_sources: https://codeberg.org/myorg/myapp
```

## Fields

Use these fields to control how Caution locates container inputs, deploys, runs, and verifies your application. Unless marked required, fields are optional.

### Container input configuration

!!! warning "Use `run` by default"
    The `binary` field extracts only the specified binary from your container. It does not include config files, shared libraries, or other filesystem contents in the EIF. Use `binary` only for fully self-contained static binaries. For most applications, use `run`, which includes the full container filesystem in the EIF.

!!! warning "No `build` field or custom build command"
    The legacy `build` Procfile field is no longer available. Caution builds the application container with `docker build -f <containerfile> .` from the repository root. It does not run a custom pre-build command or pass extra `--build-arg` values. Put required public build-time configuration in the Containerfile or in committed files copied into the image. Do not bake secrets into the image; use [Locksmith](../concepts/key-services.md) for secret values.

<div class="procfile-build-config-table" markdown>

| Field | Description |
|-------|-------------|
| `run` | **Required.** Command to execute your application. The full container filesystem is included in the EIF. |
| `containerfile` | Path to a Containerfile/Dockerfile for building your app. Caution builds it with `docker build -f <containerfile> .` using the repository root as the build context. |
| `oci_tarball` | Path to a pre-built OCI tarball. |
| `binary` | Path to a static binary in the container. **Only that binary is extracted.** The rest of the container filesystem is not included in the EIF. Use this only for fully self-contained static binaries that do not depend on config files, shared libraries, or other files from the container. In most cases, use `run` instead. Incompatible with `locksmith: true`, which needs `/etc/caution/` in the filesystem. |

</div>

### Source verification

<div class="procfile-source-verification-table" markdown>

| Field | Description |
|-------|-------------|
| `app_sources` | Comma-separated git URLs for app source verification. Embedded in the enclave manifest for attestation. |
| `enclave_sources` | Comma-separated git URLs for enclave source verification. |
| `metadata` | Custom metadata string included in the manifest. |

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
| `domain` | - | Domain name for the deployment. |
| `e2e` | `false` | Enable end-to-end encryption via STEVE proxy. |
| `locksmith` | `false` | Enable [Locksmith](../concepts/key-services.md) secret management. Runs locksmithd inside the enclave to receive sharded secrets via quorum. |
| `debug` | `false` | Enable [debug mode](../debug-enclave/running.md). Allows reading enclave console output but disables attestation verification. |
| `no_cache` | `false` | Disable Docker build cache. |
| `ssh_keys` | - | OpenSSH public keys for [host SSH access](../debug-enclave/running.md#add-ssh-access-to-the-host). Full key string, e.g. `ssh-ed25519 AAAA... user@host`. Opens port 22 on the instance. |
| `ports` | - | Comma-separated list of ports to expose (vsock proxy + security group ingress). Do not include ports in the reserved `49500`-`49600` range. |
| `http_port` | - | Port to reverse proxy through Caddy (TLS termination on 443). Must be listed in `ports`. Defaults to the single port if only one is specified. |
| `managed_on_prem` | `false` | Enable bring-your-own-compute (BYOC) deployment settings in Procfile. Requires `platform` and provider-specific configuration. |
| `platform` | - | Compute platform for BYOC. Currently supported value: `aws`. Required when `managed_on_prem: true`. |
| `aws_region` | - | AWS region for BYOC (for example `us-east-1`). Required when `managed_on_prem: true` and `platform: aws`. |
| `aws_instance_type` | - | Optional BYOC override for the AWS instance type. |
| `aws_vpc_id` | - | Optional existing VPC ID for BYOC deployments. |
| `aws_subnet_id` | - | Optional existing subnet ID for BYOC deployments. |
| `aws_security_group_id` | - | Optional existing security group ID for BYOC deployments. |

## Reserved ports

The reserved app-facing range is `49500`-`49600`. User apps should not declare ports in that range in `ports`, `http_port`, or application startup commands. Choose the port your app already uses, as long as it is outside the reserved range.

Current reserved/internal service ports:

| Port | Service |
|------|---------|
| `49500` | STEVE proxy for `/e2p/*` traffic (when `e2e: true`) |
| `49501` | Auxiliary internal proxy slot |
| `49502` | bootproofd internal attestation service, proxied to the public `/attestation` path |
| `49504` | Locksmith shard receiver (when `locksmith: true`) |

The public attestation endpoint is the deployment's app URL plus `/attestation`; do not add `:49502` unless your operator explicitly exposes that internal port.

## Examples

Use these examples as starting points. Port `3000` is only a placeholder; adjust commands, ports, and domains to match your application.

### Basic application

```yaml
run: /app/server
domain: api.example.com
app_sources: https://codeberg.org/example/api
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
app_sources: https://codeberg.org/example/secure-app
```

Since only one port is specified, it is automatically used as the `http_port`.

### With Locksmith secret management

```yaml
run: /app/server --port 3000
locksmith: true
ports: 3000
domain: secrets.example.com
app_sources: https://codeberg.org/example/secret-app
```

Before deploying, generate a quorum, run `caution secret encrypt` to write
encrypted `.caution/secrets/*.asc` files, and add the bundle and secrets to
your `Containerfile`:

```dockerfile
ADD .caution/quorum-bundle.json /etc/caution/bundle.json
ADD .caution/secrets/ /etc/caution/secrets/
```

!!! warning "Do not combine `binary:` with Locksmith"
    `binary:` extracts only the named binary and drops the rest of the
    filesystem — including `/etc/caution/`. The bundle never reaches the EIF
    and `locksmithd` panics at boot with `has bundle: No such file or
    directory`. Use `run:` (full filesystem) when `locksmith: true`.

After deploying, send shards with `caution secret send-shard` from the
host-toolchain untrusted CLI build (`make install-cli-untrusted`). See
[Key services](../concepts/key-services.md) for the full setup flow, why this
build is called untrusted, and the current shard-sending build requirement.

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
