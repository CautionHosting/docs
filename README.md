# Caution Documentation

> **Note:** This documentation site is under active development and is not yet production-ready. Content may be incomplete or contain placeholder text.

Documentation for [Caution](https://codeberg.org/caution/platform), the generalized verifiable compute platform.

## Development

### Prerequisites

- Docker

### Local development

```bash
# Start the development server
make dev
```

The site will be available at `http://localhost:5000`. Changes to `docs/`, `overrides/`, and `zensical.toml` are mounted as volumes and will be reflected automatically.

### Other commands

```bash
# Stop the development server
make down

# Rebuild the Docker image and remove old artifacts
make clean
```