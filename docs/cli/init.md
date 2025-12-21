---
icon: lucide/folder-plus
---

# caution init


Initialize a project for Caution deployment.

## Usage

```bash
caution init
```

## Description

Lorem ipsum dolor sit amet, consectetur adipiscing elit.

## What happens

1. Lorem ipsum dolor sit amet
2. Lorem ipsum dolor sit amet
3. Lorem ipsum dolor sit amet

## Files created

### Procfile

Lorem ipsum dolor sit amet:

```procfile
web: ./your-binary --port $PORT
```

### .caution/deployment.json

Lorem ipsum dolor sit amet.

## Example

```bash
$ cd my-project
$ caution init
✓ Created Procfile
✓ Added git remote 'caution'

Next steps:
  1. Edit your Procfile
  2. git add . && git commit -m "Add config"
  3. git push caution main
```

## See also

- [Procfile reference](../reference/procfile.md)
- [Deploying with Git Push](../guides/git-push-deploy.md)
