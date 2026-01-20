---
icon: lucide/box
---

# Containerizing your application

Caution deploys containerized applications. This guide covers how to containerize your app and make it reproducible for full verifiability.

## Requirements

Your application needs:

1. A `Containerfile` (or `Dockerfile`) that builds your application
2. A `Procfile` that tells Caution how to run it

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

## Making your application reproducible

For full verifiability, your application must be [reproducible](../concepts/reproducibility.md) - building it twice produces bit-for-bit identical outputs.

### The full stack

Caution's verifiability extends from your application down to the kernel:

```
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

[StageX](https://stagex.tools) provides reproducible, full-source bootstrapped base images. When you build your application on StageX and make it deterministic, the entire stack becomes verifiable.

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

See [stagex.tools](https://stagex.tools/packages) for the full list of available packages.

### Setting SOURCE_DATE_EPOCH

One of the most common sources of non-determinism are timestamps.

To eliminate timestamp variations, set `SOURCE_DATE_EPOCH` in your build:

```dockerfile
ENV SOURCE_DATE_EPOCH=1
```

### Further Help

If you have issues with making your application deterministic, join the [StageX Matrix Room](https://matrix.to/#/#stagex:matrix.org)

## Learn more

- [Reproducibility](../concepts/reproducibility.md) - Why deterministic builds matter
- [Verifiability](../concepts/verifiability.md) - How Caution ensures code integrity
- [StageX documentation](https://stagex.tools) - Reproducible base images
