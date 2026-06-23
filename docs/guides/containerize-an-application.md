---
icon: lucide/box
---

# Containerize an application

<p class="docs-home-intro">Create a container image for a Caution app and make the build reproducible for verifiable deployments.</p>

## Before you start

Your application needs:

1. A `Containerfile` (or `Dockerfile`) that builds your application with `docker build -f <file> .` from the repository root
2. A `caution.hcl` that tells Caution how to run it

!!! tip "Using an AI coding agent?"
    Install the [`stagex-reproducible-builds` skill](build-with-an-ai-agent.md) so Claude Code or Codex can write a reproducible `Containerfile` for you.

## Basic Containerfile

A minimal Containerfile for a Rust application:

```dockerfile
FROM stagex/pallet-rust@sha256:9c38bf1066dd9ad1b6a6b584974dd798c2bf798985bf82e58024fbe0515592ca AS build
WORKDIR /app
COPY . .
RUN --network=none <<-EOF
       ARCH="$(uname -m)"
       cargo build \
               --frozen \
               --release \
               --target "${ARCH}-unknown-linux-musl" \
               --bin myapp
       cp "target/${ARCH}-unknown-linux-musl/release/myapp" /myapp
EOF

FROM stagex/core-filesystem@sha256:58a29a7a3a60559b999b6009a47ebaaf80fb669f2954706821400db7796ae8f AS run
COPY --from=build /myapp /app/myapp
ENTRYPOINT ["/app/myapp"]
```

## Build behavior in Caution

Caution builds application containers with the standard Docker form:

```bash
docker build -f <containerfile> .
```

The build context is the repository root. Replace `<containerfile>` with the file your project uses, such as `Containerfile` or `Dockerfile`. If your `caution.hcl` sets `containerfile`, test the same path locally:

```bash
docker build -f deploy/Containerfile .
```

Caution does not run a custom build command in `caution.hcl`, and it does not pass extra Docker build arguments. If your build needs public configuration, make it part of the image inputs instead:

```dockerfile
ENV APP_PORT=3000
ENV LOG_LEVEL=info
COPY config/production.toml /etc/myapp/config.toml
```

Do not bake secrets into the image. Use [Locksmith](../concepts/key-services.md) for secret values that must only be decrypted inside the enclave.

## Making your application reproducible

For full verifiability, your application must be [reproducible](../concepts/reproducibility.md) - building it twice produces bit-for-bit identical outputs.

### The full stack

Caution's verifiability extends from your application down to the kernel:

```text
┌─────────────────────────────┐
│     Your Application        │  ← You make this reproducible
├─────────────────────────────┤
│     StageX Base Images      │  ← Already reproducible
├─────────────────────────────┤
│     EnclaveOS               │  ← Already reproducible
├─────────────────────────────┤
│     Linux Kernel            │  ← Already reproducible
└─────────────────────────────┘
```

[StageX](https://stagex.tools){:target="_blank"} provides reproducible, full-source bootstrapped base images. When you build your application on StageX and make it deterministic, the entire stack becomes verifiable.

### Using StageX images

StageX images are designed for reproducibility. Use them as your base:

```dockerfile
FROM stagex/pallet-rust
```

Available images include:

- `stagex/pallet-rust` - Rust toolchain
- `stagex/pallet-nodejs` - Node.js runtime
- `stagex/pallet-python` - Python runtime
- `stagex/pallet-go` - Go toolchain

See [stagex.tools](https://stagex.tools/packages){:target="_blank"} for the full list of available packages.

### Setting SOURCE_DATE_EPOCH

One of the most common sources of non-determinism are timestamps.

To eliminate timestamp variations, set `SOURCE_DATE_EPOCH` in your build:

```dockerfile
ENV SOURCE_DATE_EPOCH=1
```

!!! tip "Need help with deterministic builds?"
    If you're having trouble making your application deterministic, ask in the [StageX Matrix Room](https://matrix.to/#/#stagex:matrix.org){:target="_blank"}.

## See also

<div class="grid cards" markdown>

- :lucide-file-text: **StageX**

    ---

    Learn about full-source bootstrapping and reproducibility in the [StageX paper](https://codeberg.org/stagex/whitepapers/src/branch/main/out/stagex.pdf){:target="_blank"}.

- :lucide-refresh-cw: **Reproducibility**

    ---

    Enable independent verification with [deterministic builds](../concepts/reproducibility.md).

</div>
