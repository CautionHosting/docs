# Caution Documentation

> **Note:** This documentation site is under active development and is not yet production-ready. Content may be incomplete or contain placeholder text.

Documentation for [Caution](https://codeberg.org/caution/platform), the generalized verifiable compute platform.

## Development

This documentation site is built with [Zensical](https://zensical.org/).

### Prerequisites

- Python 3.10+
- [uv](https://docs.astral.sh/uv/) (recommended) or pip

### Local development

```bash
# Install dependencies
uv sync

# Start the development server
uv run zensical serve
```

The site will be available at `http://localhost:8000`.

### Building

```bash
uv run zensical build
```

The built site will be in the `site/` directory.

## License

This documentation is licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).
