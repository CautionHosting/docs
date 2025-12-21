---
icon: lucide/git-branch
---

# Deploying with git push


Deploy applications using familiar git workflows.

## Overview

Lorem ipsum dolor sit amet, consectetur adipiscing elit.

## Prerequisites

1. [Register an account](../cli/register.md)
2. [Add your SSH key](../cli/ssh-keys.md)
3. [Initialize your project](../cli/init.md)

## Deployment flow

```bash
# 1. Initialize (one time)
caution init

# 2. Make changes
vim app.py

# 3. Commit
git add . && git commit -m "Update app"

# 4. Deploy
git push caution main
```

## What happens on push

```
┌─────────────────────────────────────────────────────────────┐
│ git push caution main                                       │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│ 1. Lorem ipsum dolor sit amet                               │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. Lorem ipsum dolor sit amet                               │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. Lorem ipsum dolor sit amet                               │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. Lorem ipsum dolor sit amet                               │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. Lorem ipsum dolor sit amet                               │
└─────────────────────────────────────────────────────────────┘
```

## The Procfile

Lorem ipsum dolor sit amet:

```procfile
web: ./my-app --port $PORT
```

See [Procfile reference](../reference/procfile.md) for all options.

## Branches

Lorem ipsum dolor sit amet:

```bash
# This deploys
git push caution main

# This does NOT deploy
git push caution feature-branch
```

## Viewing logs

Lorem ipsum dolor sit amet:

```bash
caution logs <app-id>
```

## Rollbacks

Lorem ipsum dolor sit amet:

```bash
git revert HEAD
git push caution main
```

Lorem ipsum dolor sit amet:

```bash
git reset --hard HEAD~1
git push caution main --force
```

## Verification after deploy

Lorem ipsum dolor sit amet:

```bash
caution verify --reproduce <app-id>
```

## Troubleshooting

### "Permission denied (publickey)"

Lorem ipsum dolor sit amet:

```bash
caution ssh-keys add ~/.ssh/id_ed25519.pub
```

### Build fails

Lorem ipsum dolor sit amet:

```bash
./build.sh
```

### Deployment stuck

Lorem ipsum dolor sit amet:

```bash
caution apps get <app-id>
```

## Learn more

- [Quickstart](../get-started/quickstart.md)
- [Procfile reference](../reference/procfile.md)
- [caution verify](../cli/verify.md)
