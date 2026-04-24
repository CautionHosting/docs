---
icon: lucide/file-code
---

# Procfile reference

<p class="docs-home-intro">Configure how your application runs on Caution.</p>

## Overview

The `Procfile` is a simple key-value configuration file that tells Caution how to build and run your application inside a confidential enclave. Place it in the root of your repository.

```yaml
run: /app/server
domain: your-domain.xyz
app_sources: https://codeberg.org/myorg/myapp
```

## Fields

### Build configuration

!!! warning "`binary` vs `run`"
    The `binary` field extracts **only** the specified binary from your container. No config files, shared libraries, or other filesystem contents are included in the EIF. This is suitable only for fully self-contained static binaries. For most applications, use `run` instead, which includes the full container filesystem in the EIF.

<div class="procfile-build-config-table" markdown>

| Field | Description |
|-------|-------------|
| `run` | **Required.** Command to execute your application. The full container filesystem is included in the EIF. |
| `containerfile` | Path to a Containerfile/Dockerfile for building your app. |
| `build` | Build command to run before packaging. |
| `oci_tarball` | Path to a pre-built OCI tarball. |
| `binary` | Path to a static binary in the container. **Only that binary is extracted.** The rest of the container filesystem is not included in the EIF. Use this only for fully self-contained static binaries that do not depend on config files, shared libraries, or other files from the container. In most cases, use `run` instead. |

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
| `debug` | `false` | Enable [debug mode](debugging.md). Allows reading enclave console output but disables attestation verification. |
| `no_cache` | `false` | Disable Docker build cache. |
| `ssh_keys` | - | OpenSSH public keys for [host SSH access](debugging.md#add-ssh-access-to-the-host). Full key string, e.g. `ssh-ed25519 AAAA... user@host`. Opens port 22 on the instance. |
| `ports` | - | Comma-separated list of ports to expose (vsock proxy + security group ingress). |
| `http_port` | - | Port to reverse proxy through Caddy (TLS termination on 443). Must be listed in `ports`. Defaults to the single port if only one is specified. |

## Reserved ports

The following ports are reserved for internal enclave services:

| Port | Service |
|------|---------|
| `8080` | STEVE encryption proxy (when `e2e: true`) |
| `8081` | Internal enclave services |
| `8082` | Attestation service |
| `8084` | Locksmith shard receiver (when `locksmith: true`) |

Your application should listen on port `8083` or another unreserved port.

## Examples

### Basic application

```yaml
run: /app/server
domain: api.example.com
app_sources: https://codeberg.org/example/api
```

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
run: /app/server --port 8083
domain: secure.example.com
e2e: true
ports: 8083
app_sources: https://codeberg.org/example/secure-app
```

Since only one port is specified, it is automatically used as the `http_port`.

### With Locksmith secret management

```yaml
run: /app/server --port 8083
locksmith: true
ports: 8083
domain: secrets.example.com
app_sources: https://codeberg.org/example/secret-app
```

After deploying, send shards with `caution secret send-shard`.

### Custom resources with multiple ports

```yaml
run: /app/ml-inference
memory: 4096
cpus: 4
ports: 8083, 9000
http_port: 8083
```

With multiple ports, `http_port` is required to specify which port Caddy should reverse proxy. Port 9000 is exposed as raw TCP.

### Bring your own cloud (AWS)

```yaml
run: /app/server
aws_region: us-east-1
```
