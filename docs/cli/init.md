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

Prepares your project for deployment to Caution by creating the necessary configuration files and setting up the git remote.

## What happens

1. Creates a `Procfile` if one doesn't exist
2. Sets up a `.caution/` directory for deployment metadata
3. Adds a `caution` git remote for deployment

## Files created

### Procfile

Defines how your application runs:

```procfile
web: ./your-binary --port $PORT
```

### .caution/deployment.json

Stores deployment information (created after first deploy).

## Example

```bash
$ cd my-project
$ caution init
✓ Created Procfile
✓ Added git remote 'caution'

Next steps:
  1. Edit your Procfile
  2. git add . && git commit -m "Add Caution config"
  3. git push caution main
```

## See also

- [Procfile reference](../reference/procfile.md) - Procfile format details
- [Deploying with Git Push](../guides/git-push-deploy.md) - Deployment workflow
