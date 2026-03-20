---
icon: lucide/file-code
---

# Procfile reference

Configure how your application runs on Caution.

## Overview

The `Procfile` is a simple key-value configuration file that tells Caution how to build and run your application inside a confidential enclave. Place it in the root of your repository.

```
run: /app/server
domain: your-domain.xyz
app_sources: https://codeberg.org/myorg/myapp
```

## Fields

### Build configuration

| Field | Description |
|-------|-------------|
| `run` | **Required.** Command to execute your application. |
| `containerfile` | Path to a Containerfile/Dockerfile for building your app. |
| `build` | Build command to run before packaging. |
| `oci_tarball` | Path to a pre-built OCI tarball. |
| `binary` | Path to the compiled binary in the enclave. |

### Source verification

| Field | Description |
|-------|-------------|
| `app_sources` | Comma-separated git URLs for app source verification. Embedded in the enclave manifest for attestation. |
| `enclave_sources` | Comma-separated git URLs for enclave source verification. |
| `metadata` | Custom metadata string included in the manifest. |

### Resource allocation

| Field | Default | Description |
|-------|---------|-------------|
| `memory` | `512` | Memory allocation in MB. |
| `cpus` | `2` | Number of vCPUs. |

### Features

| Field | Default | Description |
|-------|---------|-------------|
| `domain` | — | Domain name for the deployment. |
| `e2e` | `false` | Enable end-to-end encryption via STEVE proxy. |
| `debug` | `false` | Enable debug mode. |
| `no_cache` | `false` | Disable Docker build cache. |
| `ssh_keys` | — | SSH public keys for enclave access. |
| `ports` | — | Comma-separated list of ports to expose (vsock proxy + security group ingress). |
| `http_port` | — | Port to reverse proxy through Caddy (TLS termination on 443). Must be listed in `ports`. Defaults to the single port if only one is specified. |

## Reserved ports

The following ports are reserved for internal enclave services:

| Port | Service |
|------|---------|
| `8080` | STEVE encryption proxy (when `e2e: true`) |
| `8081` | Internal enclave services |
| `8082` | Attestation service |

Your application should listen on port `8083` or another unreserved port.

## Examples

### Basic application

```
run: /app/server
domain: api.example.com
app_sources: https://codeberg.org/example/api
```

### With HTTP and TCP ports

```
run: /app/server --rpc-port 8232 --p2p-port 8233
ports: 8232, 8233
http_port: 8232
domain: node.example.com
```

In this example, port 8232 (RPC) is reverse-proxied through Caddy with TLS on port 443. Port 8233 (P2P) gets a vsock proxy and security group rule but is accessed directly as raw TCP.

### With end-to-end encryption

```
run: /app/server --port 8083
domain: secure.example.com
e2e: true
ports: 8083
app_sources: https://codeberg.org/example/secure-app
```

Since only one port is specified, it is automatically used as the `http_port`.

### Custom resources with multiple ports

```
run: /app/ml-inference
memory: 4096
cpus: 4
ports: 8083, 9000
http_port: 8083
```

With multiple ports, `http_port` is required to specify which port Caddy should reverse proxy. Port 9000 is exposed as raw TCP.

### Managed on-prem (AWS)

```
run: /app/server
aws_region: us-east-1
```
