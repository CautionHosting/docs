---
icon: lucide/cog
---

# Making your application deterministic


A guide to ensuring your application builds reproducibly.

## Why determinism matters

Lorem ipsum dolor sit amet, consectetur adipiscing elit.

## Common sources of non-determinism

### Timestamps

Lorem ipsum dolor sit amet.

```bash
# Bad: includes build timestamp
gcc -o app main.c

# Good: use reproducible flags
gcc -o app main.c -Wno-builtin-macro-redefined \
    -D__DATE__="\"Jan 01 2000\"" \
    -D__TIME__="\"00:00:00\""
```

### File ordering

Lorem ipsum dolor sit amet.

### Random values

Lorem ipsum dolor sit amet.

### Absolute paths

Lorem ipsum dolor sit amet.

## Language-specific guidance

### Python

Lorem ipsum dolor sit amet.

### Node.js

Lorem ipsum dolor sit amet.

### Go

Lorem ipsum dolor sit amet.

### Rust

Lorem ipsum dolor sit amet.

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
