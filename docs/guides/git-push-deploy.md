---
icon: lucide/git-branch
---

# Deploying with Git Push

Deploy applications using familiar git workflows.

## Overview

Caution uses git push for deployments, similar to Heroku. When you push to the `caution` remote, your code is built into a verifiable enclave and deployed.

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
│ 1. SSH authentication via your registered key               │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. Code received by Caution gateway                         │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. Enclave built (reproducibly)                             │
│    - Docker image created                                   │
│    - EIF packaged                                           │
│    - PCRs extracted                                         │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. Infrastructure provisioned                               │
│    - EC2 instance launched                                  │
│    - Nitro Enclave started                                  │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. Application running                                      │
│    - Attestation service available                          │
│    - Traffic routed to your app                             │
└─────────────────────────────────────────────────────────────┘
```

## The Procfile

Your `Procfile` tells Caution how to run your application:

```procfile
web: ./my-app --port $PORT
```

See [Procfile Reference](../reference/procfile.md) for all options.

## Branches

By default, only `main` triggers deployments:

```bash
# This deploys
git push caution main

# This does NOT deploy
git push caution feature-branch
```

## Viewing logs

After deployment, view your application's output:

```bash
caution logs <app-id>
```

## Rollbacks

To rollback, push a previous commit:

```bash
git revert HEAD
git push caution main
```

Or reset and force push (use with caution):

```bash
git reset --hard HEAD~1
git push caution main --force
```

## Verification after deploy

Always verify your deployment:

```bash
caution verify --reproduce <app-id>
```

This confirms the running code matches your source.

## Troubleshooting

### "Permission denied (publickey)"

Your SSH key isn't registered:

```bash
caution ssh-keys add ~/.ssh/id_ed25519.pub
```

### Build fails

Check your Procfile syntax and ensure your app builds locally:

```bash
# Test your build command locally first
./build.sh
```

### Deployment stuck

Check app status:

```bash
caution apps get <app-id>
```

## Learn more

- [Quickstart](../get-started/quickstart.md) - Full tutorial
- [Procfile Reference](../reference/procfile.md) - Configuration options
- [caution verify](../cli/verify.md) - Verify deployments
