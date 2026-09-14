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
    app_sources = ["https://git.example.com/myorg/myapp"]
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
  app_sources   = ["https://git.example.com/myorg/myapp"]
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

The `network` block holds IPv4 `ingress` and `egress` allowlists, optional
`recovery_ingress` sources, and an optional `http` block. Repeat the rule blocks
to allow additional source/destination, protocol, and port combinations.

```hcl
network {
  ingress {
    cidr_ipv4   = "198.51.100.0/24"
    port        = 8080
    ip_protocol = "tcp"
  }
  ingress {
    cidr_ipv4  = "203.0.113.0/24"
    start_port = 40000
    end_port   = 40005
  }
  egress {
    cidr_ipv4   = "192.0.2.8/32"
    ip_protocol = "tcp"
    port        = 443
  }
  egress {
    cidr_ipv4   = "10.0.100.1/32"
    ip_protocol = "udp"
    port        = 53
  }
  egress {
    cidr_ipv4   = "10.0.100.1/32"
    ip_protocol = "tcp"
    port        = 53
  }
  recovery_ingress {
    cidr_ipv4 = "203.0.113.8/32"
  }

  http {
    domain = "api.example.com"
    port   = 8080
  }
}
```

The `192.0.2.*`, `198.51.100.*`, and `203.0.113.*` addresses are documentation
ranges: replace them with your actual destinations and client sources.
`10.0.100.1` is the platform's parent DNS relay.

#### Rule fields and validation

| Field | Description |
|-------|-------------|
| `cidr_ipv4` | **Required.** Source CIDR for ingress, destination CIDR for egress. Host bits are normalized to the network address. |
| `port` | A single port from `1` to `65535`. Use instead of the range fields. |
| `start_port` / `end_port` | A complete, inclusive, ascending port range. Use instead of `port`. |
| `ip_protocol` | Ingress: `"tcp"` or `"6"`. Egress also accepts `"udp"`/`"17"` and `"all"`/`"-1"`. |

Omitting `ip_protocol` means TCP when ports are present, or all protocols for
an egress rule without ports. TCP/UDP rules require a port or range;
all-protocol rules must not specify ports. UDP ingress is not supported.
Unknown rule fields, explicit null attributes, mixed port forms, zero ports,
IPv6 CIDRs, and unsupported protocols are rejected rather than ignored.

Limits are **40 declared rules** across ingress, egress, and explicit recovery
sources (before deduplication), **32 distinct ingress ports**, and **55 generated
application/recovery security-group rules**. HTTP routing can expand a declaration
into multiple security-group rules. Policies exceeding these limits are rejected,
not truncated.

#### `ingress`

Raw TCP ports retain their own source CIDRs. Rules covering `http.port` instead
set the allowed sources for the HTTP/HTTPS and STEVE application routes; that
upstream port is not also exposed as a public raw listener. HTTP source checks
use the connection's peer address, not forwarded headers. A reverse proxy's
address is therefore the source seen by this check.

Security groups and host filters enforce the same source/port restrictions;
adding a more permissive security group does not bypass the host checks.
Direct IPv6 application ingress is blocked. TCP 80 still serves the platform's
public readiness and attestation endpoints: restricting application sources does
not make those management endpoints private.

Do not use TCP 22 or the reserved `49500`–`49600` range for application ingress.
Ports 80 and 443 may only be private `http.port` upstreams, not raw listeners.
Attested TLS needs a different upstream port because enclave Caddy owns 80/443.

#### `egress`

Omit all `egress` blocks (or use `egress = []`) to disable the guest's outbound
tunnel. To allow all outbound IPv4 protocols and destinations, subject to the
protected host/metadata exclusions below, explicitly choose:

```hcl
egress { cidr_ipv4 = "0.0.0.0/0" }
```

Restricted rules allow only their destination CIDRs, protocols, and ports, with
stateful replies for allowed connections. IPv6 guest traffic, instance metadata,
link-local credentials, and other parent-host services remain blocked even with
broad egress. DHCP and explicitly permitted parent DNS are narrow exceptions.

DNS is not implicitly allowed. To use the parent relay, permit `10.0.100.1:53`
for UDP and TCP as shown above, or use rules that already cover those tuples.
An explicitly permitted external DNS server is also possible. DNS permission
is not a domain-name allowlist for application traffic.

Source, helper, and EIF transfers use the API, builder, object storage, and parent
host; they do not need guest S3/HTTPS exceptions. Parent-originated package and
artifact operations are outside the guest egress policy.

#### `recovery_ingress`

Each block takes only `cidr_ipv4` and controls access to the Locksmith shard
receiver when recovery is enabled. Omission inherits the HTTP application source
CIDRs; `recovery_ingress = []` denies all sources. A recovery workload without
HTTP must declare its recovery sources. These rules control connectivity, not
shard authorization.

#### Applying policy changes

The CLI and API validate policies for new deployments. Policy installation must
succeed before public proxies and enclave startup; tunnel restarts reapply the
policy without removing its enforcement barrier. Existing deployments are not
retroactively changed: redeploy to replace the host/enclave pair.

Historical reproduction retains the original configuration's build behavior;
accepting it for verification does not make it valid for a new deployment.
Network enforcement is a host/infrastructure control, not an enclave-attested
guarantee against a malicious parent host.

#### `http`

The `http` block fronts one port with TLS on port 443. By default TLS terminates on the host; with [Attested TLS](deployment-configuration.md#attested-tls-compatibility-mode), it terminates inside the enclave.

| Field | Description |
|-------|-------------|
| `domain` | Custom subdomain for HTTP and TLS routing. Point its customer-owned CNAME at the deployment's stable `DNS target`; see [Set up a custom domain](../guides/set-up-a-custom-domain.md). |
| `port` | Port to reverse proxy through Caddy. **Must be covered by an `ingress` rule.** |
| `upstream_protocol` | Protocol used by enclave Caddy to reach the application in Attested TLS mode. Defaults to `"http"`; use `"h2c"` for gRPC. |
| `e2e_encryption` | Optional block selecting [STEVE or Attested TLS](#encryption-modes). |

#### Encryption modes

Add an `e2e_encryption` block inside `http` to select STEVE end-to-end encryption or Attested TLS.

STEVE uses an attestation-aware client and provides application-layer encryption:

```hcl
http {
  domain = "secure.example.com"
  port   = 8080
  e2e_encryption {
    mode         = "steve"
    key_exchange = "x25519"
    cors_origins = ["https://app.example.com"]
  }
}
```

| Field | Default | Description |
|-------|---------|-------------|
| `mode` | - | Set `"steve"` for STEVE v2 or `"tls"` for Attested TLS. |
| `enabled` | - | Deprecated compatibility field. `true` is equivalent to `mode = "steve"` when `mode` is omitted. |
| `key_exchange` | `"x25519"` | STEVE key exchange. Supported values are `"x25519"` and `"xwing-draft10"`. |
| `cors_origins` | - | Exact HTTP(S) browser origins allowed to call `/e2p/v2/*`. Wildcards are rejected. |
| `allow_plaintext_fallback` | `false` | Legacy compatibility opt-in for ordinary plaintext application forwarding. Leave disabled for fail-closed routing. |

`key_exchange`, `cors_origins`, and `allow_plaintext_fallback` are STEVE-specific and should be used with `mode = "steve"`. The client must pin the matching key-exchange identifier; STEVE does not negotiate or fall back to another suite. Changing the suite requires a new deployment and changes the measured enclave configuration.

See [Use STEVE clients](../guides/use-steve-clients.md) for browser, CLI, Rust, and Swift integration, including pinned PCRs, upgrade allowlists, and TOFU.

STEVE is fail-closed by default. When `allow_plaintext_fallback` is omitted or `false`, an ordinary application request that does not use E2P is rejected with `403 {"error":"e2e_required"}` and `Cache-Control: no-store` without contacting the application.

Set `allow_plaintext_fallback = true` only while migrating legacy clients that cannot yet use STEVE. It restores ordinary plaintext forwarding through STEVE and therefore removes the end-to-end encryption guarantee for those requests. Remove the option after migration.

Attested TLS works with ordinary HTTPS clients and terminates TLS inside the enclave:

```hcl
http {
  domain = "secure.example.com"
  port   = 8080
  e2e_encryption {
    mode = "tls"
  }
}
```

Attested TLS requires egress permitting DNS and certificate-authority connections;
there are no implicit DNS or ACME exceptions. Its HTTP source policy must include
`0.0.0.0/0`: restricted-source Attested TLS is currently rejected because
challenge-only forwarding is not implemented. Use STEVE if restricted application
sources are required rather than broadening access just to pass validation.
Periodic external verification of the attested certificate fingerprint is also
required. See [Deployment configuration](deployment-configuration.md#attested-tls-compatibility-mode)
for the complete security procedure.

For a gRPC application, set the upstream protocol to h2c (cleartext HTTP/2). Client connections still use TLS; only the enclave-local connection from Caddy to the application is cleartext:

```hcl
http {
  domain            = "grpc.example.com"
  port              = 50051
  upstream_protocol = "h2c"
  e2e_encryption {
    mode = "tls"
  }
}
```

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

The reserved app-facing range is `49500`-`49600`. User apps must not declare ports in that range in `ingress`, `http`, or application startup commands. These listener reservations do not restrict remote destination ports in `egress`. TCP 22 is also unavailable for application ingress; ports 80 and 443 have the [HTTP upstream restrictions](#ingress) described above.

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
    app_sources = ["https://git.example.com/example/api"]
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
    app_sources = ["https://git.example.com/example/secure-app"]
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
        mode         = "steve"
        key_exchange = "x25519"
        cors_origins = ["https://app.example.com"]
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
    app_sources = ["https://git.example.com/example/secret-app"]
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
