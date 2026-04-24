# Caution Documentation

Documentation for [Caution](https://codeberg.org/caution), the verifiable confidential compute platform.

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
