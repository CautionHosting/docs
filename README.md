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

## AI agents

The build generates `/llms.txt`, `/llms-full.txt` and a Markdown copy of each page at `<page>/index.md`, configured under `[project.plugins.llmstxt]` in `zensical.toml`. Pages in `quickstart/`, `guides/`, `concepts/`, `reference/` and `releases/` are included automatically; add new top-level pages to `sections` explicitly.

## Moving a page

Delete the old file, then add the old path to `redirect_maps` in `zensical.toml`.

## Commands

- `make dev` — Build and start the local development server.
- `make down` — Stop the running development server from another terminal.
- `make build-prod` — Build the site and package it in the production image.
