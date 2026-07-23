---
icon: lucide/file-code
---

# caution.hcl reference

<p class="docs-home-intro">Configure how your application runs on Caution.</p>

## Overview

`caution.hcl` is the [HCL](https://github.com/hashicorp/hcl) configuration file that tells Caution how to build, run, and verify your application. Place it in the root of your repository. `caution init` generates a template for you.

When both `caution.hcl` and a [`Procfile`](procfile.md) are present, Caution uses `caution.hcl`. To convert an existing Procfile, run `caution apps migrate-procfile`.

!!! tip "Using an AI coding agent?"
    Install the [`caution-platform` skill](../guides/build-with-an-ai-agent.md) so Claude Code or Codex can author and validate your `caution.hcl`.

```hcl
enclave "main" {
  build {
    app_sources = ["https://codeberg.org/myorg/myapp"]
  }

  network {
    ingress {
      cidr_ipv4 = "0.0.0.0/0"
      port      = 8080
    }
    http {
      domain = "your-domain.xyz"
      port   = 8080
    }
  }

  unit "default" {
    command = "/app/server"
  }
}
```

## Structure

A config file has an optional top-level `caution { }` block for account- and provider-level settings, and exactly one `enclave "<name>" { }` block describing the workload.

```hcl
caution {
  # account / provider settings
}

enclave "main" {
  build     { }   # what to build
  resources { }   # cpu / memory
  network   { }   # ingress, egress, http
  debug     { }   # debug + ssh access
  unit "default" { }   # the command to run
}
```

!!! warning "One enclave only"
    Define a single `enclave` block. Multiple enclaves are rejected.

## Fields

### `unit` — the command to run

The `unit "default"` block is **required**. Caution runs the command from the unit named `default`; a unit with any other name is ignored for startup.

```hcl
unit "default" {
  command = "/app/server"
  args    = ["--port", "8080"]
  env = {
    LOG_LEVEL = "info"
  }
}
```

| Field | Description |
|-------|-------------|
| `command` | **Required.** Absolute path to the binary to execute. The full container filesystem is included in the EIF. |
| `args` | List of arguments passed to `command`. |
| `env` | Map of environment variables. Values must be string literals or function calls (see [Secrets](#secrets)). |

### `build` — container input

!!! warning "Use `command` by default, not `binary`"
    The `binary` field extracts only the named binary from your container. It does not include config files, shared libraries, or other filesystem contents in the EIF. Use it only for fully self-contained static binaries; for most applications omit it and rely on the `unit` `command`, which includes the full container filesystem.

!!! note "No custom build command"
    Caution builds the container with `docker build -f <containerfile> .` from the repository root. It does not run a custom pre-build command or pass extra `--build-arg` values. Put public build-time configuration in the Containerfile. Do not bake secrets into the image; use [Locksmith](../concepts/key-services.md).

```hcl
build {
  containerfile = "deploy/Containerfile"
  app_sources   = ["https://codeberg.org/myorg/myapp"]
  cache         = true
}
```

| Field | Default | Description |
|-------|---------|-------------|
| `containerfile` | `Containerfile`/`Dockerfile` at the root | Path to a Containerfile/Dockerfile, relative to the repository root. |
| `binary` | - | Path to a static binary in the container. **Only that binary is extracted.** Use only for fully self-contained static binaries. |
| `app_sources` | - | List of git URLs for app source verification. Embedded in the enclave manifest for attestation. |
| `cache` | `true` | Set `false` to disable the Docker build cache. |

### `resources` — cpu and memory

```hcl
resources {
  cpu       = 2
  memory_mb = 512
}
```

| Field | Default | Description |
|-------|---------|-------------|
| `cpu` | `2` | Number of vCPUs. |
| `memory_mb` | `512` | Memory allocation in MB. |

### `network` — ports, traffic, and TLS

The `network` block holds `ingress`/`egress` traffic rules and an optional `http` block for TLS termination. Repeat `ingress`/`egress` blocks to add more rules.

```hcl
network {
  ingress {
    cidr_ipv4   = "0.0.0.0/0"
    port        = 8080
    ip_protocol = "tcp"
  }
  ingress {
    cidr_ipv4  = "0.0.0.0/0"
    start_port = 40000
    end_port   = 40005
  }
  egress {
    cidr_ipv4 = "0.0.0.0/0"
  }

  http {
    domain = "api.example.com"
    port   = 8080
  }
}
```

#### `ingress` / `egress`

| Field | Description |
|-------|-------------|
| `cidr_ipv4` | **Required.** Source/destination CIDR, e.g. `0.0.0.0/0`. |
| `port` | A single port. Use instead of the range fields. |
| `start_port` / `end_port` | An inclusive port range. Use instead of `port`. |
| `ip_protocol` | Protocol, e.g. `tcp`. |

Do not declare ports in the reserved `49500`-`49600` range (see [Reserved ports](#reserved-ports)).

#### `http`

The `http` block fronts one port with Caddy for TLS termination on port 443.

| Field | Description |
|-------|-------------|
| `domain` | Domain name for the deployment. |
| `port` | Port to reverse proxy through Caddy. **Must be covered by an `ingress` rule.** |
| `e2e_encryption` | Optional block enabling [end-to-end encryption](#end-to-end-encryption). |

#### End-to-end encryption

Add an `e2e_encryption` block inside `http` to enable end-to-end encryption via the STEVE proxy.

```hcl
http {
  domain = "secure.example.com"
  port   = 8080
  e2e_encryption {
    enabled      = true
    cors_origins = ["*"]
  }
}
```

| Field | Description |
|-------|-------------|
| `enabled` | Set `true` to enable end-to-end encryption. |
| `cors_origins` | List of allowed CORS origins. |

### Secrets

Reference a secret managed by [Locksmith](../concepts/key-services.md) with `env::vault(...)` in a unit's `env` map. Using `env::vault` anywhere automatically enables Locksmith for the deployment — there is no separate flag.

```hcl
unit "default" {
  command = "/app/server"
  env = {
    API_KEY = env::vault("API_KEY")
  }
}
```

Before deploying, generate a quorum, run `caution secret encrypt` to write encrypted `.caution/secrets/*.asc` files, and add the bundle and secrets to your `Containerfile`:

```dockerfile
ADD .caution/quorum-bundle.json /etc/caution/bundle.json
ADD .caution/secrets/ /etc/caution/secrets/
```

After deploying, send shards with `caution secret send-shard` from the host-toolchain CLI build, which is the default `make install-cli` (also `make install-cli-host`). See [Key services](../concepts/key-services.md) for the full setup flow.

### `debug` — console and SSH access

```hcl
debug {
  enabled  = true
  ssh_keys = ["ssh-ed25519 AAAA... user@host"]
}
```

| Field | Default | Description |
|-------|---------|-------------|
| `enabled` | `false` | Enable [debug mode](debug-enclave/running.md). Allows reading enclave console output but disables attestation verification. |
| `ssh_keys` | - | List of OpenSSH public keys for [host SSH access](debug-enclave/running.md#add-ssh-access-to-the-host). Opens port 22 on the instance. |

### `caution` / `provider` — account and BYOC

The top-level `caution { }` block holds account-level settings and an optional `provider` block for [bring-your-own-compute](byoc.md) deployments.

```hcl
caution {
  provider {
    type   = "aws"
    region = "us-east-1"
  }
}
```

| Field | Description |
|-------|-------------|
| `managed_credentials` | Path to a managed credentials file. |
| `machine_type` | Host instance type. |
| `build_machine_type` | Builder instance type. |
| `provider` | Provider block. `type` is currently `aws`; supports `region`, `vpc_id`, `subnet_ids`, `security_group_id`. |

## Reserved ports

The reserved app-facing range is `49500`-`49600`. User apps must not declare ports in that range in `ingress`, `egress`, `http`, or application startup commands. Choose the port your app already uses, as long as it is outside the reserved range.

Current reserved/internal service ports:

| Port | Service |
|------|---------|
| `49500` | STEVE proxy for `/e2p/*` traffic (when e2e encryption is enabled) |
| `49501` | Auxiliary internal proxy slot |
| `49502` | bootproofd internal attestation service, proxied to the public `/attestation` path |
| `49504` | Locksmith shard receiver (when secrets are used) |

The public attestation endpoint is the deployment's app URL plus `/attestation`; do not add `:49502` unless your operator explicitly exposes that internal port.

## Examples

Use these examples as starting points. Adjust commands, ports, and domains to match your application.

### Basic application

```hcl
enclave "main" {
  build {
    app_sources = ["https://codeberg.org/example/api"]
  }
  network {
    ingress {
      cidr_ipv4 = "0.0.0.0/0"
      port      = 8080
    }
    http {
      domain = "api.example.com"
      port   = 8080
    }
  }
  unit "default" {
    command = "/app/server"
  }
}
```

### With a custom Containerfile

```hcl
enclave "main" {
  build {
    containerfile = "deploy/Containerfile"
  }
  unit "default" {
    command = "/app/server"
  }
}
```

Caution builds this with `docker build -f deploy/Containerfile .` from the repository root.

### With HTTP and TCP ports

```hcl
enclave "main" {
  network {
    ingress {
      cidr_ipv4 = "0.0.0.0/0"
      port      = 8232
    }
    ingress {
      cidr_ipv4 = "0.0.0.0/0"
      port      = 8233
    }
    http {
      domain = "node.example.com"
      port   = 8232
    }
  }
  unit "default" {
    command = "/app/server"
    args    = ["--rpc-port", "8232", "--p2p-port", "8233"]
  }
}
```

Port 8232 (RPC) is reverse-proxied through Caddy with TLS on port 443. Port 8233 (P2P) gets an ingress rule but is accessed directly as raw TCP.

### With end-to-end encryption

```hcl
enclave "main" {
  build {
    app_sources = ["https://codeberg.org/example/secure-app"]
  }
  network {
    ingress {
      cidr_ipv4 = "0.0.0.0/0"
      port      = 3000
    }
    http {
      domain = "secure.example.com"
      port   = 3000
      e2e_encryption {
        enabled      = true
        cors_origins = ["*"]
      }
    }
  }
  unit "default" {
    command = "/app/server"
    args    = ["--port", "3000"]
  }
}
```

### With Locksmith secrets

```hcl
enclave "main" {
  build {
    app_sources = ["https://codeberg.org/example/secret-app"]
  }
  network {
    ingress {
      cidr_ipv4 = "0.0.0.0/0"
      port      = 3000
    }
    http {
      domain = "secrets.example.com"
      port   = 3000
    }
  }
  unit "default" {
    command = "/app/server"
    args    = ["--port", "3000"]
    env = {
      DATABASE_URL = env::vault("DATABASE_URL")
    }
  }
}
```

`env::vault` enables Locksmith automatically. See [Secrets](#secrets) for the bundle and shard-sending steps.

### Custom resources with multiple ports

```hcl
enclave "main" {
  resources {
    cpu       = 4
    memory_mb = 4096
  }
  network {
    ingress {
      cidr_ipv4 = "0.0.0.0/0"
      port      = 3000
    }
    ingress {
      cidr_ipv4 = "0.0.0.0/0"
      port      = 9000
    }
    http {
      domain = "ml.example.com"
      port   = 3000
    }
  }
  unit "default" {
    command = "/app/ml-inference"
  }
}
```

Port 3000 is reverse-proxied through Caddy; port 9000 is exposed as raw TCP.

### Bring your own compute (AWS)

```hcl
caution {
  provider {
    type   = "aws"
    region = "us-east-1"
  }
}

enclave "main" {
  unit "default" {
    command = "/app/server"
  }
}
```
