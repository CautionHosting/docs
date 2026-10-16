# Caution Documentation

Source for [Caution’s documentation](https://docs.caution.co), built with [Zensical](https://zensical.org). Caution is a verifiable confidential compute platform.

## Local development

Requires Docker and Make. Run from the repository root:

```bash
make dev
```

Open http://localhost:5000. The server runs in your terminal, with local documentation, theme overrides, and configuration mounted into the container for live preview.

## Editing

- `docs/` — Markdown pages, images, and custom CSS and JavaScript.
- `zensical.toml` — Site configuration and navigation. Add new pages to the navigation here.
- `overrides/` — Custom theme templates.

Run `make build-prod` to check that the site builds before submitting changes.

## Commands

| Command | Description |
| --- | --- |
| `make dev` | Build and start the local development server |
| `make down` | Stop the running development server from another terminal |
| `make build-prod` | Build the site and package it in the production image |
