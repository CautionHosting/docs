---
icon: lucide/info
---

# caution describe

Show project deployment information.

## Usage

```bash
caution describe
```

## Description

Displays information about the current project's Caution deployment, including app ID, status, and URLs.

## Output

```bash
$ caution describe
Project: my-api
App ID:  550e8400-e29b-41d4-a716-446655440000
Status:  running
URL:     https://my-api.caution.app

Attestation endpoint: https://my-api.caution.app:5000/attestation

Last deployed: 2025-01-15T10:30:00Z
Commit:        abc1234
```

## Requirements

Must be run from a directory with a `.caution/deployment.json` file (created after first deployment).

## See also

- [caution apps](apps.md) - Manage all applications
- [caution verify](verify.md) - Verify deployment integrity
