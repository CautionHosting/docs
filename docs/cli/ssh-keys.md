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

Lorem ipsum dolor sit amet.

```bash
caution ssh-keys list
```

### add

Lorem ipsum dolor sit amet.

```bash
caution ssh-keys add <path-to-public-key>
```

Lorem ipsum dolor sit amet:

```bash
cat ~/.ssh/id_ed25519.pub | caution ssh-keys add -
```

### remove

Lorem ipsum dolor sit amet.

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

Lorem ipsum dolor sit amet, consectetur adipiscing elit.

## See also

- [Deploying with Git Push](../guides/git-push-deploy.md)
- [caution init](init.md)
