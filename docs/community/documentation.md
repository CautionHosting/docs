---
icon: lucide/file-pen-line
---

# Documentation

Good documentation helps everyone. Contributing to docs is a great way to get started with the project.

## Types of contributions

- **Fix typos and errors** - Small fixes are always welcome
- **Improve clarity** - Rewrite confusing sections
- **Add examples** - Show how features work in practice
- **Write guides** - Create tutorials for common tasks
- **Translate** - Help make docs accessible to more people

## Documentation structure

```
docs/
├── get-started/        # Onboarding and setup
├── cli/                # CLI command reference
├── concepts/           # Core concepts explained
├── reference/          # Technical specifications
├── guides/             # How-to guides
└── community/          # Community and contributing
```

## Style guide

- **Be concise** - Say more with fewer words
- **Use examples** - Show, don't just tell
- **Active voice** - "Run the command" not "The command should be run"
- **Present tense** - "This creates a file" not "This will create a file"

## Building locally

To preview documentation changes:

```bash
cd docs
zensical serve
```

This starts a local server at `http://localhost:8000`.

## Submitting changes

1. Fork the repository
2. Create a branch for your changes
3. Make your edits
4. Test locally with `zensical serve`
5. Submit a pull request

## Markdown features

We use Zensical, which supports:

- Admonitions (`!!! note`, `!!! warning`)
- Code blocks with syntax highlighting
- Tabs for OS-specific content
- Collapsible sections
- Icons from Lucide

See existing docs for examples of these features.
