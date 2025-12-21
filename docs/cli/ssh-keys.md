---
icon: lucide/key
---

# caution ssh-keys

Manage SSH keys for git deployment.

## Usage

```bash
caution ssh-keys <command>
```

## Commands

### list

List all registered SSH keys.

```bash
caution ssh-keys list
```

### add

Add a new SSH key.

```bash
caution ssh-keys add <path-to-public-key>
```

Or pipe from stdin:

```bash
cat ~/.ssh/id_ed25519.pub | caution ssh-keys add -
```

### remove

Remove an SSH key.

```bash
caution ssh-keys remove <key-id>
```

## Example

```bash
$ caution ssh-keys add ~/.ssh/id_ed25519.pub
✓ SSH key added

$ caution ssh-keys list
ID                                    FINGERPRINT                           ADDED
550e8400-e29b-41d4-a716-446655440000  SHA256:abc123...                      2025-01-15
```

## Why SSH keys?

SSH keys are used to authenticate `git push` operations to the Caution deployment server. When you run `git push caution main`, your SSH key proves your identity.

## See also

- [Deploying with Git Push](../guides/git-push-deploy.md) - The deployment workflow
- [caution init](init.md) - Set up git remote
