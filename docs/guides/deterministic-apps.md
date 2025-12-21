---
icon: lucide/cog
---

# Making Your Application Deterministic

A guide to ensuring your application builds reproducibly.

## Why determinism matters

For Caution's verification to work, your application must build deterministically. This means the same source code always produces the same binary output.

## Common sources of non-determinism

### Timestamps

Many build tools embed timestamps in output files.

```bash
# Bad: includes build timestamp
gcc -o app main.c

# Good: use reproducible flags
gcc -o app main.c -Wno-builtin-macro-redefined \
    -D__DATE__="\"Jan 01 2000\"" \
    -D__TIME__="\"00:00:00\""
```

### File ordering

File system ordering can vary between builds.

### Random values

Avoid random values at build time.

### Absolute paths

Use relative paths in your build configuration.

## Language-specific guidance

### Python

<!-- TODO: Python-specific tips -->

### Node.js

<!-- TODO: Node.js-specific tips -->

### Go

<!-- TODO: Go-specific tips -->

### Rust

<!-- TODO: Rust-specific tips -->

## Testing reproducibility

```bash
# Build twice and compare
caution build
mv output output-1
caution build
diff -r output output-1
```

## Learn more

- [Reproducibility & bootstrapping](../concepts/reproducibility.md)
