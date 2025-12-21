---
icon: lucide/box
---

# caution apps

Manage your deployed applications.

## Usage

```bash
caution apps <command>
```

## Commands

### list

List all deployed applications.

```bash
caution apps list
```

### get

Get details about a specific application.

```bash
caution apps get <app-id>
```

### create

Create a new application (typically done automatically via `git push`).

```bash
caution apps create --name <name>
```

### destroy

Destroy an application and its infrastructure.

```bash
caution apps destroy <app-id>
```

!!! warning
    This permanently destroys the application and all associated resources. This action cannot be undone.

## Example

```bash
$ caution apps list
ID                                    NAME           STATUS
550e8400-e29b-41d4-a716-446655440000  my-api         running
6ba7b810-9dad-11d1-80b4-00c04fd430c8  worker-service running

$ caution apps get 550e8400-e29b-41d4-a716-446655440000
Name:      my-api
Status:    running
URL:       https://my-api.caution.app
Created:   2025-01-15T10:30:00Z
PCR0:      abc123...
```

## See also

- [caution verify](verify.md) - Verify application integrity
- [caution describe](describe.md) - Show project info
